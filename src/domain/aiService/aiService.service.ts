import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { apiError } from '../../http/errors/ApiError';
import { assertActiveUser } from '../companion/companion.service';

type JsonObject = Record<string, unknown>;

type ChatMessageInput = {
    message: string;
    sentiment: number;
};

type EventInput = {
    title: string;
    description?: string | null;
    date: string;
    status?: string;
};

type EventUpdateInput = Partial<EventInput>;

type TodoInput = {
    text: string;
    due?: string | null;
};

type TodoUpdateInput = Partial<TodoInput> & {
    completed?: boolean;
};

type ReminderUpdateInput = {
    text?: string | null;
    remind_at?: string | null;
    is_active?: boolean;
};

type SponsorSuggestionInput = {
    title: string;
    description: string;
    price?: number | null;
    partner_url?: string | null;
};

function jsonObject(value: Prisma.JsonValue | null | undefined): JsonObject {
    if (!value || Array.isArray(value) || typeof value !== 'object') return {};
    return value as JsonObject;
}

function inputJson(value: JsonObject): Prisma.InputJsonObject {
    return value as Prisma.InputJsonObject;
}

async function assertEvent(userId: string, id: string) {
    const event = await prisma.aiServiceEvent.findFirst({
        where: { id, userId },
    });
    if (!event) throw apiError(404, 'NOT_FOUND', 'Event not found');
    return event;
}

async function assertTodo(userId: string, id: string) {
    const todo = await prisma.aiServiceTodo.findFirst({
        where: { id, userId },
    });
    if (!todo) throw apiError(404, 'NOT_FOUND', 'Todo not found');
    return todo;
}

export async function addChatMessage(userId: string, input: ChatMessageInput) {
    await assertActiveUser(userId);
    return prisma.aiServiceChatMessage.create({
        data: { userId, message: input.message, sentiment: input.sentiment },
    });
}

export async function getChatHistory(userId: string, limit: number) {
    await assertActiveUser(userId);
    if (limit === 0) return [];

    const messages = await prisma.aiServiceChatMessage.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: limit,
    });

    return messages.reverse();
}

export async function getContext(userId: string) {
    await assertActiveUser(userId);
    const [state, events, todos, reminders] = await Promise.all([
        prisma.aiServiceState.findUnique({ where: { userId } }),
        prisma.aiServiceEvent.findMany({ where: { userId } }),
        prisma.aiServiceTodo.findMany({ where: { userId } }),
        prisma.aiServiceReminder.findMany({ where: { userId } }),
    ]);

    return {
        profile: jsonObject(state?.profile),
        facts: jsonObject(state?.facts),
        events,
        todos,
        reminders,
    };
}

export async function addFact(userId: string, key: string, value: unknown) {
    await assertActiveUser(userId);
    const state = await prisma.aiServiceState.findUnique({ where: { userId } });
    const facts = { ...jsonObject(state?.facts), [key]: value };

    await prisma.aiServiceState.upsert({
        where: { userId },
        update: { facts: inputJson(facts) },
        create: { userId, facts: inputJson(facts) },
    });
}

export async function deleteFact(userId: string, key: string) {
    await assertActiveUser(userId);
    const state = await prisma.aiServiceState.findUnique({ where: { userId } });
    if (!state) return;

    const facts = jsonObject(state.facts);
    delete facts[key];
    await prisma.aiServiceState.update({
        where: { userId },
        data: { facts: inputJson(facts) },
    });
}

export async function updateProfile(userId: string, updates: JsonObject) {
    await assertActiveUser(userId);
    const state = await prisma.aiServiceState.findUnique({ where: { userId } });
    const profile = { ...jsonObject(state?.profile), ...updates };

    await prisma.aiServiceState.upsert({
        where: { userId },
        update: { profile: inputJson(profile) },
        create: { userId, profile: inputJson(profile) },
    });
    return profile;
}

export async function createEvent(userId: string, input: EventInput) {
    await assertActiveUser(userId);
    return prisma.aiServiceEvent.create({
        data: {
            userId,
            title: input.title,
            description: input.description ?? null,
            date: input.date,
            status: input.status ?? 'planned',
        },
    });
}

export async function updateEvent(
    userId: string,
    id: string,
    input: EventUpdateInput,
) {
    await assertEvent(userId, id);
    return prisma.aiServiceEvent.update({
        where: { id },
        data: {
            title: input.title,
            description: input.description,
            date: input.date,
            status: input.status,
        },
    });
}

export async function deleteEvent(userId: string, id: string) {
    await assertEvent(userId, id);
    await prisma.aiServiceEvent.delete({ where: { id } });
}

export async function createTodo(userId: string, input: TodoInput) {
    await assertActiveUser(userId);
    return prisma.aiServiceTodo.create({
        data: {
            userId,
            text: input.text,
            due: input.due ?? null,
        },
    });
}

export async function updateTodo(
    userId: string,
    id: string,
    input: TodoUpdateInput,
) {
    await assertTodo(userId, id);
    return prisma.aiServiceTodo.update({
        where: { id },
        data: {
            text: input.text,
            due: input.due,
            completed: input.completed,
        },
    });
}

export async function deleteTodo(userId: string, id: string) {
    await assertTodo(userId, id);
    await prisma.aiServiceTodo.delete({ where: { id } });
}

export async function updateReminder(
    userId: string,
    id: string,
    input: ReminderUpdateInput,
) {
    const reminder = await prisma.aiServiceReminder.findFirst({
        where: { id, userId },
        select: { id: true },
    });
    if (!reminder) throw apiError(404, 'NOT_FOUND', 'Reminder not found');

    return prisma.aiServiceReminder.update({
        where: { id },
        data: {
            text: input.text,
            remindAt: input.remind_at,
            isActive: input.is_active,
        },
    });
}

export async function createSponsorSuggestion(
    userId: string,
    input: SponsorSuggestionInput,
) {
    await assertActiveUser(userId);
    const created_at = new Date().toISOString();
    const data: JsonObject = {
        title: input.title,
        description: input.description,
        price: input.price ?? null,
        partner_url: input.partner_url ?? null,
        status: 'pending',
        created_at,
    };
    const suggestion = await prisma.aiServiceSponsorSuggestion.create({
        data: { userId, data: inputJson(data) },
    });
    return { id: suggestion.id, ...data };
}

export async function updateSponsorSuggestion(
    userId: string,
    id: string,
    updates: JsonObject,
) {
    const suggestion = await prisma.aiServiceSponsorSuggestion.findFirst({
        where: { id, userId },
    });
    if (!suggestion) {
        throw apiError(404, 'NOT_FOUND', 'Suggestion not found');
    }

    const data = { ...jsonObject(suggestion.data), ...updates };
    await prisma.aiServiceSponsorSuggestion.update({
        where: { id },
        data: { data: inputJson(data) },
    });
    return { id, ...data };
}

export async function getSponsorSuggestions(userId: string) {
    await assertActiveUser(userId);
    const suggestions = await prisma.aiServiceSponsorSuggestion.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
    });
    return suggestions.map((suggestion) => ({
        id: suggestion.id,
        ...jsonObject(suggestion.data),
    }));
}

export async function resetUser(userId: string) {
    await assertActiveUser(userId);
    await prisma.$transaction([
        prisma.aiServiceState.deleteMany({ where: { userId } }),
        prisma.aiServiceEvent.deleteMany({ where: { userId } }),
        prisma.aiServiceTodo.deleteMany({ where: { userId } }),
        prisma.aiServiceReminder.deleteMany({ where: { userId } }),
        prisma.aiServiceSponsorSuggestion.deleteMany({ where: { userId } }),
    ]);
}
