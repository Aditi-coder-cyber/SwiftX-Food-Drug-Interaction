import mongoose, { Document, Schema } from 'mongoose';

export interface IInteraction extends Document {
    userId: mongoose.Types.ObjectId | null;
    medication: string;
    food: string;
    riskLevel: 'mild' | 'moderate' | 'severe';
    explanation: string;
    clinicalImpact: string;
    example: string;
    recommendations: string[];
    alternatives: string[];
    timing: string;
    confidence: number;
    source: string; // e.g., "rule-based-v1", "ml-model-v2"
    inputType: 'text' | 'voice' | 'image';
    timestamp: Date;
}

const interactionSchema = new Schema<IInteraction>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null, // null for guest checks
        },
        medication: {
            type: String,
            required: [true, 'Medication name is required'],
            trim: true,
        },
        food: {
            type: String,
            required: [true, 'Food name is required'],
            trim: true,
        },
        riskLevel: {
            type: String,
            enum: ['mild', 'moderate', 'severe'],
            required: true,
        },
        explanation: { type: String, required: true },
        clinicalImpact: { type: String, required: true },
        example: { type: String, required: true },
        recommendations: [{ type: String }],
        alternatives: [{ type: String }],
        timing: { type: String, required: true },
        confidence: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
        },
        source: {
            type: String,
            default: 'rule-based-v1',
        },
        inputType: {
            type: String,
            enum: ['text', 'voice', 'image'],
            default: 'text',
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Index for efficient history queries
interactionSchema.index({ userId: 1, timestamp: -1 });

export const Interaction = mongoose.model<IInteraction>(
    'Interaction',
    interactionSchema
);
