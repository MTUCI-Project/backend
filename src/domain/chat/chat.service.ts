import { z } from 'zod';

import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { prisma } from '../../lib/prisma';
import { assertActiveUser } from '../companion/companion.service';
import { broadcastChatEvent } from './chat.gateway';
import { toChatMessageDTO } from '../../http/dto/chat.dto';

const aiChatResponseSchema = z.union([
    z.string().trim().min(1),
    z.object({ response: z.string().trim().min(1) }).transform((body) => body.response),
    z.object({ reply: z.string().trim().min(1) }).transform((body) => body.reply),
    z.object({ answer: z.string().trim().min(1) }).transform((body) => body.answer),
    z.object({ text: z.string().trim().min(1) }).transform((body) => body.text),
    z.object({ message: z.string().trim().min(1) }).transform((body) => body.message),
]);

function publish(
    userId: string,
    type: 'chat.message.created' | 'chat.message.updated',
    message: any,
) {
    broadcastChatEvent(userId, { type, message: toChatMessageDTO(message) });
}

export async function listChatMessages(userId: string, limit: number) {
    await assertActiveUser(userId);
    const messages = await prisma.userChatMessage.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: limit,
    });
    return messages.reverse();
}

export async function sendUserMessage(userId: string, text: string) {
    await assertActiveUser(userId);
    const created = await prisma.userChatMessage.create({
        data: {
            userId,
            sender: 'user',
            message: text,
            deliveryStatus: 'pending',
        },
    });
    publish(userId, 'chat.message.created', created);

    let deliveryStatus: 'sent' | 'failed' = 'sent';
    try {
        const controller = new AbortController();
        const timeout = setTimeout(
            () => controller.abort(),
            env.AI_BACKEND_TIMEOUT_MS,
        );
        try {
            const response = await fetch(`${env.AI_BACKEND_BASE_URL}/ml/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    message: text,
                    timestamp: created.timestamp.toISOString(),
                }),
                signal: controller.signal,
            });
            if (!response.ok) {
                throw new Error(`AI backend returned ${response.status}`);
            }

            const assistantText = aiChatResponseSchema.parse(await response.json());
            await publishAssistantMessage(userId, assistantText, new Date());
        } finally {
            clearTimeout(timeout);
        }
    } catch (err) {
        deliveryStatus = 'failed';
        logger.warn({ err, userId }, 'Unable to deliver chat message to AI backend');
    }

    const updated = await prisma.userChatMessage.update({
        where: { id: created.id },
        data: { deliveryStatus },
    });
    publish(userId, 'chat.message.updated', updated);
    return updated;
}

export async function publishAssistantMessage(
    userId: string,
    text: string,
    timestamp: Date,
) {
    const created = await prisma.userChatMessage.create({
        data: {
            userId,
            sender: 'assistant',
            message: text,
            timestamp,
            deliveryStatus: 'sent',
        },
    });
    publish(userId, 'chat.message.created', created);
    return created;
}
