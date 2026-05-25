import {
    Controller,
    Get,
    Request,
    Route,
    Security,
    Tags,
} from 'tsoa';
import type { Request as ExpressRequest } from 'express';

import {
    listTodos,
} from '../../domain/aiService/aiService.service';
import type { AiTodoDTO } from '../dto/aiService.dto';

@Route('todos')
@Tags('Todos')
export class TodosController extends Controller {
    @Get()
    @Security('cookieAuth')
    public async list(@Request() req: ExpressRequest): Promise<AiTodoDTO[]> {
        const todos = await listTodos(req.user!.id);
        return todos.map((todo) => ({
            id: todo.id,
            text: todo.text,
            due: todo.due,
            completed: todo.completed,
        }));
    }
}
