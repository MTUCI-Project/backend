export type SuggestDateBodyDTO = {
    budget?: number;
};

export type DateSuggestionDTO = {
    id: string;
    title: string;
    description: string;
    estimated_cost: number;
    type: string;
};

export type RecommendBodyDTO = {
    type: string;
};

export type RecommendationDTO = {
    id: string;
    title: string;
    description: string;
    price: number;
    partner_url: string | null;
    reason: string;
};

export type RelationshipAnalysisDTO = {
    strengths: string[];
    growth_areas: string[];
    suggested_actions: Array<{
        action: string;
    }>;
};
