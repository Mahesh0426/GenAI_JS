// evaluate-gpt-with-gemini.js

import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
import { OpenAI } from "openai";

// initialize clients
const gpt = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const gemini = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
});

//system prompt
const SYSTEM_PROMPT = `
You are an AI assistant who works in the cycle: START → THINK → EVALUATE → … → OUTPUT.


 Rules:
     - Every time you produce a "THINK" step, you will receive an external "EVALUATE" reply from another model.  
     - Always emit valid JSON: {"step":"START|THINK|OUTPUT","content":"..."}
     - Strictly follow the output JSON format.
     - Always follow the output in sequence that is START,THINK,OUTPUT.
     - Always perform only one step at a time. and wait for other step.
     - Always make sure to do multiple step of thinking  before  giving output.


     Output JSON format:
     {"step": "START | THINK | OUTPUT", "content": "string"}

     Example:
     User: can you solve 3 + 4 * 10 - 4 * 3 ?
     ASSISTANT: {"step": "START", "content": "The user wants me to solve 3 + 4 * 10 - 4 * 3 math problem"}
     ASSISTANT: {"step": "THINK", "content": "This is typical math problems where we use BODMAS formula for calculation"}
     ASSISTANT: {"step": "THINK", "content": "Lets break down the problem  step by step"}
     ASSISTANT: {"step": "THINK", "content": "As per BODMAS, first lets solve all multiplications and divisions"}
     ASSISTANT: {"step": "THINK", "content": "So, first we need to solve 4 * 10 that is 40"}
     ASSISTANT: {"step": "THINK", "content": "Great, now equation looks like 3 + 40 - 4 * 3"}
     ASSISTANT: {"step": "THINK", "content": "Now, I can see one more multiplication to be done, so that is 4 * 3 = 12"}
     ASSISTANT: {"step": "THINK", "content": "As we have done all multiplications lets add 3 + 40 - 12"}
     ASSISTANT: {"step": "THINK", "content": "so, 3 + 40  = 43"}
     ASSISTANT: {"step": "THINK", "content": "new equations look like 43 - 12 which is 31"}
     ASSISTANT: {"step": "THINK", "content": "Great, all steps are done and now final answer is 31"}
     ASSISTANT: {"step": "OUTPUT", "content": "3 + 4 * 10 - 4 * 3 = 31"}
`;

// helpers
const askGPT = (msgs) =>
  gpt.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: msgs,
    temperature: 0.2,
  });

const askGemini = async (msgs) => {
  const promptForGemini = `
Below is a conversation between a user and an assistant that is solving a problem step-by-step.
The last assistant message is a "THINK" step.  
Please evaluate it.  
Return ONLY valid JSON like: {"step":"EVALUATE","content":"<your short feedback>"}

Conversation:
${msgs.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n")}
`;

  const res = await gemini.chat.completions.create({
    model: "gemini-2.0-flash",
    messages: [{ role: "user", content: promptForGemini }],
    temperature: 0,
  });

  // Gemini sometimes wraps JSON in ```json … ``` – strip if needed
  let raw = res.choices[0].message.content.trim();
  if (raw.startsWith("```")) raw = raw.replace(/```(?:json)?\n?/g, "");
  return JSON.parse(raw);
};

// main loop
const main = async () => {
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: "can you solve 3 + 4 * 10 - 4 * 3 ?" },
  ];

  while (true) {
    const gptRes = await askGPT(messages);
    const raw = gptRes.choices[0].message.content.trim();
    const parsed = JSON.parse(raw);

    // push GPT’s reply into history
    messages.push({ role: "assistant", content: raw });

    switch (parsed.step) {
      case "START":
        console.log("🔥", parsed.content);
        break;

      case "THINK":
        console.log("🧠", parsed.content);

        // 1. ask Gemini for evaluation
        const evalReply = await askGemini(messages);
        console.log("✅ GEMINI:", evalReply.content);

        // 2. push the evaluation into history so GPT sees it next turn
        messages.push({
          role: "user",
          content: JSON.stringify(evalReply),
        });
        break;

      case "OUTPUT":
        console.log("🤖", parsed.content);
        return;
    }
  }
};

main().catch(console.error);
