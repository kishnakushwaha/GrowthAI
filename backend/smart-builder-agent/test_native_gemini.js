import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

async function run() {
  try {
    const result = await model.generateContent("Hello, who are you?");
    console.log(result.response.text());
  } catch (e) {
    console.error("Error:", e);
  }
}
run();
