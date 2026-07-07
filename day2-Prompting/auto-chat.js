import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
import { OpenAI } from "openai";
import readline from "readline";

const API_KEY = process.env.OPENAI_API_KEY;

const client = new OpenAI({
  apiKey: API_KEY,
});

// Create readline interface for terminal chat
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Helper to ask for user input
const ask = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
};

const main = async () => {
  console.log("🤖 Chatbot ready! Type 'exit' to quit.\n");

  // Conversation history (memory)
  const messages = [
    {
      role: "system",
      content: "You are a helpful AI assistant who solves user queries.",
    },
  ];

  // Chat loop
  while (true) {
    // Get user input
    const userInput = await ask("🧑 You: ");

    if (userInput.toLowerCase() === "exit") {
      console.log("👋 Goodbye!");
      rl.close();
      break;
    }

    // Push user message to memory
    messages.push({ role: "user", content: userInput });

    // Get model response (streaming)
    const stream = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages,
      stream: true,
    });

    // Print streaming response
    let assistantMessage = "";
    process.stdout.write("🤖 Bot: ");
    for await (const part of stream) {
      const delta = part.choices[0]?.delta?.content;
      if (delta) {
        assistantMessage += delta;
        process.stdout.write(delta);
      }
    }
    console.log("\n");

    // Add model reply to memory
    messages.push({ role: "assistant", content: assistantMessage });
  }
};
main();
