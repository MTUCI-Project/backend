import { Body, Controller, Post, Request, Route, Security, Tags } from 'tsoa';
import type { Request as ExpressRequest } from 'express';

import {
    analyzeRelationship,
    recommend,
    suggestDate,
} from '../../domain/assistant/assistant.service';
import type {
    DateSuggestionDTO,
    RecommendBodyDTO,
    RecommendationDTO,
    RelationshipAnalysisDTO,
    SuggestDateBodyDTO,
} from '../dto/assistant.dto';
import { recommendSchema, suggestDateSchema } from '../schemas/assistant.schemas';

@Route('assistant')
@Tags('Assistant')
@Security('cookieAuth')
export class AssistantController extends Controller {
    @Post('suggest-date')
    public async suggestDate(
        @Request() req: ExpressRequest,
        @Body() body: SuggestDateBodyDTO,
    ): Promise<DateSuggestionDTO> {
        const data = suggestDateSchema.parse(body);
        return suggestDate(req.user!.id, data.budget);
    }

    @Post('recommend')
    public async recommend(
        @Request() req: ExpressRequest,
        @Body() body: RecommendBodyDTO,
    ): Promise<RecommendationDTO> {
        const data = recommendSchema.parse(body);
        return recommend(req.user!.id, data.type);
    }

    @Post('analyze-relationship')
    public async analyzeRelationship(
        @Request() req: ExpressRequest,
    ): Promise<RelationshipAnalysisDTO> {
        return analyzeRelationship(req.user!.id);
    }
}
