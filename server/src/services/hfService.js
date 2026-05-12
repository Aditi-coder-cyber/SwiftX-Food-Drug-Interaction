const { InferenceClient } = require("@huggingface/inference");

/**
 * Hugging Face Inference Service
 * Drop-in replacement for Gemini service
 */
const client = new InferenceClient(process.env.HF_TOKEN);
const MODEL = "meta-llama/Llama-3.1-8B-Instruct";

/**
 * Generates a response using Hugging Face Inference API (Text Generation)
 * @param {Array<{role: string, content: string}>} messages - Array of chat messages
 * @returns {Promise<string>} - Assistant's response text
 */
async function generateResponse(messages) {
    try {
        const prompt = messages
            .map(m => `${m.role.toUpperCase()}: ${m.content}`)
            .join("\n") + "\nASSISTANT:";

        console.log("🔥 HF request prompt:", prompt);

        const response = await client.chatCompletion({
            model: MODEL,
            messages: [{ role: "user", content: prompt }],
            max_tokens: 300,
            temperature: 0.3,
        });

        const text = response.choices[0].message.content.trim();

        if (!text) {
            throw new Error('Empty response from Hugging Face');
        }

        console.log(`✅ Hugging Face replied, length: ${text.length}`);
        return text;

    } catch (error) {
        console.error("❌ HF ERROR:", error.message || error);
        throw new Error("AI service unavailable");
    }
}

/**
 * Helper for backward compatibility
 */
async function askHF(prompt) {
    return generateResponse([{ role: "user", content: prompt }]);
}

/**
 * Analyzes an image (preserved for vision functionality)
 */
async function analyzeImage(base64Image, prompt) {
    try {
        const data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
        const imageBuffer = Buffer.from(data, 'base64');

        console.log(`📡 Calling Hugging Face (Visual Question Answering)...`);

        const response = await client.visualQuestionAnswering({
            model: "dandelin/vilt-b32-finetuned-vqa",
            inputs: {
                image: imageBuffer,
                question: prompt
            }
        });

        const text = response[0].answer;
        console.log(`✅ Hugging Face Vision replied: ${text}`);
        return text;

    } catch (error) {
        console.error('❌ Hugging Face Vision Error:', error.message);
        throw error;
    }
}

module.exports = {
    generateResponse,
    askHF,
    analyzeImage
};
