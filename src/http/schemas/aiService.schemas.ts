import { z } from 'zod';

const requiredUnknownSchema = z.custom<unknown>(
    (value) => value !== undefined,
    'Required',
);

export const aiUserIdParamsSchema = z.object({
    userId: z.string().min(1).max(128),
});

export const aiRecordIdParamsSchema = z.object({
    id: z.string().min(1).max(128),
});

export const aiFactKeyParamsSchema = z.object({
    key: z.string().min(1).max(128),
});

export const aiFactCreateSchema = z.object({
    key: z.string().min(1).max(128),
    value: requiredUnknownSchema,
});

export const aiProfileUpdateSchema = z.record(z.unknown());

export const aiChatMessageCreateSchema = z.object({
    message: z.string(),
    sentiment: z.number().default(0),
});

export const aiChatHistoryLimitSchema = z.coerce.number().int().min(0).default(50);

export const aiEventCreateSchema = z.object({
    title: z.string(),
    description: z.string().nullable().optional(),
    date: z.string(),
    status: z.string().default('planned'),
});

export const aiEventUpdateSchema = aiEventCreateSchema.partial();

export const aiTodoCreateSchema = z.object({
    text: z.string(),
    due: z.string().nullable().optional(),
});

export const aiTodoUpdateSchema = aiTodoCreateSchema.partial().extend({
    completed: z.boolean().optional(),
});

export const aiReminderUpdateSchema = z.object({
    text: z.string().nullable().optional(),
    remind_at: z.string().nullable().optional(),
    is_active: z.boolean().optional(),
});

export const aiSponsorSuggestionCreateSchema = z.object({
    title: z.string(),
    description: z.string(),
    price: z.number().nullable().optional(),
    partner_url: z.string().nullable().optional(),
});

export const aiSponsorSuggestionUpdateSchema = z.record(z.unknown());
