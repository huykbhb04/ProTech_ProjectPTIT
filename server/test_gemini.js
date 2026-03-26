require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function runTest() {
    console.log("Starting connectivity test...");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const modelsToTry = ["gemini-1.5-flash", "models/gemini-1.5-flash", "gemini-pro", "gemini-1.5-pro"];

    for (const modelName of modelsToTry) {
        console.log(`Trying model: ${modelName}`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello");
            const response = await result.response;
            console.log(`SUCCESS with ${modelName}:`, response.text());
            return;
        } catch (e) {
            console.log(`Failed with ${modelName}:`, e.message || e);
        }
    }
    console.log("All attempts failed.");
}

runTest();
