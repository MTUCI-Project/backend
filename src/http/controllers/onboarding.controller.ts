import {
    Body,
    Controller,
    Get,
    Post,
    Request,
    Route,
    Security,
    Tags,
} from 'tsoa';
import type { Request as ExpressRequest } from 'express';

import {
    listOnboardingAnswers,
    upsertOnboardingAnswer,
} from '../../domain/companion/companion.service';
import { onboardingAnswerSchema } from '../schemas/companion.schemas';
import {
    toOnboardingAnswerDTO,
    type OnboardingAnswerDTO,
    type UpsertOnboardingAnswerBodyDTO,
} from '../dto/companion.dto';

@Route('onboarding')
@Tags('Onboarding')
export class OnboardingController extends Controller {
    @Post('answers')
    @Security('cookieAuth')
    public async upsertAnswer(
        @Body() body: UpsertOnboardingAnswerBodyDTO,
        @Request() req: ExpressRequest,
    ): Promise<OnboardingAnswerDTO> {
        const data = onboardingAnswerSchema.parse(body) as {
            questionKey: string;
            answer: unknown;
        };
        return toOnboardingAnswerDTO(
            await upsertOnboardingAnswer(req.user!.id, data, 'user'),
        );
    }

    @Get('answers/me')
    @Security('cookieAuth')
    public async listMe(
        @Request() req: ExpressRequest,
    ): Promise<OnboardingAnswerDTO[]> {
        const answers = await listOnboardingAnswers(req.user!.id);
        return answers.map(toOnboardingAnswerDTO);
    }
}
