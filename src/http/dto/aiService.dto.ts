export type AiFactBodyDTO = {
    key: string;
    value: unknown;
};

export type AiStatusDTO = {
    status: string;
};

export type AiFactResponseDTO = AiStatusDTO & AiFactBodyDTO;

export type AiDeletedFactResponseDTO = AiStatusDTO & {
    key: string;
};

export type AiChatMessageBodyDTO = {
    message: string;
    sentiment?: number;
};

export type AiChatMessageDTO = {
    id: string;
    message: string;
    sentiment: number;
    timestamp: string;
};

export type AiChatResponseDTO = {
    status: string;
    message: string;
};

export type AiEventBodyDTO = {
    title: string;
    description?: string | null;
    date: string;
    status?: string;
};

export type AiEventUpdateBodyDTO = Partial<AiEventBodyDTO>;

export type AiEventDTO = {
    id: string;
    title: string;
    description?: string | null;
    date: string;
    status: string;
};

export type AiTodoBodyDTO = {
    text: string;
    due?: string | null;
};

export type AiTodoUpdateBodyDTO = Partial<AiTodoBodyDTO> & {
    completed?: boolean;
};

export type AiTodoDTO = {
    id: string;
    text: string;
    due?: string | null;
    completed: boolean;
};

export type AiReminderUpdateBodyDTO = {
    text?: string | null;
    remind_at?: string | null;
    is_active?: boolean;
};

export type AiReminderDTO = {
    id: string;
    text?: string | null;
    remind_at?: string | null;
    is_active: boolean;
};

export type AiSponsorSuggestionBodyDTO = {
    title: string;
    description: string;
    price?: number | null;
    partner_url?: string | null;
};

export type AiSponsorSuggestionDTO = AiSponsorSuggestionBodyDTO & {
    id: string;
    status: string;
    created_at: string;
    [key: string]: unknown;
};

export type AiUserContextDTO = {
    user_id: string;
    profile: Record<string, unknown>;
    facts: Record<string, unknown>;
    events: AiEventDTO[];
    todos: AiTodoDTO[];
    reminders: AiReminderDTO[];
    weather: string;
    current_time: string;
};

export type AiSponsorContextDTO = {
    message: string;
    available_partners: string[];
};
