import {
    Body,
    Controller,
    Delete,
    Get,
    Patch,
    Path,
    Post,
    Route,
    Security,
    Tags,
} from 'tsoa';

import {
    createUserEvent,
    createUserTodo,
    deleteUserEvent,
    deleteUserTodo,
    getAiUserContext,
    updateUserEvent,
    updateUserReminderStatus,
    updateUserTodo,
} from '../../domain/companion/companion.service';
import {
    deleteUserAiProfileFactByKey,
    getUserAiProfile,
    updateUserAiProfile,
    upsertUserAiProfileFact,
} from '../../domain/users/userAiProfile.service';
import {
    aiServiceFactsSchema,
    aiProfileFactKeyParamsSchema,
    updateAiProfileSchema,
} from '../schemas/aiProfile.schemas';
import {
    eventCreateSchema,
    eventUpdateSchema,
    reminderUpdateSchema,
    standaloneTodoCreateSchema,
    todoUpdateSchema,
    userIdParamsSchema,
    uuidParamsSchema,
} from '../schemas/companion.schemas';
import {
    toUserAiProfileDTO,
    type AiProfileFactInputDTO,
    type UpdateAiProfileBodyDTO,
    type UserAiProfileDTO,
} from '../dto/aiProfile.dto';
import {
    toOnboardingAnswerDTO,
    toReminderDTO,
    toTodoDTO,
    toUserEventDTO,
    type AiUserContextDTO,
    type CreateEventBodyDTO,
    type CreateTodoBodyDTO,
    type ReminderDTO,
    type TodoDTO,
    type UpdateEventBodyDTO,
    type UpdateReminderBodyDTO,
    type UpdateTodoBodyDTO,
    type UserEventDTO,
} from '../dto/companion.dto';
import type { OkDTO } from '../dto/common.dto';

type AiServiceFactsBodyDTO = {
    facts: AiProfileFactInputDTO[];
};

@Route('ai-service/users')
@Tags('AI Service')
@Security('serviceBearerAuth')
export class AiServiceController extends Controller {
    @Get('{userId}/context')
    public async getContext(@Path() userId: string): Promise<AiUserContextDTO> {
        const params = userIdParamsSchema.parse({ userId });
        const [profile, context] = await Promise.all([
            getUserAiProfile(params.userId),
            getAiUserContext(params.userId),
        ]);

        return {
            userId: params.userId,
            profile: toUserAiProfileDTO(profile),
            onboardingAnswers: context.onboardingAnswers.map(
                toOnboardingAnswerDTO,
            ),
            events: context.events.map(toUserEventDTO),
            todos: context.todos.map(toTodoDTO),
            reminders: context.reminders.map(toReminderDTO),
        };
    }

    @Post('{userId}/facts')
    public async upsertFacts(
        @Path() userId: string,
        @Body() body: AiServiceFactsBodyDTO,
    ): Promise<UserAiProfileDTO> {
        const params = userIdParamsSchema.parse({ userId });
        const data = aiServiceFactsSchema.parse(body);
        let profile = await getUserAiProfile(params.userId);

        for (const fact of data.facts) {
            profile = await upsertUserAiProfileFact(
                params.userId,
                fact.key,
                {
                    value: fact.value,
                    source: fact.source ?? 'ai',
                    confidence: fact.confidence,
                },
            );
        }

        return toUserAiProfileDTO(profile);
    }

    @Patch('{userId}/profile')
    public async updateProfile(
        @Path() userId: string,
        @Body() body: UpdateAiProfileBodyDTO,
    ): Promise<UserAiProfileDTO> {
        const params = userIdParamsSchema.parse({ userId });
        const data = updateAiProfileSchema.parse(body);
        return toUserAiProfileDTO(
            await updateUserAiProfile(params.userId, data),
        );
    }

    @Delete('{userId}/facts/{key}')
    public async deleteFact(
        @Path() userId: string,
        @Path() key: string,
    ): Promise<UserAiProfileDTO> {
        const userParams = userIdParamsSchema.parse({ userId });
        const factParams = aiProfileFactKeyParamsSchema.parse({ key });
        return toUserAiProfileDTO(
            await deleteUserAiProfileFactByKey(
                userParams.userId,
                factParams.key,
            ),
        );
    }

    @Post('{userId}/events')
    public async createEvent(
        @Path() userId: string,
        @Body() body: CreateEventBodyDTO,
    ): Promise<UserEventDTO> {
        const params = userIdParamsSchema.parse({ userId });
        const data = eventCreateSchema.parse(body);
        return toUserEventDTO(await createUserEvent(params.userId, data, 'ai'));
    }

    @Patch('{userId}/events/{id}')
    public async updateEvent(
        @Path() userId: string,
        @Path() id: string,
        @Body() body: UpdateEventBodyDTO,
    ): Promise<UserEventDTO> {
        const userParams = userIdParamsSchema.parse({ userId });
        const eventParams = uuidParamsSchema.parse({ id });
        const data = eventUpdateSchema.parse(body);
        return toUserEventDTO(
            await updateUserEvent(userParams.userId, eventParams.id, data),
        );
    }

    @Delete('{userId}/events/{id}')
    public async deleteEvent(
        @Path() userId: string,
        @Path() id: string,
    ): Promise<OkDTO> {
        const userParams = userIdParamsSchema.parse({ userId });
        const eventParams = uuidParamsSchema.parse({ id });
        await deleteUserEvent(userParams.userId, eventParams.id);
        return { status: 'ok' };
    }

    @Post('{userId}/todos')
    public async createTodo(
        @Path() userId: string,
        @Body() body: CreateTodoBodyDTO,
    ): Promise<TodoDTO> {
        const params = userIdParamsSchema.parse({ userId });
        const data = standaloneTodoCreateSchema.parse(body);
        return toTodoDTO(await createUserTodo(params.userId, data, 'ai'));
    }

    @Patch('{userId}/todos/{id}')
    public async updateTodo(
        @Path() userId: string,
        @Path() id: string,
        @Body() body: UpdateTodoBodyDTO,
    ): Promise<TodoDTO> {
        const userParams = userIdParamsSchema.parse({ userId });
        const todoParams = uuidParamsSchema.parse({ id });
        const data = todoUpdateSchema.parse(body);
        return toTodoDTO(
            await updateUserTodo(userParams.userId, todoParams.id, data),
        );
    }

    @Delete('{userId}/todos/{id}')
    public async deleteTodo(
        @Path() userId: string,
        @Path() id: string,
    ): Promise<OkDTO> {
        const userParams = userIdParamsSchema.parse({ userId });
        const todoParams = uuidParamsSchema.parse({ id });
        await deleteUserTodo(userParams.userId, todoParams.id);
        return { status: 'ok' };
    }

    @Patch('{userId}/reminders/{id}')
    public async updateReminder(
        @Path() userId: string,
        @Path() id: string,
        @Body() body: UpdateReminderBodyDTO,
    ): Promise<ReminderDTO> {
        const userParams = userIdParamsSchema.parse({ userId });
        const reminderParams = uuidParamsSchema.parse({ id });
        const data = reminderUpdateSchema.parse(body);
        return toReminderDTO(
            await updateUserReminderStatus(
                userParams.userId,
                reminderParams.id,
                data.status,
            ),
        );
    }
}
