import { OpenAI } from "openai";
import "dotenv/config";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // optional if set in process.env.OPENAI_API_KEY
});

async function main() {
  const result = await client.responses.create({
    model: "gpt-4.1-mini",
    input: "What is vectorless RAG in 50 words.",
  });
  console.log(result.output_text);
}

main();
