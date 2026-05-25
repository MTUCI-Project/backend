export type SponsorProductDTO = {
    id: string;
    title: string;
    description: string;
    referralUrl: string;
    sponsorName: string;
    imageUrl?: string;
    priceLabel?: string;
    category?: string;
    tags: unknown;
    metadata: unknown;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};

export type CreateSponsorProductBodyDTO = {
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

export type UpdateSponsorProductBodyDTO = {
    title?: string;
    description?: string;
    referralUrl?: string;
    sponsorName?: string;
    imageUrl?: string | null;
    priceLabel?: string | null;
    category?: string | null;
    tags?: unknown[];
    metadata?: Record<string, unknown>;
    isActive?: boolean;
};

function iso(value: Date | string | null | undefined): string | undefined {
    if (!value) return undefined;
    return new Date(value).toISOString();
}

export function toSponsorProductDTO(product: any): SponsorProductDTO {
    return {
        id: product.id,
        title: product.title,
        description: product.description,
        referralUrl: product.referralUrl,
        sponsorName: product.sponsorName,
        imageUrl: product.imageUrl ?? undefined,
        priceLabel: product.priceLabel ?? undefined,
        category: product.category ?? undefined,
        tags: product.tags,
        metadata: product.metadata,
        isActive: !!product.isActive,
        createdAt: iso(product.createdAt)!,
        updatedAt: iso(product.updatedAt)!,
    };
}
