import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
import { OpenAI } from "openai";
import { promises as fs } from "fs";
import readline from "readline";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const fileName = "note.txt";

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

//function to create a note and save it to a file
const createNote = async (noteContent = "") => {
  try {
    await fs.writeFile(fileName, noteContent);
    return `Note created and saved to ${fileName}`;
  } catch (error) {
    return `Error writing note to file: ${error.message}`;
  }
};

//function to update/append to an existing note
const updateNote = async (newContent = "") => {
  try {
    // Read existing content
    let existingContent = "";
    try {
      existingContent = await fs.readFile(fileName, "utf8");
    } catch (error) {
      // If file doesn't exist, start with empty content
      if (error.code !== "ENOENT") throw error;
    }

    // Append new content with a newline separator
    const updatedContent = existingContent
      ? `${existingContent}\n${newContent}`
      : newContent;

    await fs.writeFile(fileName, updatedContent);
    return `Note updated successfully. Added: "${newContent}"`;
  } catch (error) {
    return `Error updating note: ${error.message}`;
  }
};

//function to read the note file and return its content
const readNote = async () => {
  try {
    const content = await fs.readFile(fileName, "utf8");
    if (!content || content.trim() === "") {
      return "The note file is empty.";
    }
    return `Here's what's in the note:\n${content}`;
  } catch (error) {
    if (error.code === "ENOENT") {
      return "No note file found. Please create a note first.";
    }
    return `Error reading note: ${error.message}`;
  }
};

//function to delete specific item(s) from the note
const deleteFromNote = async (itemToDelete = "") => {
  try {
    // Read existing content
    const content = await fs.readFile(fileName, "utf8");

    if (!content || content.trim() === "") {
      return "The note is empty. Nothing to delete.";
    }

    // Split content into lines
    const lines = content.split("\n").filter((line) => line.trim() !== "");

    // Filter out lines that contain the item to delete (case-insensitive)
    const itemLower = itemToDelete.toLowerCase();
    const updatedLines = lines.filter(
      (line) => !line.toLowerCase().includes(itemLower)
    );

    // Check if anything was deleted
    if (lines.length === updatedLines.length) {
      return `Item "${itemToDelete}" not found in the note.`;
    }

    // Write back the updated content
    const updatedContent = updatedLines.join("\n");
    await fs.writeFile(fileName, updatedContent);

    const deletedCount = lines.length - updatedLines.length;
    return `Successfully deleted ${deletedCount} item(s) containing "${itemToDelete}" from the note.`;
  } catch (error) {
    if (error.code === "ENOENT") {
      return "No note file found. Nothing to delete.";
    }
    return `Error deleting from note: ${error.message}`;
  }
};

//create a TOOL_MAP object to map tool names to their corresponding functions
const TOOL_MAP = {
  createNote: createNote,
  updateNote: updateNote,
  deleteFromNote: deleteFromNote,
  readNote: readNote,
};

const SYSTEM_PROMPT = `You are a AI assistant who helps users create notes.
You have also list of available tools that you can call based on user query.
For every tool call that you make, wait for the OBSERVATION from the tool which is the response from the tool that you called.

IMPORTANT RESTRICTIONS:
- You are ONLY designed for note-taking tasks (create, read, update, delete notes).
- You CANNOT write code, do calculations, answer general questions, or perform tasks unrelated to note management.
- If a user asks for anything other than note-related tasks, politely decline and remind them of your purpose.
- Always stay focused on helping users manage their notes in the note.txt file.

Available Tools:
createNote(noteContent:string): Creates a note with the given content and saves it to a file.
updateNote(newContent:string): Updates/appends new content to the existing note file.
readNote(): Reads and returns the content of the note file.
deleteFromNote(itemToDelete:string): Deletes any line containing the specified item from the note.

Rules:
- Strictly follow the output JSON format.
- Always follow the output in sequence that is START → TOOL → OBSERVE → OUTPUT.
- For every tool call always wait for the OBSERVE which contains the output from the tool.
- Return only ONE JSON object per response (not multiple lines).
- If the user request is NOT about note-taking, use the OUTPUT step immediately to politely decline.
- if the user is asking to do something outside of note-taking, respond with OUTPUT step to decline the request politely.

Output JSON format:
{"step": "START | TOOL | OBSERVE| OUTPUT", "content": "string", "tool_name": "string", "input": "string"}

Example:
User: write a note for my grocery list and save it in a file here are the items:\nBuy milk\nBuy eggs\nBuy bread.
ASSISTANT: {"step": "START", "content": "The user wants to create a grocery list note and save it in a file."}
ASSISTANT: {"step": "TOOL", "tool_name": "createNote", "input": "- Buy milk\n- Buy eggs\n- Buy bread"}
DEVELOPER: {"step": "OBSERVE", "content": "Note created and saved to note.txt"}
ASSISTANT: {"step": "OUTPUT", "content": "The grocery list note has been created and saved in the file."}
`;

const main = async () => {
  console.log("🤖 Note Taking Assistant ready! Type 'exit' to quit.\n");

  // Conversation history (memory)
  const messages = [
    {
      role: "system",
      content: SYSTEM_PROMPT,
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

    // Skip empty inputs
    if (!userInput) {
      continue;
    }

    // Push user message to memory
    messages.push({ role: "user", content: userInput });

    // Process agent steps
    while (true) {
      const response = await client.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: messages,
      });

      const rawContent = response.choices[0].message.content;

      let parsedContent;
      try {
        parsedContent = JSON.parse(rawContent);
      } catch (err) {
        console.error("❌ Failed to parse JSON from assistant:", rawContent);
        break;
      }

      // Add assistant response to messages
      messages.push({
        role: "assistant",
        content: JSON.stringify(parsedContent),
      });

      // Handle different steps
      if (parsedContent.step === "START") {
        console.log(`🔥 ${parsedContent.content}`);
        continue;
      }

      if (parsedContent.step === "TOOL") {
        const toolToCall = parsedContent.tool_name;

        if (!TOOL_MAP[toolToCall]) {
          messages.push({
            role: "developer",
            content: `There is no such tool as ${toolToCall}`,
          });
          continue;
        }

        // Call the tool function
        const responseFromTool = await TOOL_MAP[toolToCall](
          parsedContent.input
        );
        // console.log(`🛠️  ${toolToCall}() → ${responseFromTool}`);
        console.log(
          `🛠️:${toolToCall}(${parsedContent.input}) = `,
          responseFromTool
        );

        // Push the observation back to messages
        messages.push({
          role: "developer",
          content: JSON.stringify({
            step: "OBSERVE",
            content: responseFromTool,
          }),
        });
        continue;
      }

      if (parsedContent.step === "OUTPUT") {
        console.log(`🤖 Bot: ${parsedContent.content}\n`);
        break;
      }
    }
  }
};

main().catch((err) => {
  console.error("Error in main:", err);
  rl.close();
});
