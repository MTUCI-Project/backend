export type SourceDTO = 'user' | 'ai' | 'system';
export type TodoStatusDTO = 'open' | 'done' | 'dismissed' | 'cancelled';
export type ReminderStatusDTO =
    | 'scheduled'
    | 'sent'
    | 'dismissed'
    | 'done'
    | 'cancelled';
export type ReminderChannelDTO = 'push' | 'in_app' | 'email';
export type SponsorOfferStatusDTO =
    | 'proposed'
    | 'accepted'
    | 'dismissed'
    | 'expired';

export type SponsorOfferBodyDTO = {
    productId?: string;
    title: string;
    description?: string;
    url?: string;
    sponsorName: string;
    placement: string;
    metadata?: Record<string, unknown>;
};

export type ReminderBodyDTO = {
    triggerAt: string;
    channel?: ReminderChannelDTO;
    payload?: Record<string, unknown>;
};

export type TodoBodyDTO = {
    title: string;
    dueAt?: string;
    metadata?: Record<string, unknown>;
    sponsorOffer?: SponsorOfferBodyDTO;
    reminders?: ReminderBodyDTO[];
};

export type CreateEventBodyDTO = {
    title: string;
    description?: string;
    eventAt?: string;
    timezone?: string;
    metadata?: Record<string, unknown>;
    sponsorOffer?: SponsorOfferBodyDTO;
    todos?: TodoBodyDTO[];
    reminders?: ReminderBodyDTO[];
};

export type UpdateEventBodyDTO = {
    title?: string;
    description?: string | null;
    eventAt?: string | null;
    timezone?: string | null;
    metadata?: Record<string, unknown>;
};

export type CreateTodoBodyDTO = TodoBodyDTO & {
    eventId?: string;
};

export type UpdateTodoBodyDTO = {
    title?: string;
    status?: TodoStatusDTO;
    dueAt?: string | null;
    metadata?: Record<string, unknown>;
};

export type UpdateReminderBodyDTO = {
    status: ReminderStatusDTO;
};

export type UpsertOnboardingAnswerBodyDTO = {
    questionKey: string;
    answer: unknown;
};

export type OnboardingAnswerDTO = {
    id: string;
    userId: string;
    questionKey: string;
    answer: unknown;
    source: SourceDTO;
    createdAt: string;
    updatedAt: string;
};

export type SponsorOfferDTO = {
    id: string;
    userId: string;
    productId?: string;
    eventId?: string;
    todoId?: string;
    title: string;
    description?: string;
    url?: string;
    sponsorName: string;
    placement: string;
    status: SponsorOfferStatusDTO;
    metadata: unknown;
    createdAt: string;
    updatedAt: string;
};

export type ReminderDTO = {
    id: string;
    userId: string;
    eventId?: string;
    todoId?: string;
    triggerAt: string;
    status: ReminderStatusDTO;
    channel: ReminderChannelDTO;
    payload: unknown;
    source: SourceDTO;
    createdAt: string;
    updatedAt: string;
};

export type TodoDTO = {
    id: string;
    userId: string;
    eventId?: string;
    title: string;
    status: TodoStatusDTO;
    dueAt?: string;
    source: SourceDTO;
    metadata: unknown;
    sponsorOffers: SponsorOfferDTO[];
    reminders: ReminderDTO[];
    createdAt: string;
    updatedAt: string;
};

export type UserEventDTO = {
    id: string;
    userId: string;
    title: string;
    description?: string;
    eventAt?: string;
    timezone?: string;
    source: SourceDTO;
    metadata: unknown;
    sponsorOffers: SponsorOfferDTO[];
    reminders: ReminderDTO[];
    todos: TodoDTO[];
    createdAt: string;
    updatedAt: string;
};

export type AiUserContextDTO = {
    userId: string;
    profile: unknown;
    onboardingAnswers: OnboardingAnswerDTO[];
    events: UserEventDTO[];
    todos: TodoDTO[];
    reminders: ReminderDTO[];
};

function iso(value: Date | string | null | undefined): string | undefined {
    if (!value) return undefined;
    return new Date(value).toISOString();
}

export function toOnboardingAnswerDTO(answer: any): OnboardingAnswerDTO {
    return {
        id: answer.id,
        userId: answer.userId,
        questionKey: answer.questionKey,
        answer: answer.answer,
        source: answer.source,
        createdAt: iso(answer.createdAt)!,
        updatedAt: iso(answer.updatedAt)!,
    };
}

export function toSponsorOfferDTO(offer: any): SponsorOfferDTO {
    return {
        id: offer.id,
        userId: offer.userId,
        productId: offer.productId ?? undefined,
        eventId: offer.eventId ?? undefined,
        todoId: offer.todoId ?? undefined,
        title: offer.title,
        description: offer.description ?? undefined,
        url: offer.url ?? undefined,
        sponsorName: offer.sponsorName,
        placement: offer.placement,
        status: offer.status,
        metadata: offer.metadata,
        createdAt: iso(offer.createdAt)!,
        updatedAt: iso(offer.updatedAt)!,
    };
}

export function toReminderDTO(reminder: any): ReminderDTO {
    return {
        id: reminder.id,
        userId: reminder.userId,
        eventId: reminder.eventId ?? undefined,
        todoId: reminder.todoId ?? undefined,
        triggerAt: iso(reminder.triggerAt)!,
        status: reminder.status,
        channel: reminder.channel,
        payload: reminder.payload,
        source: reminder.source,
        createdAt: iso(reminder.createdAt)!,
        updatedAt: iso(reminder.updatedAt)!,
    };
}

export function toTodoDTO(todo: any): TodoDTO {
    return {
        id: todo.id,
        userId: todo.userId,
        eventId: todo.eventId ?? undefined,
        title: todo.title,
        status: todo.status,
        dueAt: iso(todo.dueAt),
        source: todo.source,
        metadata: todo.metadata,
        sponsorOffers: (todo.sponsorOffers ?? []).map(toSponsorOfferDTO),
        reminders: (todo.reminders ?? []).map(toReminderDTO),
        createdAt: iso(todo.createdAt)!,
        updatedAt: iso(todo.updatedAt)!,
    };
}

export function toUserEventDTO(event: any): UserEventDTO {
    return {
        id: event.id,
        userId: event.userId,
        title: event.title,
        description: event.description ?? undefined,
        eventAt: iso(event.eventAt),
        timezone: event.timezone ?? undefined,
        source: event.source,
        metadata: event.metadata,
        sponsorOffers: (event.sponsorOffers ?? []).map(toSponsorOfferDTO),
        reminders: (event.reminders ?? []).map(toReminderDTO),
        todos: (event.todos ?? []).map(toTodoDTO),
        createdAt: iso(event.createdAt)!,
        updatedAt: iso(event.updatedAt)!,
    };
}
