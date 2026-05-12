import { GoogleGenAI } from '@google/genai';
import { IRiskProfile } from '../models/User';
import { findKnownInteraction } from './knowledgeBase';

export interface AnalysisResult {
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
    source: string;
}

/**
 * Analyze food-drug interaction using Google Gemini AI.
 * Falls back to comprehensive knowledge base if Gemini is unavailable.
 */
export async function analyzeInteraction(
    medication: string,
    food: string,
    riskProfile: IRiskProfile | null
): Promise<AnalysisResult> {
    // Try Hugging Face AI first
    const hfToken = process.env.HF_TOKEN;
    if (hfToken) {
        try {
            const result = await analyzeWithHF(medication, food, riskProfile);
            return result;
        } catch (error) {
            console.warn('⚠️ Hugging Face AI failed, falling back to knowledge base:', (error as Error).message);
        }
    }

    // Fallback to knowledge base
    return analyzeWithKnowledgeBase(medication, food, riskProfile);
}

/**
 * Hugging Face AI-powered analysis
 */
async function analyzeWithHF(
    medication: string,
    food: string,
    riskProfile: IRiskProfile | null
): Promise<AnalysisResult> {
    const { generateResponse } = require('./hfService');

    const profileContext = riskProfile
        ? `\nPatient Profile:\n- Age group: ${riskProfile.age}\n- Medical conditions: ${riskProfile.conditions.length > 0 ? riskProfile.conditions.join(', ') : 'None reported'}\n- Known allergies: ${riskProfile.allergies.length > 0 ? riskProfile.allergies.join(', ') : 'None reported'}`
        : '\nNo patient profile available — provide general population analysis.';

    const prompt = `You are a clinical pharmacologist AI assistant. Analyze the potential interaction between a medication and a food item.

MEDICATION: ${medication}
FOOD: ${food}
${profileContext}

Provide a detailed, evidence-based analysis. You MUST respond with ONLY a valid JSON object (no markdown, no code blocks, no extra text) with exactly these fields:

{
  "riskLevel": "mild" | "moderate" | "severe",
  "explanation": "Clear explanation of the interaction mechanism in plain language.",
  "clinicalImpact": "Specific clinical consequences.",
  "example": "A relatable real-world analogy.",
  "recommendations": ["3 specific recommendations"],
  "alternatives": ["2 safe food alternatives"],
  "timing": "Specific timing advice",
  "confidence": A number 70-99
}

IMPORTANT: Return ONLY the JSON. No preamble.`;

    const responseText = await generateResponse([
        { role: "system", content: "You are a clinical pharmacologist. Always respond with JSON." },
        { role: "user", content: prompt }
    ]);

    // Parse the JSON response
    let jsonText = responseText;
    if (jsonText.includes('{')) {
        jsonText = jsonText.substring(jsonText.indexOf('{'), jsonText.lastIndexOf('}') + 1);
    }

    const parsed = JSON.parse(jsonText);

    return {
        medication,
        food,
        riskLevel: parsed.riskLevel || 'moderate',
        explanation: parsed.explanation || 'See details.',
        clinicalImpact: parsed.clinicalImpact || 'Consult healthcare provider.',
        example: parsed.example || '',
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        alternatives: Array.isArray(parsed.alternatives) ? parsed.alternatives : [],
        timing: parsed.timing || 'Standard spacing recommended.',
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 85,
        source: 'huggingface-ai-v1',
    };
}

/**
 * Knowledge base fallback analysis
 */
function analyzeWithKnowledgeBase(
    medication: string,
    food: string,
    riskProfile: IRiskProfile | null
): AnalysisResult {
    const known = findKnownInteraction(medication, food);

    if (known) {
        let riskLevel = known.riskLevel;

        // Adjust for elderly patients
        if (riskProfile?.age === '65+' && riskLevel === 'moderate') {
            riskLevel = 'severe';
        }

        // Higher confidence for known interactions
        let confidence = known.evidenceLevel === 'high' ? 95 : known.evidenceLevel === 'moderate' ? 85 : 75;
        if (riskProfile && riskProfile.conditions.length > 2) {
            confidence = Math.min(99, confidence + 3);
        }

        return {
            medication,
            food,
            riskLevel,
            explanation: known.mechanism,
            clinicalImpact: known.clinicalImpact,
            example: `This is a clinically documented interaction between ${known.drugClass} medications and ${food}.`,
            recommendations: known.recommendations,
            alternatives: known.alternatives,
            timing: known.timing,
            confidence,
            source: 'knowledge-base-v1',
        };
    }

    // No known interaction — return safe assessment
    let baseMildConfidence = 75;
    if (riskProfile && riskProfile.conditions.length > 0) {
        baseMildConfidence = 70;
    }

    return {
        medication,
        food,
        riskLevel: 'mild',
        explanation: `No significant interaction has been documented between ${medication} and ${food} in our clinical database. This combination is generally considered safe for most patients.`,
        clinicalImpact: 'No clinically significant impact expected. Standard medication efficacy should be maintained.',
        example: 'This is similar to taking most medications with common foods — no special precautions are typically needed.',
        recommendations: [
            'Continue your normal medication schedule',
            'Take medication as prescribed by your doctor',
            'Monitor for any unusual symptoms and report to healthcare provider',
            'Stay hydrated and maintain a balanced diet',
        ],
        alternatives: [
            'No dietary restrictions needed for this combination',
            'Continue enjoying this food as part of a balanced diet',
        ],
        timing: 'No specific timing restrictions required',
        confidence: baseMildConfidence,
        source: 'knowledge-base-v1',
    };
}
