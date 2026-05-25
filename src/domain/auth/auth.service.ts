import { prisma } from '../../lib/prisma';
import { hashPassword, verifyPassword } from './password.service';
import { signAccessToken, signRefreshToken } from './token.service';
import { apiError } from '../../http/errors/ApiError';
import { getUserRbacContext } from '../users/user.service';
import { logger } from '../../config/logger';

async function attachRbacContext<T extends { id: string }>(user: T) {
    const rbac = await getUserRbacContext(user.id);
    return { ...user, ...rbac };
}

export async function getAuthUser(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) {
        throw apiError(401, 'UNAUTHORIZED', 'User not found');
    }
    return attachRbacContext(user);
}

export async function registerUser(input: {
    username: string;
    password: string;
}) {
    const passwordHash = await hashPassword(input.password);

    const user = await prisma.$transaction(async (tx) => {
        const role = await tx.role.findUnique({
            where: { key: 'user' },
            select: { id: true },
        });

        if (!role) {
            throw apiError(
                500,
                'RBAC_ROLE_MISSING',
                'Default user role is missing',
            );
        }

        const created = await tx.user.create({
            data: {
                username: input.username,
                password: passwordHash,
            },
        });

        await tx.roleAssignment.create({
            data: {
                userId: created.id,
                roleId: role.id,
                createdById: created.id,
            },
        });

        return created;
    });

    logger.info({ userId: user.id }, 'User registered');

    const token = signAccessToken({
        sub: user.id,
    });

    const refreshToken = signRefreshToken({
        sub: user.id,
    });

    return { user: await attachRbacContext(user), token, refreshToken };
}

export async function loginUser(input: { username: string; password: string }) {
    const user = await prisma.user.findUnique({
        where: { username: input.username },
    });

    if (!user) {
        logger.warn('Login failed: user not found');
        throw apiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const ok = await verifyPassword(user.password, input.password);
    if (!ok) {
        logger.warn({ userId: user.id }, 'Login failed: invalid password');
        throw apiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    logger.info({ userId: user.id }, 'User logged in');

    const token = signAccessToken({
        sub: user.id,
    });

    const refreshToken = signRefreshToken({
        sub: user.id,
    });

    return { user: await attachRbacContext(user), token, refreshToken };
}
