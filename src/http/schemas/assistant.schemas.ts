import { z } from 'zod';

export const suggestDateSchema = z.object({
    budget: z.number().nonnegative().max(100_000_000).optional(),
});

export const recommendSchema = z.object({
    type: z.string().trim().min(1).max(100),
});
