import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { HNSWLib } from "@langchain/community/vectorstores/hnswlib";
import OpenAI from "openai";

// 1. Query
const query = "What is Virtual Project Team";

// 2. Embeddings
const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-large",
});

// 3. Load HNSWLib Vector Store created by indexing.js
const indexPath = path.resolve(__dirname, "./hnswlib_index");
const vectorStore = await HNSWLib.load(indexPath, embeddings);

// 4. Retriever
const retriever = vectorStore.asRetriever({ k: 3 });
const relevantChunks = await retriever.invoke(query);

// 5. llm call
const client = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  // baseURL: "https://api.groq.com/openai/v1",
});

const SYSTEM_PROMPT = `
  You are an AI assistant who helps resolving user query based on the context available to you from a PDF file with the content and page number.
  Provide the source of the information you are using to answer the question.
  
  Only answer based on the available context from file only.

 
  User Documents:
    ${relevantChunks.map((e) => JSON.stringify({ bookName: e.metadata.source, pageContent: e.pageContent, pageNumber: e.metadata.loc.pageNumber })).join("\n\n")}

  `;

// 6. generate response by calling llm
const response = await client.invoke([
  {
    role: "system",
    content: SYSTEM_PROMPT,
  },
  {
    role: "user",
    content: query,
  },
]);

console.log(response.content);
