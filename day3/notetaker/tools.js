import { promises as fs } from "fs";
const fileName = "note.txt";

export async function createNote(args = {}) {
  const { content = "" } = args;
  if (!content) {
    console.log("⚠️ No content provided to createNote");
    return;
  }
  await fs.appendFile(fileName, `${content}\n`);
  console.log("✅ Note added:", content);
}

export async function readNotes() {
  try {
    const data = await fs.readFile(fileName, "utf-8");
    console.log("📖 Notes:\n" + data);
    return data;
  } catch (err) {
    console.log("⚠️ No notes found yet.");
    return "";
  }
}

export async function updateNote(args = {}) {
  const { lineNumber, newContent } = args;
  if (!lineNumber || !newContent) {
    console.log("⚠️ updateNote requires lineNumber and newContent");
    return;
  }

  const data = await fs.readFile(fileName, "utf-8");
  const lines = data.split("\n");
  if (lineNumber > lines.length) {
    console.log("⚠️ Invalid line number");
    return;
  }
  lines[lineNumber - 1] = newContent;
  await fs.writeFile(fileName, lines.join("\n"));
  console.log(`✏️ Updated line ${lineNumber}`);
}

export async function deleteNote(args = {}) {
  const { lineNumber } = args;
  if (!lineNumber) {
    console.log("⚠️ deleteNote requires lineNumber");
    return;
  }

  const data = await fs.readFile(fileName, "utf-8");
  const lines = data.split("\n");
  if (lineNumber > lines.length) {
    console.log("⚠️ Invalid line number");
    return;
  }
  lines.splice(lineNumber - 1, 1);
  await fs.writeFile(fileName, lines.join("\n"));
  console.log(`🗑️ Deleted line ${lineNumber}`);
}

export const tool_map = { createNote, readNotes, updateNote, deleteNote };
