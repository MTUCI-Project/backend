import { Controller, Get, Request, Route, Security, Tags } from 'tsoa';
import type { Request as ExpressRequest } from 'express';

import { listEvents } from '../../domain/aiService/aiService.service';
import type { AiEventDTO } from '../dto/aiService.dto';

@Route('events')
@Tags('Events')
export class EventsController extends Controller {
    @Get()
    @Security('cookieAuth')
    public async list(@Request() req: ExpressRequest): Promise<AiEventDTO[]> {
        const events = await listEvents(req.user!.id);
        return events.map((event) => ({
            id: event.id,
            title: event.title,
            description: event.description,
            date: event.date,
            status: event.status,
        }));
    }
}
