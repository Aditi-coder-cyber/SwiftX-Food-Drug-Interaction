// server/src/services/visionService.ts

/**
 * Analyzes a prescription image and extracts the medication name
 * using Hugging Face Vision (VQA).
 */
export async function analyzePrescription(
    base64Image: string
): Promise<string> {
    const { analyzeImage } = require('./hfService');

    try {
        console.log('📡 Calling Hugging Face Vision (VQA) to analyze prescription...');

        const question =
            "What is the primary medication name written in this prescription? Reply with ONLY the name.";

        const result = await analyzeImage(base64Image, question);
        return result === 'Unknown' ? '' : result;
    } catch (error: any) {
        console.error('❌ Hugging Face Vision error:', error.message);
        throw error;
    }
}
