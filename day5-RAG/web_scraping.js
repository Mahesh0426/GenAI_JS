import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

const init = async () => {
  const websiteUrl =
    "https://geshan.com.np/blog/2023/12/nodejs-duet-ai-vs-code/";

  // 1. Load webpage
  const loader = new CheerioWebBaseLoader(websiteUrl);
  const docs = await loader.load();

  // 2. Split into chunks
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 100,
  });
  const chunks = await textSplitter.splitDocuments(docs);

  // 3. Generate embeddings
  const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-large",
  });

  // 4. Store in Qdrant
  const vectorStore = await QdrantVectorStore.fromDocuments(
    chunks,
    embeddings,
    {
      url: "http://localhost:6333",
      collectionName: "website1-collection",
    }
  );

  console.log("🚀 Website data indexed into Qdrant successfully.");
};

init();
