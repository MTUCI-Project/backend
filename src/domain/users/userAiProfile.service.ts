import {
    addOrUpdateUserAiProfileFact,
    deleteUserAiProfileFact,
    getUserAiProfileByUserId,
    upsertUserAiProfile,
    type UserAiProfileDocument,
} from './userAiProfile.repository';

function emptyProfile(userId: string): UserAiProfileDocument {
    const now = new Date();
    return {
        userId,
        facts: [],
        metadata: {},
        createdAt: now,
        updatedAt: now,
    };
}

export async function getUserAiProfile(userId: string) {
    return (await getUserAiProfileByUserId(userId)) ?? emptyProfile(userId);
}

export async function updateUserAiProfile(
    userId: string,
    input: {
        summary?: string;
        metadata?: Record<string, unknown>;
    },
) {
    return upsertUserAiProfile({ userId, ...input });
}

export async function upsertUserAiProfileFact(
    userId: string,
    key: string,
    input: {
        value: unknown;
        source?: string;
        confidence?: number;
    },
) {
    return addOrUpdateUserAiProfileFact(userId, { key, ...input });
}

export async function deleteUserAiProfileFactByKey(userId: string, key: string) {
    return deleteUserAiProfileFact(userId, key);
}
