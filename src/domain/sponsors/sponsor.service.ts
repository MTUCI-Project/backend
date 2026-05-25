import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { apiError } from '../../http/errors/ApiError';

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

function toJson(value: unknown) {
    return value as Prisma.InputJsonValue;
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
