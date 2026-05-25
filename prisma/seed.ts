import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/domain/auth/password.service';
import { env } from '../src/config/env';
import { Permission } from '../src/domain/auth/permissions';

async function upsertUser(params: {
    id?: string;
    username: string;
    password: string;
    deleted?: boolean;
}) {
    const passwordHash = await hashPassword(params.password);
    const where = params.id
        ? { id: params.id }
        : { username: params.username };

    return prisma.user.upsert({
        where,
        update: {
            username: params.username,
            password: passwordHash,
            deletedAt: params.deleted ? new Date() : null,
        },
        create: {
            id: params.id,
            username: params.username,
            password: passwordHash,
            deletedAt: params.deleted ? new Date() : null,
        },
    });
}

async function upsertRole(params: {
    key: string;
    name: string;
    isSystem?: boolean;
}) {
    return prisma.role.upsert({
        where: { key: params.key },
        update: {
            name: params.name,
            isSystem: params.isSystem ?? true,
        },
        create: {
            key: params.key,
            name: params.name,
            isSystem: params.isSystem ?? true,
        },
    });
}

async function ensurePermissions() {
    const keys = Object.values(Permission);

    await prisma.permission.createMany({
        data: keys.map((key) => ({ key })),
        skipDuplicates: true,
    });

    const rows = await prisma.permission.findMany({
        where: { key: { in: keys } },
        select: { id: true, key: true },
    });

    return new Map(rows.map((permission) => [permission.key, permission.id]));
}

async function setRolePermissions(
    roleId: string,
    permissionKeys: string[],
    permissionIdByKey: Map<string, string>,
) {
    await prisma.rolePermission.createMany({
        data: permissionKeys.map((key) => ({
            roleId,
            permissionId: permissionIdByKey.get(key)!,
        })),
        skipDuplicates: true,
    });
}

async function assignRole(params: {
    userId: string;
    roleId: string;
    createdById?: string;
}) {
    await prisma.roleAssignment.upsert({
        where: {
            userId_roleId: { userId: params.userId, roleId: params.roleId },
        },
        update: {},
        create: {
            userId: params.userId,
            roleId: params.roleId,
            createdById: params.createdById ?? null,
        },
    });
}

async function main() {
    console.log('Seeding...');

    const permissionIdByKey = await ensurePermissions();
    const adminRole = await upsertRole({
        key: 'admin',
        name: 'Admin',
        isSystem: true,
    });
    const userRole = await upsertRole({
        key: 'user',
        name: 'User',
        isSystem: true,
    });
    const moderatorRole = await upsertRole({
        key: 'moderator',
        name: 'Moderator',
        isSystem: true,
    });

    const allPermissions = Object.values(Permission);
    await setRolePermissions(adminRole.id, allPermissions, permissionIdByKey);
    await setRolePermissions(
        moderatorRole.id,
        [
            Permission.USERS_READ,
            Permission.USERS_READ_DELETED,
            Permission.USERS_BAN,
        ],
        permissionIdByKey,
    );
    await setRolePermissions(userRole.id, [Permission.USERS_READ], permissionIdByKey);

    const admin = await upsertUser({
        username: env.SEED_ADMIN_USERNAME,
        password: env.SEED_ADMIN_PASSWORD,
    });
    const regular = await upsertUser({
        username: 'user',
        password: 'user12345',
    });
    const deletedUser = await upsertUser({
        username: 'deleted_user',
        password: 'deleted_user12345',
        deleted: true,
    });
    const alice = await upsertUser({
        id: 'alice',
        username: 'alice',
        password: 'password123',
    });

    await assignRole({
        userId: admin.id,
        roleId: adminRole.id,
        createdById: admin.id,
    });
    await assignRole({
        userId: regular.id,
        roleId: userRole.id,
        createdById: admin.id,
    });
    await assignRole({
        userId: deletedUser.id,
        roleId: userRole.id,
        createdById: admin.id,
    });
    await assignRole({
        userId: alice.id,
        roleId: userRole.id,
        createdById: admin.id,
    });

    console.log('Seed done. Mock AI service user id:', alice.id);
}

main()
    .catch((error) => {
        console.error('Seed failed', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
