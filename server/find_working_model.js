require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const https = require('https');

const API_KEY = process.env.GEMINI_API_KEY;

function getModels() {
    return new Promise((resolve, reject) => {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
        https.get(url, (res) => {
            let body = '';
            res.on('data', d => body += d);
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    resolve(json.models || []);
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

async function run() {
    try {
        console.log("Fetching models...");
        const models = await getModels();
        console.log(`Found ${models.length} models.`);

        const generativeModels = models.filter(m => m.supportedGenerationMethods.includes("generateContent"));
        console.log(`${generativeModels.length} support generateContent.`);

        const genAI = new GoogleGenerativeAI(API_KEY);

        for (const m of generativeModels) {
            // Prefer gemini models
            if (!m.name.includes("gemini")) continue;

            console.log(`Testing model: ${m.name}`);
            try {
                // Remove 'models/' prefix if library adds it, or keep it?
                // Library usually handles 'models/' prefix gracefully.
                // Let's try passing the full name from API which includes 'models/'
                const model = genAI.getGenerativeModel({ model: m.name });
                const result = await model.generateContent("Hi");
                const response = await result.response;
                const fs = require('fs');
                fs.writeFileSync('model_result.txt', `WORKING_MODEL=${m.name}\nSHORT_NAME=${m.name.replace('models/', '')}`);
                console.log(`SUCCESS! Working model: ${m.name}`);
                return; // Stop after first success
            } catch (e) {
                console.log(`Failed: ${e.message}`);
            }
        }
    } catch (e) {
        console.error(e);
    }
}
run();
