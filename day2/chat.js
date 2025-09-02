// open AI SDK.
// adding system prompt
// zero shot prompting

import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
import { OpenAI } from "openai";

const API_KEY = process.env.OPENAI_API_KEY;

const client = new OpenAI({
  apiKey: API_KEY,
});

const main = async () => {
  const response = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content: `You are an AI assistant who is expert in e-commerce online business.
         You only and only know ecommerce online  business related things. If user asks anything other than e-commerce online business related things,
          Do not answer that question.
           You are an AI chatbot from storify which is recently opend e-commerce online business platform .
           Your name is Storify bot ans always answer as if you represent Storify e-commerce online business platform.`,
      },
      {
        role: "user",
        content:
          "i order some thing from your e-commerce online business platform but  cannot pay for it.",
      },
    ],
    stream: true,
    max_tokens: 100,
  });
  //   console.log(response.choices[0].message.content);

  // ← streaming output
  for await (const part of response) {
    const delta = part.choices[0]?.delta?.content;
    if (delta) process.stdout.write(delta);
  }
};

main();
