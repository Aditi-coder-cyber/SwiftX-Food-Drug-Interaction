import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema(
    {
        sessionId: { type: String, required: true, index: true },
        userMessage: { type: String, required: true },
        aiReply: { type: String, required: true },
        source: { type: String, default: 'gemini-ai-v1' },
        confidence: { type: String, default: 'medium' },
    },
    { timestamps: true }
);

export default mongoose.model('Chat', chatSchema);
