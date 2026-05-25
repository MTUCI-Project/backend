import type { UserSelfDTO } from './user.dto';
import { toUserSelfDTO } from './user.dto';

export type RegisterBodyDTO = {
    username: string;
    password: string;
};

export type LoginBodyDTO = {
    username: string;
    password: string;
};

export type RefreshBodyDTO = {
    refreshToken?: string;
};

export type AuthResponseDTO = {
    user: UserSelfDTO;
    accessToken: string;
    refreshToken: string;
};

export function toAuthResponseDTO(input: {
    user: any;
    token: string;
    refreshToken: string;
}): AuthResponseDTO {
    return {
        user: toUserSelfDTO(input.user),
        accessToken: input.token,
        refreshToken: input.refreshToken,
    };
}
