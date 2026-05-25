export type ChatSenderDTO = 'user' | 'assistant';
export type ChatDeliveryStatusDTO = 'pending' | 'sent' | 'failed';

export type CreateChatMessageBodyDTO = {
    message: string;
};

export type ChatMessageDTO = {
    id: string;
    sender: ChatSenderDTO;
    message: string;
    timestamp: string;
    deliveryStatus: ChatDeliveryStatusDTO;
};

export function toChatMessageDTO(message: any): ChatMessageDTO {
    return {
        id: message.id,
        sender: message.sender,
        message: message.message,
        timestamp: new Date(message.timestamp).toISOString(),
        deliveryStatus: message.deliveryStatus,
    };
}
