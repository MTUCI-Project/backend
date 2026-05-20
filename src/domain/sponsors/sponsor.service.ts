import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { apiError } from '../../http/errors/ApiError';
import { assertActiveUser } from '../companion/companion.service';

type SponsorProductInput = {
    title: string;
    description: string;
    referralUrl: string;
    sponsorName: string;
    imageUrl?: string;
    priceLabel?: string;
    category?: string;
    tags?: unknown[];
    metadata?: Record<string, unknown>;
    isActive?: boolean;
};

type SponsorProductUpdateInput = Partial<
    Omit<SponsorProductInput, 'imageUrl' | 'priceLabel' | 'category'>
> & {
    imageUrl?: string | null;
    priceLabel?: string | null;
    category?: string | null;
};

type SponsorSuggestionStatus =
    | 'pending'
    | 'sent'
    | 'dismissed'
    | 'clicked'
    | 'converted'
    | 'expired';

function toJson(value: unknown) {
    return value as Prisma.InputJsonValue;
}

async function assertActiveSponsorProduct(productId: string) {
    const product = await prisma.sponsorProduct.findFirst({
        where: {
            id: productId,
            isActive: true,
            deletedAt: null,
        },
        select: { id: true },
    });

    if (!product) {
        throw apiError(404, 'SPONSOR_PRODUCT_NOT_FOUND', 'Sponsor product not found');
    }
}

async function assertOptionalOwnedRecord(params: {
    userId: string;
    eventId?: string;
    todoId?: string;
    reminderId?: string;
}) {
    const checks: Promise<unknown>[] = [];

    if (params.eventId) {
        checks.push(
            prisma.userEvent.findFirst({
                where: {
                    id: params.eventId,
                    userId: params.userId,
                    deletedAt: null,
                },
                select: { id: true },
            }),
        );
    }

    if (params.todoId) {
        checks.push(
            prisma.todo.findFirst({
                where: {
                    id: params.todoId,
                    userId: params.userId,
                    deletedAt: null,
                },
                select: { id: true },
            }),
        );
    }

    if (params.reminderId) {
        checks.push(
            prisma.reminder.findFirst({
                where: {
                    id: params.reminderId,
                    userId: params.userId,
                },
                select: { id: true },
            }),
        );
    }

    const results = await Promise.all(checks);
    if (results.some((result) => !result)) {
        throw apiError(404, 'CONTEXT_RECORD_NOT_FOUND', 'Context record not found');
    }
}

export async function listSponsorProducts(params?: { includeInactive?: boolean }) {
    return prisma.sponsorProduct.findMany({
        where: {
            deletedAt: null,
            ...(params?.includeInactive ? {} : { isActive: true }),
        },
        orderBy: [{ isActive: 'desc' }, { updatedAt: 'desc' }],
    });
}

export async function listSponsorProductsForAiContext() {
    return listSponsorProducts({ includeInactive: false });
}

export async function createSponsorProduct(input: SponsorProductInput) {
    return prisma.sponsorProduct.create({
        data: {
            title: input.title,
            description: input.description,
            referralUrl: input.referralUrl,
            sponsorName: input.sponsorName,
            imageUrl: input.imageUrl,
            priceLabel: input.priceLabel,
            category: input.category,
            tags: toJson(input.tags ?? []),
            metadata: toJson(input.metadata ?? {}),
            isActive: input.isActive ?? true,
        },
    });
}

export async function updateSponsorProduct(
    productId: string,
    input: SponsorProductUpdateInput,
) {
    await getSponsorProductById(productId);

    return prisma.sponsorProduct.update({
        where: { id: productId },
        data: {
            title: input.title,
            description: input.description,
            referralUrl: input.referralUrl,
            sponsorName: input.sponsorName,
            imageUrl: input.imageUrl,
            priceLabel: input.priceLabel,
            category: input.category,
            tags: input.tags === undefined ? undefined : toJson(input.tags),
            metadata:
                input.metadata === undefined
                    ? undefined
                    : toJson(input.metadata),
            isActive: input.isActive,
        },
    });
}

export async function getSponsorProductById(productId: string) {
    const product = await prisma.sponsorProduct.findFirst({
        where: { id: productId, deletedAt: null },
    });

    if (!product) {
        throw apiError(404, 'SPONSOR_PRODUCT_NOT_FOUND', 'Sponsor product not found');
    }

    return product;
}

export async function deleteSponsorProduct(productId: string) {
    await getSponsorProductById(productId);

    await prisma.sponsorProduct.update({
        where: { id: productId },
        data: {
            isActive: false,
            deletedAt: new Date(),
        },
    });
}

export async function createSponsorSuggestion(
    userId: string,
    input: {
        productId: string;
        eventId?: string;
        todoId?: string;
        reminderId?: string;
        title?: string;
        message?: string;
        placement: string;
        reason?: string;
        metadata?: Record<string, unknown>;
    },
) {
    await assertActiveUser(userId);
    await assertActiveSponsorProduct(input.productId);
    await assertOptionalOwnedRecord({
        userId,
        eventId: input.eventId,
        todoId: input.todoId,
        reminderId: input.reminderId,
    });

    return prisma.sponsorSuggestion.create({
        data: {
            userId,
            productId: input.productId,
            eventId: input.eventId,
            todoId: input.todoId,
            reminderId: input.reminderId,
            title: input.title,
            message: input.message,
            placement: input.placement,
            reason: input.reason,
            metadata: toJson(input.metadata ?? {}),
        },
        include: { product: true },
    });
}

export async function updateSponsorSuggestionStatus(
    userId: string,
    suggestionId: string,
    status: SponsorSuggestionStatus,
) {
    const suggestion = await prisma.sponsorSuggestion.findFirst({
        where: { id: suggestionId, userId },
        select: { id: true },
    });

    if (!suggestion) {
        throw apiError(404, 'SPONSOR_SUGGESTION_NOT_FOUND', 'Sponsor suggestion not found');
    }

    return prisma.sponsorSuggestion.update({
        where: { id: suggestionId },
        data: {
            status,
            deliveredAt: status === 'sent' ? new Date() : undefined,
        },
        include: { product: true },
    });
}
