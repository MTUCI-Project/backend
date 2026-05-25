import { z } from 'zod';

import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { apiError } from '../../http/errors/ApiError';
import type {
    DateSuggestionDTO,
    RecommendationDTO,
    RelationshipAnalysisDTO,
} from '../../http/dto/assistant.dto';
import { assertActiveUser } from '../companion/companion.service';

const dateSuggestionResponseSchema: z.ZodType<DateSuggestionDTO> = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    estimated_cost: z.number(),
    type: z.string(),
});

const recommendationResponseSchema: z.ZodType<RecommendationDTO> = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    price: z.number(),
    partner_url: z.string().nullable(),
    reason: z.string(),
});

const relationshipAnalysisResponseSchema: z.ZodType<RelationshipAnalysisDTO> =
    z.object({
        strengths: z.array(z.string()),
        growth_areas: z.array(z.string()),
        suggested_actions: z.array(z.object({ action: z.string() })),
    });

async function requestAi<T>(
    userId: string,
    path: string,
    options: {
        query?: Record<string, string>;
        body?: Record<string, unknown>;
        schema: z.ZodType<T>;
    },
): Promise<T> {
    const url = new URL(`${env.AI_BACKEND_BASE_URL}${path}`);
    for (const [key, value] of Object.entries(options.query ?? {})) {
        url.searchParams.set(key, value);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.AI_BACKEND_TIMEOUT_MS);
    let response: Response;
    try {
        response = await fetch(url, {
            method: 'POST',
            headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
            body: options.body ? JSON.stringify(options.body) : undefined,
            signal: controller.signal,
        });
    } catch (err) {
        logger.warn({ err, userId, path }, 'Unable to reach AI backend');
        throw apiError(
            502,
            'AI_BACKEND_UNAVAILABLE',
            'AI service is temporarily unavailable',
        );
    } finally {
        clearTimeout(timeout);
    }

    if (!response.ok) {
        logger.warn(
            { userId, path, status: response.status },
            'AI backend rejected assistant request',
        );
        throw apiError(502, 'AI_BACKEND_ERROR', 'AI service request failed');
    }

    let payload: unknown;
    try {
        payload = await response.json();
    } catch (err) {
        logger.warn({ err, userId, path }, 'AI backend returned invalid JSON');
        throw apiError(502, 'AI_BACKEND_INVALID_RESPONSE', 'AI service returned invalid data');
    }

    const parsed = options.schema.safeParse(payload);
    if (!parsed.success) {
        logger.warn(
            { userId, path, issues: parsed.error.issues },
            'AI backend response did not match contract',
        );
        throw apiError(502, 'AI_BACKEND_INVALID_RESPONSE', 'AI service returned invalid data');
    }
    return parsed.data;
}

export async function suggestDate(userId: string, budget?: number) {
    await assertActiveUser(userId);
    return requestAi(userId, '/ml/suggest-date', {
        query: {
            user_id: userId,
            ...(budget === undefined ? {} : { budget: budget.toString() }),
        },
        schema: dateSuggestionResponseSchema,
    });
}

export async function recommend(userId: string, type: string) {
    await assertActiveUser(userId);
    return requestAi(userId, '/ml/recommend', {
        body: { user_id: userId, type },
        schema: recommendationResponseSchema,
    });
}

export async function analyzeRelationship(userId: string) {
    await assertActiveUser(userId);
    return requestAi(userId, '/ml/analyze-relationship', {
        body: { user_id: userId },
        schema: relationshipAnalysisResponseSchema,
    });
}
