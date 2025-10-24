import OpenAI from "openai";
import dotenv from "dotenv";
import { tool_map } from "./tools.js";

dotenv.config({ path: "../../.env" });

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function aiAgent(userInput) {
  const response = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content: `
You are a note-taking AI assistant.
You can perform these actions using tools:
- createNote({ content })
- readNotes()
- updateNote({ lineNumber, newContent })
- deleteNote({ lineNumber })

Always respond in **strict JSON** format like one of these examples:

{"tool": "createNote", "args": {"content": "Buy milk"}}
{"tool": "readNotes", "args": {}}
{"tool": "updateNote", "args": {"lineNumber": 2, "newContent": "Buy oat milk"}}
{"tool": "deleteNote", "args": {"lineNumber": 1}}

Never return text outside JSON.
        `,
      },
      { role: "user", content: userInput },
    ],
    temperature: 0,
  });

  const message = response.choices[0].message.content;

  let parsed;
  try {
    parsed = JSON.parse(message);
  } catch (err) {
    console.error("❌ Failed to parse assistant JSON:", message);
    return;
  }

  const { tool, args = {} } = parsed;

  if (tool_map[tool]) {
    const result = await tool_map[tool](args);
    console.log("✅ Tool executed successfully.");
    return result;
  } else {
    console.log("🤖 Unknown tool name:", tool);
  }
}
