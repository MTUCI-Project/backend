import { z } from 'zod';

export const chatMessageCreateSchema = z.object({
    message: z.string().trim().min(1).max(5_000),
});

export const chatHistoryLimitSchema = z.coerce.number().int().min(1).max(200).default(50);
