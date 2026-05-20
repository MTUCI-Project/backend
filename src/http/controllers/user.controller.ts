import { Controller, Get, Request, Route, Security, Tags } from 'tsoa';
import type { Request as ExpressRequest } from 'express';

import { apiError } from '../errors/ApiError';

import {
    getUserRbacContext,
    getUserSelf,
} from '../../domain/users/user.service';

import { toUserSelfDTO } from '../dto/user.dto';

import type { UserSelfDTO } from '../dto/user.dto';

import { Scope } from '../../domain/auth/permissions';

@Route('users')
@Tags('Users')
export class UsersController extends Controller {
    /**
     * GET /users/me
     * auth required
     */
    @Get('me')
    @Security('cookieAuth', [Scope.LOAD_PERMISSIONS])
    public async getMe(@Request() req: ExpressRequest): Promise<UserSelfDTO> {
        const user = await getUserSelf(req.user!.id);
        if (!user) throw apiError(401, 'UNAUTHORIZED', 'User not found');

        const rbac = await getUserRbacContext(req.user!.id);

        return toUserSelfDTO({
            ...user,
            ...rbac,
        });
    }
}
