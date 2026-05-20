import type { Collection, Document, WithId } from 'mongodb';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { getMongoDb } from '../../lib/mongo';

export type UserAiProfileFact = {
    key: string;
    value: unknown;
    source?: string;
    confidence?: number;
    updatedAt: Date;
};

export type UserAiProfileDocument = {
    userId: string;
    summary?: string;
    facts: UserAiProfileFact[];
    metadata: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
};

export type UserAiProfileUpsertInput = {
    userId: string;
    summary?: string;
    facts?: UserAiProfileFact[];
    metadata?: Record<string, unknown>;
};

export type UserAiProfileFactInput = Omit<UserAiProfileFact, 'updatedAt'> & {
    updatedAt?: Date;
};

async function collection(): Promise<Collection<UserAiProfileDocument>> {
    const db = await getMongoDb();
    const col = db.collection<UserAiProfileDocument>(
        env.MONGODB_USER_AI_PROFILES_COLLECTION,
    );

    await col.createIndex({ userId: 1 }, { unique: true });
    return col;
}

function withoutMongoId(
    doc: WithId<UserAiProfileDocument> | null,
): UserAiProfileDocument | null {
    if (!doc) return null;

    const { _id: _ignored, ...profile } = doc;
    return profile;
}

export async function getUserAiProfileByUserId(
    userId: string,
): Promise<UserAiProfileDocument | null> {
    const col = await collection();
    const profile = withoutMongoId(await col.findOne({ userId }));
    logger.debug(
        { userId, found: !!profile },
        'Loaded user AI profile from MongoDB',
    );
    return profile;
}

export async function upsertUserAiProfile(
    input: UserAiProfileUpsertInput,
): Promise<UserAiProfileDocument> {
    const col = await collection();
    const now = new Date();
    const $set: Partial<UserAiProfileDocument> = {
        updatedAt: now,
    };

    if (input.summary !== undefined) $set.summary = input.summary;
    if (input.facts !== undefined) $set.facts = input.facts;
    if (input.metadata !== undefined) $set.metadata = input.metadata;

    const $setOnInsert: Partial<UserAiProfileDocument> = {
        userId: input.userId,
        createdAt: now,
    };

    if (input.facts === undefined) $setOnInsert.facts = [];
    if (input.metadata === undefined) $setOnInsert.metadata = {};

    const result = await col.findOneAndUpdate(
        { userId: input.userId },
        {
            $set,
            $setOnInsert,
        },
        {
            upsert: true,
            returnDocument: 'after',
        },
    );

    const profile = withoutMongoId(result);
    if (!profile) {
        throw new Error('Failed to upsert user AI profile');
    }

    logger.info(
        {
            userId: profile.userId,
            factsCount: profile.facts.length,
            hasSummary: profile.summary !== undefined,
        },
        'Upserted user AI profile',
    );

    return profile;
}

export async function addOrUpdateUserAiProfileFact(
    userId: string,
    fact: UserAiProfileFactInput,
): Promise<UserAiProfileDocument> {
    const col = await collection();
    const now = new Date();
    const nextFact = {
        ...fact,
        updatedAt: fact.updatedAt ?? now,
    };

    await col.updateOne(
        { userId },
        {
            $pull: { facts: { key: fact.key } as Document },
            $setOnInsert: {
                userId,
                metadata: {},
                createdAt: now,
            },
        },
        { upsert: true },
    );

    const result = await col.findOneAndUpdate(
        { userId },
        {
            $push: { facts: nextFact },
            $set: { updatedAt: now },
        },
        { returnDocument: 'after' },
    );

    const profile = withoutMongoId(result);
    if (!profile) {
        throw new Error('Failed to update user AI profile fact');
    }

    logger.info(
        {
            userId: profile.userId,
            factKey: fact.key,
            factsCount: profile.facts.length,
        },
        'Updated user AI profile fact',
    );

    return profile;
}
