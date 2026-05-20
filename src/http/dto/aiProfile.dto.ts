export type UserAiProfileFactDTO = {
    key: string;
    value: unknown;
    source?: string;
    confidence?: number;
    updatedAt: string;
};

export type UserAiProfileDTO = {
    userId: string;
    summary?: string;
    facts: UserAiProfileFactDTO[];
    metadata: Record<string, unknown>;
    createdAt?: string;
    updatedAt?: string;
};

export type UpdateAiProfileBodyDTO = {
    summary?: string;
    metadata?: Record<string, unknown>;
};

export type UpsertAiProfileFactBodyDTO = {
    value: unknown;
    source?: string;
    confidence?: number;
};

export type AiProfileFactInputDTO = UpsertAiProfileFactBodyDTO & {
    key: string;
};

export function toUserAiProfileDTO(profile: any): UserAiProfileDTO {
    return {
        userId: profile.userId,
        summary: profile.summary,
        facts: Array.isArray(profile.facts)
            ? profile.facts.map((fact: any) => ({
                  key: fact.key,
                  value: fact.value,
                  source: fact.source,
                  confidence: fact.confidence,
                  updatedAt: new Date(fact.updatedAt).toISOString(),
              }))
            : [],
        metadata:
            profile.metadata && typeof profile.metadata === 'object'
                ? profile.metadata
                : {},
        createdAt: profile.createdAt
            ? new Date(profile.createdAt).toISOString()
            : undefined,
        updatedAt: profile.updatedAt
            ? new Date(profile.updatedAt).toISOString()
            : undefined,
    };
}
