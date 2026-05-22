require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function checkModels() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // We will try gemini-2.0-flash and gemini-1.5-flash
        const m1 = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        try { 
            await m1.generateContent("hello"); 
            console.log("gemini-2.0-flash works!"); 
            return;
        } catch(e) { console.log(e.message); }
        
        const m2 = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        try { 
            await m2.generateContent("hello"); 
            console.log("gemini-1.5-flash works!");
             return;
        } catch(e) { console.log(e.message); }

        const m3 = genAI.getGenerativeModel({ model: "gemini-pro" });
        try { 
            await m3.generateContent("hello"); 
            console.log("gemini-pro works!");
             return;
        } catch(e) { console.log(e.message); }
    } catch (e) {
        console.error(e);
    }
}

checkModels();
