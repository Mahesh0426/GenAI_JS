import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { HNSWLib } from "@langchain/community/vectorstores/hnswlib";

// 1. Load PDF
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

// 3. Embeddings
const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-large",
});

// 4. Store in HNSWLib
const vectorStore = await HNSWLib.fromDocuments(splitDocs, embeddings);
const indexPath = path.resolve(__dirname, "./hnswlib_index");
await vectorStore.save(indexPath);

console.log("Documents stored successfully at:", indexPath);
