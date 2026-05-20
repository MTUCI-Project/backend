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
    listUserTodos,
} from '../../domain/companion/companion.service';
import {
    toTodoDTO,
    type TodoDTO,
} from '../dto/companion.dto';

@Route('todos')
@Tags('Todos')
export class TodosController extends Controller {
    @Get()
    @Security('cookieAuth')
    public async list(@Request() req: ExpressRequest): Promise<TodoDTO[]> {
        const todos = await listUserTodos(req.user!.id);
        return todos.map(toTodoDTO);
    }
}
