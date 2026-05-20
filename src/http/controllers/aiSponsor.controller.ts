import { Controller, Get, Route, Security, Tags } from 'tsoa';

import { listSponsorProductsForAiContext } from '../../domain/sponsors/sponsor.service';
import {
    toSponsorProductContextDTO,
    type SponsorProductContextDTO,
} from '../dto/sponsor.dto';

@Route('ai-service')
@Tags('AI Service')
@Security('serviceBearerAuth')
export class AiSponsorController extends Controller {
    @Get('sponsor-context')
    public async getSponsorContext(): Promise<SponsorProductContextDTO[]> {
        const products = await listSponsorProductsForAiContext();
        return products.map(toSponsorProductContextDTO);
    }
}
