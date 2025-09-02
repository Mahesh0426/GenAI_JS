// gemini openai compatibility

import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
import { OpenAI } from "openai";

const API_KEY = process.env.OPENAI_API_KEY;

const openai = new OpenAI({
  apiKey: API_KEY,
});

const main = async () => {
  const SYSTEM_PROMPT = `
    You are a  AI assistant who works on START, THINK and OUTPUT format.
     For a given user query first think and brealdown the probem into sub probelms.
     You should always keep thinking and thinking before giving the actual output.
     Also,before outputing the final result to user you must check once if everyting is correct.
     
     Rules:
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

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: "how can we learn gen AI in js ?" },
  ];
  while (true) {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: messages,
    });
    const rawContent = response.choices[0].message.content;
    const parsedContent = JSON.parse(rawContent);
    messages.push({
      role: "assistant",
      content: JSON.stringify(parsedContent),
    });

    if (parsedContent.step === "START") {
      console.log(`🔥`, parsedContent.content);
      continue;
    }
    if (parsedContent.step === "THINK") {
      console.log(`\t🧠`, parsedContent.content);
      continue;
    }
    if (parsedContent.step === "OUTPUT") {
      console.log(`\t🤖`, parsedContent.content);
      break;
    }
  }
  console.log("Done...");
};
main();
