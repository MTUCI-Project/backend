import { z } from 'zod';

const requiredUnknownSchema = z.custom<unknown>(
    (value) => value !== undefined,
    'Required',
);

export const uuidParamsSchema = z.object({
    id: z.string(),
});

export const userIdParamsSchema = z.object({
    userId: z.string(),
});

export const sourceSchema = z.enum(['user', 'ai', 'system']);
export const todoStatusSchema = z.enum([
    'open',
    'done',
    'dismissed',
    'cancelled',
]);
export const reminderStatusSchema = z.enum([
    'scheduled',
    'sent',
    'dismissed',
    'done',
    'cancelled',
]);
export const reminderChannelSchema = z.enum(['push', 'in_app', 'email']);

const isoDateSchema = z.string().datetime({ offset: true });
const metadataSchema = z.record(z.unknown());

export const sponsorOfferSchema = z.object({
    productId: z.string().min(1).max(128).optional(),
    title: z.string().min(1).max(300),
    description: z.string().max(2_000).optional(),
    url: z.string().url().max(2_000).optional(),
    sponsorName: z.string().min(1).max(300),
    placement: z.string().min(1).max(128),
    metadata: metadataSchema.optional(),
});

export const reminderCreateSchema = z.object({
    triggerAt: isoDateSchema,
    channel: reminderChannelSchema.default('push'),
    payload: metadataSchema.optional(),
});

export const todoCreateSchema = z.object({
    title: z.string().min(1).max(300),
    dueAt: isoDateSchema.optional(),
    metadata: metadataSchema.optional(),
    sponsorOffer: sponsorOfferSchema.optional(),
    reminders: z.array(reminderCreateSchema).max(20).optional(),
});

export const eventCreateSchema = z.object({
    title: z.string().min(1).max(300),
    description: z.string().max(5_000).optional(),
    eventAt: isoDateSchema.optional(),
    timezone: z.string().min(1).max(128).optional(),
    metadata: metadataSchema.optional(),
    sponsorOffer: sponsorOfferSchema.optional(),
    todos: z.array(todoCreateSchema).max(50).optional(),
    reminders: z.array(reminderCreateSchema).max(20).optional(),
});

export const eventUpdateSchema = z.object({
    title: z.string().min(1).max(300).optional(),
    description: z.string().max(5_000).nullable().optional(),
    eventAt: isoDateSchema.nullable().optional(),
    timezone: z.string().min(1).max(128).nullable().optional(),
    metadata: metadataSchema.optional(),
});

export const standaloneTodoCreateSchema = todoCreateSchema.extend({
    eventId: z.string().min(1).max(128).optional(),
});

export const todoUpdateSchema = z.object({
    title: z.string().min(1).max(300).optional(),
    status: todoStatusSchema.optional(),
    dueAt: isoDateSchema.nullable().optional(),
    metadata: metadataSchema.optional(),
});

export const reminderUpdateSchema = z.object({
    status: reminderStatusSchema,
});

export const onboardingAnswerSchema = z.object({
    questionKey: z.string().min(1).max(128),
    answer: requiredUnknownSchema,
});
