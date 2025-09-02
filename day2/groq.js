// gemini openai compatibility

import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const main = async () => {
  const response = await openai.chat.completions.create({
    model: "deepseek-r1-distill-llama-70b",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "does groq have their own model  ?" },
    ],
  });
  console.log(response.choices[0].message);
};
main();
