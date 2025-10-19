// open AI SDK
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
import { OpenAI } from "openai";

const API_KEY = process.env.OPENAI_API_KEY;

const client = new OpenAI({
  apiKey: API_KEY,
});

const main = async () => {
  //these api calls are statelesss
  const response = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      { role: "user", content: "Hey gpt, my name is Mahesh." },
      { role: "user", content: "Hi Mahesh! How can I assist you today?" },
      { role: "user", content: "what is my name ?" },
      {
        role: "user",
        content: "Your name is Mahesh. How can I help you further?",
      },
      {
        role: "user",
        content:
          "give me a roadmap to learn generative Ai with javascript with langchain ?",
      },
    ],
    stream: true,
    max_tokens: 90,
  });
  //   console.log(response.choices[0].message.content);

  // ← streaming output
  for await (const part of response) {
    const delta = part.choices[0]?.delta?.content;
    if (delta) process.stdout.write(delta);
  }
};

main();
