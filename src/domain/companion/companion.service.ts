import { randomBytes } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { apiError } from '../../http/errors/ApiError';

type Source = 'user' | 'ai' | 'system';
type ReminderChannel = 'push' | 'in_app' | 'email';
type ReminderStatus =
    | 'scheduled'
    | 'sent'
    | 'dismissed'
    | 'done'
    | 'cancelled';
type TodoStatus = 'open' | 'done' | 'dismissed' | 'cancelled';

type SponsorOfferInput = {
    productId?: string;
    title: string;
    description?: string;
    url?: string;
    sponsorName: string;
    placement: string;
    metadata?: Record<string, unknown>;
};

type ReminderInput = {
    triggerAt: string;
    channel?: ReminderChannel;
    payload?: Record<string, unknown>;
};

type TodoInput = {
    title: string;
    dueAt?: string;
    metadata?: Record<string, unknown>;
    sponsorOffer?: SponsorOfferInput;
    reminders?: ReminderInput[];
};

const eventInclude = {
    sponsorOffers: true,
    reminders: true,
    todos: {
        include: {
            sponsorOffers: true,
            reminders: true,
        },
    },
} satisfies Prisma.UserEventInclude;

const todoInclude = {
    sponsorOffers: true,
    reminders: true,
} satisfies Prisma.TodoInclude;

function toJson(value: Record<string, unknown> | undefined) {
    return (value ?? {}) as Prisma.InputJsonValue;
}

function toDate(value: string | null | undefined) {
    if (value === undefined) return undefined;
    if (value === null) return null;
    return new Date(value);
}

export async function assertActiveUser(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, deletedAt: true },
    });

    if (!user || user.deletedAt) {
        throw apiError(404, 'USER_NOT_FOUND', 'User not found');
    }

    return user;
}

async function ensureEventOwnedByUser(
    userId: string,
    eventId: string,
    client: Pick<typeof prisma, 'userEvent'> = prisma,
) {
    const event = await client.userEvent.findFirst({
        where: { id: eventId, userId, deletedAt: null },
        select: { id: true },
    });

    if (!event) throw apiError(404, 'NOT_FOUND', 'Event not found');
}

async function generateInviteCode() {
    for (let attempt = 0; attempt < 5; attempt += 1) {
        const code = randomBytes(9).toString('base64url');
        const existing = await prisma.coupleLink.findUnique({
            where: { inviteCode: code },
            select: { id: true },
        });
        if (!existing) return code;
    }

    throw apiError(500, 'INVITE_CODE_GENERATION_FAILED');
}

export async function createCoupleInvite(userId: string) {
    await assertActiveUser(userId);

    const code = await generateInviteCode();
    return prisma.coupleLink.create({
        data: {
            userAId: userId,
            createdById: userId,
            inviteCode: code,
        },
    });
}

export async function acceptCoupleInvite(userId: string, code: string) {
    await assertActiveUser(userId);

    const link = await prisma.coupleLink.findUnique({
        where: { inviteCode: code },
    });

    if (!link || link.status !== 'pending') {
        throw apiError(404, 'INVITE_NOT_FOUND', 'Invite not found');
    }
    if (link.userAId === userId) {
        throw apiError(400, 'INVITE_OWNED_BY_USER', 'Cannot accept own invite');
    }

    return prisma.coupleLink.update({
        where: { id: link.id },
        data: {
            userBId: userId,
            status: 'active',
            acceptedAt: new Date(),
        },
    });
}

export async function getMyCoupleLink(userId: string) {
    await assertActiveUser(userId);
    return prisma.coupleLink.findFirst({
        where: {
            OR: [{ userAId: userId }, { userBId: userId }],
            status: { in: ['pending', 'active'] },
        },
        orderBy: { createdAt: 'desc' },
    });
}

export async function revokeMyCoupleLink(userId: string) {
    const link = await getMyCoupleLink(userId);
    if (!link) throw apiError(404, 'NOT_FOUND', 'Couple link not found');

    return prisma.coupleLink.update({
        where: { id: link.id },
        data: {
            status: 'revoked',
            revokedAt: new Date(),
        },
    });
}

export async function upsertOnboardingAnswer(
    userId: string,
    input: { questionKey: string; answer: unknown },
    source: Source,
) {
    await assertActiveUser(userId);
    return prisma.onboardingAnswer.upsert({
        where: {
            userId_questionKey: {
                userId,
                questionKey: input.questionKey,
            },
        },
        update: {
            answer: input.answer as Prisma.InputJsonValue,
            source,
        },
        create: {
            userId,
            questionKey: input.questionKey,
            answer: input.answer as Prisma.InputJsonValue,
            source,
        },
    });
}

export async function listOnboardingAnswers(userId: string) {
    await assertActiveUser(userId);
    return prisma.onboardingAnswer.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
    });
}

async function createSponsorOffer(
    tx: Prisma.TransactionClient,
    userId: string,
    input: SponsorOfferInput,
    params: { eventId?: string; todoId?: string },
) {
    if (input.productId) {
        const product = await tx.sponsorProduct.findFirst({
            where: {
                id: input.productId,
                isActive: true,
                deletedAt: null,
            },
            select: { id: true },
        });

        if (!product) {
            throw apiError(
                404,
                'SPONSOR_PRODUCT_NOT_FOUND',
                'Sponsor product not found',
            );
        }
    }

    return tx.sponsorOffer.create({
        data: {
            userId,
            productId: input.productId,
            eventId: params.eventId,
            todoId: params.todoId,
            title: input.title,
            description: input.description,
            url: input.url,
            sponsorName: input.sponsorName,
            placement: input.placement,
            metadata: toJson(input.metadata),
        },
    });
}

async function createReminder(
    tx: Prisma.TransactionClient,
    userId: string,
    input: ReminderInput,
    source: Source,
    params: { eventId?: string; todoId?: string },
) {
    return tx.reminder.create({
        data: {
            userId,
            eventId: params.eventId,
            todoId: params.todoId,
            triggerAt: new Date(input.triggerAt),
            channel: input.channel ?? 'push',
            payload: toJson(input.payload),
            source,
        },
    });
}

async function createTodoRecord(
    tx: Prisma.TransactionClient,
    userId: string,
    input: TodoInput & { eventId?: string },
    source: Source,
) {
    if (input.eventId) await ensureEventOwnedByUser(userId, input.eventId, tx);

    const todo = await tx.todo.create({
        data: {
            userId,
            eventId: input.eventId,
            title: input.title,
            dueAt: input.dueAt ? new Date(input.dueAt) : undefined,
            metadata: toJson(input.metadata),
            source,
        },
    });

    if (input.sponsorOffer) {
        await createSponsorOffer(tx, userId, input.sponsorOffer, {
            eventId: input.eventId,
            todoId: todo.id,
        });
    }

    for (const reminder of input.reminders ?? []) {
        await createReminder(tx, userId, reminder, source, { todoId: todo.id });
    }

    return todo;
}

export async function createUserEvent(
    userId: string,
    input: {
        title: string;
        description?: string;
        eventAt?: string;
        timezone?: string;
        metadata?: Record<string, unknown>;
        sponsorOffer?: SponsorOfferInput;
        todos?: TodoInput[];
        reminders?: ReminderInput[];
    },
    source: Source,
) {
    await assertActiveUser(userId);

    const event = await prisma.$transaction(async (tx) => {
        const created = await tx.userEvent.create({
            data: {
                userId,
                title: input.title,
                description: input.description,
                eventAt: input.eventAt ? new Date(input.eventAt) : undefined,
                timezone: input.timezone,
                metadata: toJson(input.metadata),
                source,
            },
        });

        if (input.sponsorOffer) {
            await createSponsorOffer(tx, userId, input.sponsorOffer, {
                eventId: created.id,
            });
        }

        for (const reminder of input.reminders ?? []) {
            await createReminder(tx, userId, reminder, source, {
                eventId: created.id,
            });
        }

        for (const todo of input.todos ?? []) {
            await createTodoRecord(
                tx,
                userId,
                { ...todo, eventId: created.id },
                source,
            );
        }

        return created;
    });

    return getUserEventById(userId, event.id);
}

export async function getUserEventById(userId: string, eventId: string) {
    const event = await prisma.userEvent.findFirst({
        where: { id: eventId, userId, deletedAt: null },
        include: eventInclude,
    });

    if (!event) throw apiError(404, 'NOT_FOUND', 'Event not found');
    return event;
}

export async function listUserEvents(userId: string) {
    await assertActiveUser(userId);
    return prisma.userEvent.findMany({
        where: { userId, deletedAt: null },
        include: eventInclude,
        orderBy: [{ eventAt: 'asc' }, { createdAt: 'desc' }],
    });
}

export async function updateUserEvent(
    userId: string,
    eventId: string,
    input: {
        title?: string;
        description?: string | null;
        eventAt?: string | null;
        timezone?: string | null;
        metadata?: Record<string, unknown>;
    },
) {
    await ensureEventOwnedByUser(userId, eventId);

    await prisma.userEvent.update({
        where: { id: eventId },
        data: {
            title: input.title,
            description: input.description,
            eventAt: toDate(input.eventAt),
            timezone: input.timezone,
            metadata:
                input.metadata === undefined ? undefined : toJson(input.metadata),
        },
    });

    return getUserEventById(userId, eventId);
}

export async function deleteUserEvent(userId: string, eventId: string) {
    await ensureEventOwnedByUser(userId, eventId);

    await prisma.userEvent.update({
        where: { id: eventId },
        data: { deletedAt: new Date() },
    });
}

export async function createUserTodo(
    userId: string,
    input: TodoInput & { eventId?: string },
    source: Source,
) {
    await assertActiveUser(userId);

    const todo = await prisma.$transaction((tx) =>
        createTodoRecord(tx, userId, input, source),
    );

    return getUserTodoById(userId, todo.id);
}

export async function getUserTodoById(userId: string, todoId: string) {
    const todo = await prisma.todo.findFirst({
        where: { id: todoId, userId, deletedAt: null },
        include: todoInclude,
    });

    if (!todo) throw apiError(404, 'NOT_FOUND', 'Todo not found');
    return todo;
}

export async function listUserTodos(userId: string) {
    await assertActiveUser(userId);
    return prisma.todo.findMany({
        where: { userId, deletedAt: null },
        include: todoInclude,
        orderBy: [{ dueAt: 'asc' }, { createdAt: 'desc' }],
    });
}

export async function updateUserTodo(
    userId: string,
    todoId: string,
    input: {
        title?: string;
        status?: TodoStatus;
        dueAt?: string | null;
        metadata?: Record<string, unknown>;
    },
) {
    await getUserTodoById(userId, todoId);

    await prisma.todo.update({
        where: { id: todoId },
        data: {
            title: input.title,
            status: input.status,
            dueAt: toDate(input.dueAt),
            metadata:
                input.metadata === undefined ? undefined : toJson(input.metadata),
        },
    });

    return getUserTodoById(userId, todoId);
}

export async function deleteUserTodo(userId: string, todoId: string) {
    await getUserTodoById(userId, todoId);

    await prisma.todo.update({
        where: { id: todoId },
        data: { deletedAt: new Date() },
    });
}

export async function listUserReminders(userId: string) {
    await assertActiveUser(userId);
    return prisma.reminder.findMany({
        where: { userId },
        orderBy: [{ triggerAt: 'asc' }, { createdAt: 'desc' }],
    });
}

export async function updateUserReminderStatus(
    userId: string,
    reminderId: string,
    status: ReminderStatus,
) {
    const reminder = await prisma.reminder.findFirst({
        where: { id: reminderId, userId },
        select: { id: true },
    });
    if (!reminder) throw apiError(404, 'NOT_FOUND', 'Reminder not found');

    return prisma.reminder.update({
        where: { id: reminderId },
        data: { status },
    });
}
