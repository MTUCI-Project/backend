import type { IncomingMessage, Server } from 'node:http';
import WebSocket, { WebSocketServer } from 'ws';

import { verifyAccessToken } from '../auth/token.service';
import { prisma } from '../../lib/prisma';
import { logger } from '../../config/logger';
import type { ChatMessageDTO } from '../../http/dto/chat.dto';

type ChatSocketEvent = {
    type: 'chat.message.created' | 'chat.message.updated';
    message: ChatMessageDTO;
};

const clients = new Map<string, Set<WebSocket>>();

function bearerToken(req: IncomingMessage) {
    const authorization = req.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) return undefined;
    return authorization.slice('Bearer '.length).trim() || undefined;
}

export function broadcastChatEvent(userId: string, event: ChatSocketEvent) {
    const encoded = JSON.stringify(event);
    for (const socket of clients.get(userId) ?? []) {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(encoded);
        }
    }
}

export function attachChatWebSocketServer(server: Server) {
    const wss = new WebSocketServer({ noServer: true });

    server.on('upgrade', async (req, socket, head) => {
        const url = new URL(req.url ?? '/', 'http://localhost');
        if (url.pathname !== '/ws/chat') return;

        const token = url.searchParams.get('access_token') ?? bearerToken(req);
        try {
            if (!token) throw new Error('Missing access token');
            const payload = verifyAccessToken(token);
            const user = await prisma.user.findUnique({
                where: { id: payload.sub },
                select: { id: true, deletedAt: true },
            });
            if (!user || user.deletedAt) throw new Error('User not found');

            wss.handleUpgrade(req, socket, head, (websocket) => {
                const sockets = clients.get(user.id) ?? new Set<WebSocket>();
                sockets.add(websocket);
                clients.set(user.id, sockets);
                websocket.on('close', () => {
                    sockets.delete(websocket);
                    if (sockets.size === 0) clients.delete(user.id);
                });
            });
        } catch (err) {
            logger.warn({ err }, 'Rejected chat websocket connection');
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
        }
    });
}
