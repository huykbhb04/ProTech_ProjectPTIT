require('dotenv').config();
const https = require('https');

const API_KEY = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

console.log(`Listing Models from: ${url.replace(API_KEY, 'HIDDEN')}`);

const req = https.get(url, (res) => {
    let body = '';
    res.on('data', (d) => body += d);
    res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        try {
            const json = JSON.parse(body);
            if (json.models) {
                console.log("Available Models:");
                json.models.forEach(m => console.log(` - ${m.name} (${m.supportedGenerationMethods})`));
            } else {
                console.log("Response:", body);
            }
        } catch (e) {
            console.log("Raw Body:", body);
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});
