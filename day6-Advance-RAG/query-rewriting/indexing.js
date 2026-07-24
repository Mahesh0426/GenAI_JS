import "dotenv/config";

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Chroma } from "@langchain/community/vectorstores/chroma";

// 1. Load PDF
// Using import.meta.url makes the path relative to THIS file, not the CWD
const pdfFilePath = new URL("../lecture10.pdf", import.meta.url).pathname;

const loader = new PDFLoader(pdfFilePath);
const docs = await loader.load();

console.log(`Loaded ${docs.length} pages.`);

// 2. Split Documents
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

const splitDocs = await splitter.splitDocuments(docs);

console.log(`Created ${splitDocs.length} chunks.`);

// 3. OpenAI Embeddings
const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-large",
});

// 4. Store in ChromaDB
const vectorStore = await Chroma.fromDocuments(splitDocs, embeddings, {
  collectionName: "rag",
  url: "http://localhost:8000",
});

console.log("Documents stored in ChromaDB.");
