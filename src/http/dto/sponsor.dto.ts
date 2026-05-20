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

export type SponsorProductContextDTO = {
    id: string;
    title: string;
    description: string;
    sponsorName: string;
    category?: string;
    tags: unknown;
    metadata: unknown;
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

export type SponsorSuggestionStatusDTO =
    | 'pending'
    | 'sent'
    | 'dismissed'
    | 'clicked'
    | 'converted'
    | 'expired';

export type CreateSponsorSuggestionBodyDTO = {
    productId: string;
    eventId?: string;
    todoId?: string;
    reminderId?: string;
    title?: string;
    message?: string;
    placement: string;
    reason?: string;
    metadata?: Record<string, unknown>;
};

export type UpdateSponsorSuggestionBodyDTO = {
    status: SponsorSuggestionStatusDTO;
};

export type SponsorSuggestionDTO = {
    id: string;
    userId: string;
    productId: string;
    eventId?: string;
    todoId?: string;
    reminderId?: string;
    title?: string;
    message?: string;
    placement: string;
    reason?: string;
    status: SponsorSuggestionStatusDTO;
    metadata: unknown;
    deliveredAt?: string;
    createdAt: string;
    updatedAt: string;
    product?: SponsorProductDTO;
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

export function toSponsorProductContextDTO(
    product: any,
): SponsorProductContextDTO {
    return {
        id: product.id,
        title: product.title,
        description: product.description,
        sponsorName: product.sponsorName,
        category: product.category ?? undefined,
        tags: product.tags,
        metadata: product.metadata,
    };
}

export function toSponsorSuggestionDTO(suggestion: any): SponsorSuggestionDTO {
    return {
        id: suggestion.id,
        userId: suggestion.userId,
        productId: suggestion.productId,
        eventId: suggestion.eventId ?? undefined,
        todoId: suggestion.todoId ?? undefined,
        reminderId: suggestion.reminderId ?? undefined,
        title: suggestion.title ?? undefined,
        message: suggestion.message ?? undefined,
        placement: suggestion.placement,
        reason: suggestion.reason ?? undefined,
        status: suggestion.status,
        metadata: suggestion.metadata,
        deliveredAt: iso(suggestion.deliveredAt),
        createdAt: iso(suggestion.createdAt)!,
        updatedAt: iso(suggestion.updatedAt)!,
        product: suggestion.product
            ? toSponsorProductDTO(suggestion.product)
            : undefined,
    };
}
