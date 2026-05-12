import { Request, Response } from 'express';
import { handleChat } from '../services/chatService';

export const chat = async (req: Request, res: Response): Promise<void> => {
    try {
        const { sessionId, message, language = 'en' } = req.body;

        if (!sessionId || !message) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_FIELDS',
                    message: 'sessionId and message are required.',
                },
            });
            return;
        }

        const reply = await handleChat(sessionId, message, language);

        res.json({
            success: true,
            data: { reply },
        });
    } catch (error) {
        console.error('❌ Chat controller error:', (error as Error).message);
        res.status(500).json({
            success: false,
            error: {
                code: 'CHAT_ERROR',
                message: 'Failed to process chat message.',
            },
        });
    }
};
