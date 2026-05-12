import Chat from '../models/Chat';
import { CHAT_PROMPT } from '../utils/promptTemplates';
import { askHF } from './hfService';


const FALLBACK_MESSAGE =
    "I'm unable to answer right now. Please consult a healthcare professional for guidance.";

const FALLBACK_MESSAGE_HI =
    "मैं अभी जवाब देने में असमर्थ हूँ। कृपया किसी स्वास्थ्य पेशेवर से मार्गदर्शन लें।";

/**
 * Handle a chat message:
 * load context → build prompt → call Hugging Face → persist → return reply
 */
export async function handleChat(
    sessionId: string,
    message: string,
    language: 'en' | 'hi' = 'en'
): Promise<string> {
    try {
        // Load last 5 messages for conversational context
        const previousChats = await Chat.find({ sessionId })
            .sort({ createdAt: 1 })
            .limit(5);

        const context = previousChats
            .map((c: any) => `User: ${c.userMessage}\nAI: ${c.aiReply}`)
            .join('\n');

        // Build prompt
        const prompt = CHAT_PROMPT(context, message, language);

        // 🔥 CALL HUGGING FACE ONLY
        const aiReply = await askHF(prompt);


        // Persist conversation
        await Chat.create({
            sessionId,
            userMessage: message,
            aiReply,
            source: 'huggingface-llm',
            confidence: 'medium',
        });

        return aiReply;
    } catch (error: any) {
        console.error('❌ Chat service error:', error?.message || error);

        // Friendly fallback (no provider-specific messages)
        return language === 'hi'
            ? "क्षमा करें, वेद अभी जवाब देने में असमर्थ है। कृपया कुछ समय बाद पुनः प्रयास करें।"
            : "I'm sorry, Ved is temporarily unavailable. Please try again in a moment.";
    }
}
