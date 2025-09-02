import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
import { OpenAI } from "openai";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";

// const llm = new ChatOpenAI({
//   model: "gpt-4.1-mini",
//   temperature: 0,
//   maxTokens: undefined,
//   apiKey: process.env.OPENAI_API_KEY,
// });
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const chat = async () => {
  const userQuery = " Explain characteristics and components of DDBMSs  ?";

  //  OpenAI Embeddings Model | text to vector
  const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-large",
  });

  // Initialize Qdrant Vector Store
  const vectorStore = await QdrantVectorStore.fromExistingCollection(
    embeddings,
    {
      url: "http://localhost:6333",
      collectionName: "chaicode-collection",
    }
  );

  //perform search on vector store
  const retriever = vectorStore.asRetriever({ k: 3 });
  const relevantChunks = await retriever.invoke(userQuery);

  const SYSTEM_PROMPT = `
  You are an AI Assistant who helps resolving user query based on the context available to you from a PDF file with the content and page number.
  
  Only answer based on the available comtext from file only. 
  If user query is not related to the context, say , I am sorry, I don't know.
  

    Context:
    ${JSON.stringify(relevantChunks)}
  `;
  const response = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userQuery },
    ],
    temperature: 0,
  });

  console.log(`>>`, response.choices[0].message.content);
};

chat();
