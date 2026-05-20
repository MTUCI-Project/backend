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
    listUserReminders,
} from '../../domain/companion/companion.service';
import {
    toReminderDTO,
    type ReminderDTO,
} from '../dto/companion.dto';

@Route('reminders')
@Tags('Reminders')
export class RemindersController extends Controller {
    @Get()
    @Security('cookieAuth')
    public async list(
        @Request() req: ExpressRequest,
    ): Promise<ReminderDTO[]> {
        const reminders = await listUserReminders(req.user!.id);
        return reminders.map(toReminderDTO);
    }
}
