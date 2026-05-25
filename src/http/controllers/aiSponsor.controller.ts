import { Controller, Get, Route, Tags } from 'tsoa';
import type { AiSponsorContextDTO } from '../dto/aiService.dto';

@Route('ai-service')
@Tags('AI Service')
export class AiSponsorController extends Controller {
    @Get('sponsor-context')
    public async getSponsorContext(): Promise<AiSponsorContextDTO> {
        return {
            message: 'Sponsor context mock',
            available_partners: ['ozon', 'wb', 'yandex'],
        };
    }
}
