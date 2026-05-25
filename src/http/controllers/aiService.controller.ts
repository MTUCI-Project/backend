import {
    Body,
    Controller,
    Delete,
    Get,
    Patch,
    Path,
    Post,
    Query,
    Route,
    Tags,
} from 'tsoa';

import * as aiService from '../../domain/aiService/aiService.service';
import {
    aiChatHistoryLimitSchema,
    aiChatMessageCreateSchema,
    aiEventCreateSchema,
    aiEventUpdateSchema,
    aiFactCreateSchema,
    aiFactKeyParamsSchema,
    aiProfileUpdateSchema,
    aiRecordIdParamsSchema,
    aiReminderUpdateSchema,
    aiSponsorSuggestionCreateSchema,
    aiSponsorSuggestionUpdateSchema,
    aiTodoCreateSchema,
    aiTodoUpdateSchema,
    aiUserIdParamsSchema,
} from '../schemas/aiService.schemas';
import type {
    AiChatMessageBodyDTO,
    AiChatMessageDTO,
    AiChatResponseDTO,
    AiEventBodyDTO,
    AiEventDTO,
    AiEventUpdateBodyDTO,
    AiDeletedFactResponseDTO,
    AiFactBodyDTO,
    AiFactResponseDTO,
    AiReminderDTO,
    AiReminderUpdateBodyDTO,
    AiSponsorSuggestionBodyDTO,
    AiSponsorSuggestionDTO,
    AiStatusDTO,
    AiTodoBodyDTO,
    AiTodoDTO,
    AiTodoUpdateBodyDTO,
    AiUserContextDTO,
} from '../dto/aiService.dto';

type JsonObject = Record<string, unknown>;

function toEventDTO(event: {
    id: string;
    title: string;
    description: string | null;
    date: string;
    status: string;
}): AiEventDTO {
    return {
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.date,
        status: event.status,
    };
}

function toTodoDTO(todo: {
    id: string;
    text: string;
    due: string | null;
    completed: boolean;
}): AiTodoDTO {
    return {
        id: todo.id,
        text: todo.text,
        due: todo.due,
        completed: todo.completed,
    };
}

function toReminderDTO(reminder: {
    id: string;
    text: string | null;
    remindAt: string | null;
    isActive: boolean;
}): AiReminderDTO {
    return {
        id: reminder.id,
        text: reminder.text,
        remind_at: reminder.remindAt,
        is_active: reminder.isActive,
    };
}

@Route('ai-service/users')
@Tags('AI Service')
export class AiServiceController extends Controller {
    @Post('{userId}/chat')
    public async addChatMessage(
        @Path() userId: string,
        @Body() body: AiChatMessageBodyDTO,
    ): Promise<AiChatResponseDTO> {
        const params = aiUserIdParamsSchema.parse({ userId });
        const data = aiChatMessageCreateSchema.parse(body);
        await aiService.addChatMessage(params.userId, data);
        return { status: 'ok', message: 'Message saved to chat history' };
    }

    @Get('{userId}/chat_history')
    public async getChatHistory(
        @Path() userId: string,
        @Query() limit?: number,
    ): Promise<AiChatMessageDTO[]> {
        const params = aiUserIdParamsSchema.parse({ userId });
        const parsedLimit = aiChatHistoryLimitSchema.parse(limit);
        const messages = await aiService.getChatHistory(params.userId, parsedLimit);
        return messages.map((message) => ({
            id: message.id,
            message: message.message,
            sentiment: message.sentiment,
            timestamp: message.timestamp.toISOString(),
        }));
    }

    @Get('{userId}/context')
    public async getContext(@Path() userId: string): Promise<AiUserContextDTO> {
        const params = aiUserIdParamsSchema.parse({ userId });
        const context = await aiService.getContext(params.userId);
        return {
            user_id: params.userId,
            profile: context.profile,
            facts: context.facts,
            events: context.events.map(toEventDTO),
            todos: context.todos.map(toTodoDTO),
            reminders: context.reminders.map(toReminderDTO),
            weather: 'солнечно, +22°C',
            current_time: new Date().toISOString(),
        };
    }

    @Post('{userId}/facts')
    public async addFact(
        @Path() userId: string,
        @Body() body: AiFactBodyDTO,
    ): Promise<AiFactResponseDTO> {
        const params = aiUserIdParamsSchema.parse({ userId });
        const data = aiFactCreateSchema.parse(body);
        await aiService.addFact(params.userId, data.key, data.value);
        return { status: 'ok', key: data.key, value: data.value };
    }

    @Delete('{userId}/facts/{key}')
    public async deleteFact(
        @Path() userId: string,
        @Path() key: string,
    ): Promise<AiDeletedFactResponseDTO> {
        const params = aiUserIdParamsSchema.parse({ userId });
        const fact = aiFactKeyParamsSchema.parse({ key });
        await aiService.deleteFact(params.userId, fact.key);
        return { status: 'deleted', key: fact.key };
    }

    @Patch('{userId}/profile')
    public async updateProfile(
        @Path() userId: string,
        @Body() body: JsonObject,
    ): Promise<JsonObject> {
        const params = aiUserIdParamsSchema.parse({ userId });
        const data = aiProfileUpdateSchema.parse(body);
        return aiService.updateProfile(params.userId, data);
    }

    @Post('{userId}/events')
    public async createEvent(
        @Path() userId: string,
        @Body() body: AiEventBodyDTO,
    ): Promise<AiEventDTO> {
        const params = aiUserIdParamsSchema.parse({ userId });
        const data = aiEventCreateSchema.parse(body);
        return toEventDTO(await aiService.createEvent(params.userId, data));
    }

    @Patch('{userId}/events/{id}')
    public async updateEvent(
        @Path() userId: string,
        @Path() id: string,
        @Body() body: AiEventUpdateBodyDTO,
    ): Promise<AiEventDTO> {
        const params = aiUserIdParamsSchema.parse({ userId });
        const record = aiRecordIdParamsSchema.parse({ id });
        const data = aiEventUpdateSchema.parse(body);
        return toEventDTO(
            await aiService.updateEvent(params.userId, record.id, data),
        );
    }

    @Delete('{userId}/events/{id}')
    public async deleteEvent(
        @Path() userId: string,
        @Path() id: string,
    ): Promise<AiStatusDTO> {
        const params = aiUserIdParamsSchema.parse({ userId });
        const record = aiRecordIdParamsSchema.parse({ id });
        await aiService.deleteEvent(params.userId, record.id);
        return { status: 'deleted' };
    }

    @Post('{userId}/todos')
    public async createTodo(
        @Path() userId: string,
        @Body() body: AiTodoBodyDTO,
    ): Promise<AiTodoDTO> {
        const params = aiUserIdParamsSchema.parse({ userId });
        const data = aiTodoCreateSchema.parse(body);
        return toTodoDTO(await aiService.createTodo(params.userId, data));
    }

    @Patch('{userId}/todos/{id}')
    public async updateTodo(
        @Path() userId: string,
        @Path() id: string,
        @Body() body: AiTodoUpdateBodyDTO,
    ): Promise<AiTodoDTO> {
        const params = aiUserIdParamsSchema.parse({ userId });
        const record = aiRecordIdParamsSchema.parse({ id });
        const data = aiTodoUpdateSchema.parse(body);
        return toTodoDTO(
            await aiService.updateTodo(params.userId, record.id, data),
        );
    }

    @Delete('{userId}/todos/{id}')
    public async deleteTodo(
        @Path() userId: string,
        @Path() id: string,
    ): Promise<AiStatusDTO> {
        const params = aiUserIdParamsSchema.parse({ userId });
        const record = aiRecordIdParamsSchema.parse({ id });
        await aiService.deleteTodo(params.userId, record.id);
        return { status: 'deleted' };
    }

    @Patch('{userId}/reminders/{id}')
    public async updateReminder(
        @Path() userId: string,
        @Path() id: string,
        @Body() body: AiReminderUpdateBodyDTO,
    ): Promise<AiReminderDTO> {
        const params = aiUserIdParamsSchema.parse({ userId });
        const record = aiRecordIdParamsSchema.parse({ id });
        const data = aiReminderUpdateSchema.parse(body);
        return toReminderDTO(
            await aiService.updateReminder(params.userId, record.id, data),
        );
    }

    @Post('{userId}/sponsor-suggestions')
    public async createSponsorSuggestion(
        @Path() userId: string,
        @Body() body: AiSponsorSuggestionBodyDTO,
    ): Promise<AiSponsorSuggestionDTO> {
        const params = aiUserIdParamsSchema.parse({ userId });
        const data = aiSponsorSuggestionCreateSchema.parse(body);
        return (await aiService.createSponsorSuggestion(
            params.userId,
            data,
        )) as AiSponsorSuggestionDTO;
    }

    @Patch('{userId}/sponsor-suggestions/{id}')
    public async updateSponsorSuggestion(
        @Path() userId: string,
        @Path() id: string,
        @Body() body: JsonObject,
    ): Promise<AiSponsorSuggestionDTO> {
        const params = aiUserIdParamsSchema.parse({ userId });
        const record = aiRecordIdParamsSchema.parse({ id });
        const data = aiSponsorSuggestionUpdateSchema.parse(body);
        return (await aiService.updateSponsorSuggestion(
            params.userId,
            record.id,
            data,
        )) as AiSponsorSuggestionDTO;
    }

    @Get('{userId}/sponsor-suggestions')
    public async getSponsorSuggestions(
        @Path() userId: string,
    ): Promise<AiSponsorSuggestionDTO[]> {
        const params = aiUserIdParamsSchema.parse({ userId });
        return (await aiService.getSponsorSuggestions(
            params.userId,
        )) as AiSponsorSuggestionDTO[];
    }

    @Delete('{userId}/reset')
    public async resetUser(@Path() userId: string): Promise<AiStatusDTO> {
        const params = aiUserIdParamsSchema.parse({ userId });
        await aiService.resetUser(params.userId);
        return { status: 'reset' };
    }
}
