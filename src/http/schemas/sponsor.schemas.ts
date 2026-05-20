import { z } from 'zod';

export const sponsorProductIdParamsSchema = z.object({
    id: z.string().uuid(),
});

const tagsSchema = z.array(z.unknown()).max(50);
const metadataSchema = z.record(z.unknown());

export const sponsorProductCreateSchema = z.object({
    title: z.string().min(1).max(300),
    description: z.string().min(1).max(5_000),
    referralUrl: z.string().url().max(2_000),
    sponsorName: z.string().min(1).max(300),
    imageUrl: z.string().url().max(2_000).optional(),
    priceLabel: z.string().max(128).optional(),
    category: z.string().max(128).optional(),
    tags: tagsSchema.optional(),
    metadata: metadataSchema.optional(),
    isActive: z.boolean().optional(),
});

export const sponsorProductUpdateSchema = z.object({
    title: z.string().min(1).max(300).optional(),
    description: z.string().min(1).max(5_000).optional(),
    referralUrl: z.string().url().max(2_000).optional(),
    sponsorName: z.string().min(1).max(300).optional(),
    imageUrl: z.string().url().max(2_000).nullable().optional(),
    priceLabel: z.string().max(128).nullable().optional(),
    category: z.string().max(128).nullable().optional(),
    tags: tagsSchema.optional(),
    metadata: metadataSchema.optional(),
    isActive: z.boolean().optional(),
});

export const sponsorSuggestionCreateSchema = z.object({
    productId: z.string().uuid(),
    eventId: z.string().uuid().optional(),
    todoId: z.string().uuid().optional(),
    reminderId: z.string().uuid().optional(),
    title: z.string().max(300).optional(),
    message: z.string().max(2_000).optional(),
    placement: z.string().min(1).max(128),
    reason: z.string().max(2_000).optional(),
    metadata: metadataSchema.optional(),
});

export const sponsorSuggestionUpdateSchema = z.object({
    status: z.enum([
        'pending',
        'sent',
        'dismissed',
        'clicked',
        'converted',
        'expired',
    ]),
});
