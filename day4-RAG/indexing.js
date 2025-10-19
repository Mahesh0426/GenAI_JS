import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";

const init = async () => {
  const pdfFilePath = "./lecture10.pdf";

  //  Load PDF | page by page load the PDF
  const loader = new PDFLoader(pdfFilePath);
  const docs = await loader.load();

  //  Split PDF | chunk by 900 characters
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 900,
    chunkOverlap: 100,
  });
  const chunks = await textSplitter.splitDocuments(docs);

  //   console.log(chunks.length);
  //   console.log(chunks[0].pageContent);

  //  OpenAI Embeddings Model | text to vector
  const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-large",
  });

  // Initialize Qdrant Vector Store
  const vectorStore = await QdrantVectorStore.fromDocuments(
    chunks,
    embeddings,
    {
      url: "http://localhost:6333",
      collectionName: "lecture10-collection",
    }
  );

  console.log("🚀 Indexing of documents done...");
};

init();
