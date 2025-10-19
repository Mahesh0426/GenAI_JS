import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
import { OpenAI } from "openai";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";

// const client = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });
const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const chat = async () => {
  const userQuery = " what are the advantage of Outsourcing Project Work";

  //  OpenAI Embeddings Model | text to vector
  const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-large",
  });

  // Initialize Qdrant Vector Store
  const vectorStore = await QdrantVectorStore.fromExistingCollection(
    embeddings,
    {
      url: "http://localhost:6333",
      collectionName: "lecture10-collection",
    }
  );

  //perform search on vector store
  const retriever = vectorStore.asRetriever({ k: 3 });
  const relevantChunks = await retriever.invoke(userQuery);

  const SYSTEM_PROMPT = `
  You are an AI assistant who helps resolving user query based on the context available to you from a PDF file with the content and page number.
  Provide the source of the information you are using to answer the question.
  example : [source: lecture10.pdf, page: 1-3]

  Only answer based on the available context from file only.

    Context:
    ${JSON.stringify(relevantChunks)}
  `;
  // const SYSTEM_PROMPT = `
  // You are an AI assistant who helps resolving user query based on the context available to you from a website with metadata.
  // Provide the source of the information you are using to answer the question.

  // Only answer based on the available context from file only.

  //   Context:
  //   ${JSON.stringify(relevantChunks)}
  // `;

  // Create a chat completion
  const response = await client.chat.completions.create({
    model: "deepseek-r1-distill-llama-70b",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userQuery },
    ],
    temperature: 0,
  });

  console.log(`>>`, response.choices[0].message.content);
};

chat();
