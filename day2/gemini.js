// gemini openai compatibility

import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

const main = async () => {
  const response = await openai.chat.completions.create({
    model: "gemini-1.5-flash",
    messages: [
      { role: "system", content: "You are a helpful AI  assistant." },
      { role: "user", content: "how are you ?" },
    ],
  });
  console.log(response.choices[0].message);
};
main();
