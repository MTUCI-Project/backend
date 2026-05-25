import {
    Body,
    Controller,
    Get,
    Post,
    Query,
    Request,
    Route,
    Security,
    Tags,
} from 'tsoa';
import type { Request as ExpressRequest } from 'express';

import { listChatMessages, sendUserMessage } from '../../domain/chat/chat.service';
import { chatHistoryLimitSchema, chatMessageCreateSchema } from '../schemas/chat.schemas';
import {
    toChatMessageDTO,
    type ChatMessageDTO,
    type CreateChatMessageBodyDTO,
} from '../dto/chat.dto';

@Route('chat/messages')
@Tags('Chat')
@Security('cookieAuth')
export class ChatController extends Controller {
    @Get()
    public async list(
        @Request() req: ExpressRequest,
        @Query() limit?: number,
    ): Promise<ChatMessageDTO[]> {
        const parsedLimit = chatHistoryLimitSchema.parse(limit);
        const messages = await listChatMessages(req.user!.id, parsedLimit);
        return messages.map(toChatMessageDTO);
    }

    @Post()
    public async create(
        @Request() req: ExpressRequest,
        @Body() body: CreateChatMessageBodyDTO,
    ): Promise<ChatMessageDTO> {
        const data = chatMessageCreateSchema.parse(body);
        return toChatMessageDTO(await sendUserMessage(req.user!.id, data.message));
    }
}
