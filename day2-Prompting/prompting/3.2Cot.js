// COT (Chain of Thought) implementation using OpenAI API

import "dotenv/config";
import { OpenAI } from "openai";

const API_KEY = process.env.OPENAI_API_KEY;

// Creates an OpenAI client instance authenticated with the API key.
const openai = new OpenAI({
  apiKey: API_KEY,
});

// Defines and runs the main async function that drives the CoT conversation loop.
const main = async () => {
  // Defines the system prompt that instructs the AI to reason step-by-step using START → THINK → ANALYZE → OUTPUT stages.
  const SYSTEM_PROMPT = `
    You are a  AI assistant who works on START, THINK,ANALYZE and OUTPUT format.
     For a given user query first think and brealdown the probem into sub probelms.
     You should always keep thinking and thinking before giving the actual output.
     Also,before outputing the final result to user you must check once if everyting is correct.
     
     Rules:
     - Strictly follow the output JSON format.
     - Always follow the output in sequence that is START,THINK,ANALYZE,OUTPUT.
     - Always perform only one step at a time. and wait for other step.
     - Always make sure to do multiple step of thinking  before  giving output.


     Output JSON format:
     {"step": "START" | "THINK" |"ANALYZE" | "OUTPUT"", "content": "string"}

     Example:
     User: can you solve 3 + 4 * 10 - 4 * 3 ?
     ASSISTANT: {"step": "START", "content": "The user wants me to solve 3 + 4 * 10 - 4 * 3 math problem"}
     ASSISTANT: {"step": "THINK", "content": "This is typical math problems where we use BODMAS formula for calculation"}
     ASSISTANT: {"step": "THINK", "content": "Lets break down the problem  step by step"}
     ASSISTANT: {"step": "ANALYZE", "content": "As per BODMAS, first lets solve all multiplications and divisions"}
     ASSISTANT: {"step": "THINK", "content": "So, first we need to solve 4 * 10 that is 40"}
     ASSISTANT: {"step": "THINK", "content": "Great, now equation looks like 3 + 40 - 4 * 3"}
     ASSISTANT: {"step": "ANALYZE", "content": "Now, I can see one more multiplication to be done, so that is 4 * 3 = 12"}
     ASSISTANT: {"step": "THINK", "content": "As we have done all multiplications lets add 3 + 40 - 12"}
     ASSISTANT: {"step": "THINK", "content": "so, 3 + 40  = 43"}
     ASSISTANT: {"step": "THINK", "content": "new equations look like 43 - 12 which is 31"}
     ASSISTANT: {"step": "ANALYZE", "content": "Great, all steps are done and now final answer is 31"}
     ASSISTANT: {"step": "OUTPUT", "content": "3 + 4 * 10 - 4 * 3 = 31"}

    `;

  // Initializes the conversation history with the system prompt and the first user question.
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: "how can we learn gen AI in js ?" },
  ];

  while (true) {
    // Sends the current message history to GPT-4o and awaits the model's next reasoning step.
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
    });

    // Extracts the raw text from the model's response.
    const rawContent = response.choices[0].message.content;
    // Parses the raw JSON string into a structured object with `step` and `content` fields.
    const parsedContent = JSON.parse(rawContent);
    messages.push({
      role: "assistant",
      content: JSON.stringify(parsedContent),
    });

    // Logs the START step (problem acknowledgment) and continues to the next reasoning iteration.
    if (parsedContent.step === "START") {
      console.log(`🔥(${parsedContent.step})`, parsedContent.content);
      continue;
    }
    // Logs a THINK step (intermediate reasoning) and continues to the next iteration.
    if (parsedContent.step === "THINK") {
      console.log(`🧠(${parsedContent.step})`, parsedContent.content);
      continue;
    }
    // Logs an ANALYZE step (deeper evaluation of sub-problems) and continues to the next iteration.
    if (parsedContent.step === "ANALYZE") {
      console.log(`🧐(${parsedContent.step})`, parsedContent.content);
      continue;
    }
    // Logs the final OUTPUT (the answer) and breaks out of the loop to end the conversation.
    if (parsedContent.step === "OUTPUT") {
      console.log(`🤖(${parsedContent.step})`, parsedContent.content);
      break;
    }
  }
  console.log("Done...");
};
main();
