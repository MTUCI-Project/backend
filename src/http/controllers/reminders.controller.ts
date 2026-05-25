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
    listReminders,
} from '../../domain/aiService/aiService.service';
import type { AiReminderDTO } from '../dto/aiService.dto';

@Route('reminders')
@Tags('Reminders')
export class RemindersController extends Controller {
    @Get()
    @Security('cookieAuth')
    public async list(
        @Request() req: ExpressRequest,
    ): Promise<AiReminderDTO[]> {
        const reminders = await listReminders(req.user!.id);
        return reminders.map((reminder) => ({
            id: reminder.id,
            text: reminder.text,
            remind_at: reminder.remindAt,
            is_active: reminder.isActive,
        }));
    }
}
