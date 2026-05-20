import { z } from 'zod';

const requiredUnknownSchema = z.custom<unknown>(
    (value) => value !== undefined,
    'Required',
);

export const aiProfileFactKeyParamsSchema = z.object({
    key: z.string().min(1).max(128),
});

export const updateAiProfileSchema = z.object({
    summary: z.string().max(20_000).optional(),
    metadata: z.record(z.unknown()).optional(),
});

export const upsertAiProfileFactSchema = z.object({
    value: requiredUnknownSchema,
    source: z.string().max(128).optional(),
    confidence: z.number().min(0).max(1).optional(),
});

export const aiServiceFactsSchema = z.object({
    facts: z
        .array(
            upsertAiProfileFactSchema.extend({
                key: z.string().min(1).max(128),
            }),
        )
        .min(1)
        .max(100),
});
