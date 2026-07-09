// this is for large web url
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

const init = async () => {
  const websiteUrl =
    "https://cookbook.openai.com/examples/gpt4-1_prompting_guide";

  // 1. Load website
  const loader = new CheerioWebBaseLoader(websiteUrl);
  const docs = await loader.load();

  // 2. Split into chunks
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 100,
  });
  const chunks = await textSplitter.splitDocuments(docs);

  // 3. Embeddings
  const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-large",
  });

  // 4. Init empty vector store
  const vectorStore = new QdrantVectorStore(embeddings, {
    url: "http://localhost:6333",
    collectionName: "website2-collection",
  });

  // 5. Insert in batches
  const BATCH_SIZE = 50;
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    await vectorStore.addDocuments(batch);
    console.log(`✅ Indexed batch ${i / BATCH_SIZE + 1}`);
  }

  console.log("🚀 Website data indexed into Qdrant successfully.");
};

init();
