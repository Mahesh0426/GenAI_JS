import "dotenv/config";

import { OpenAIEmbeddings } from "@langchain/openai";
import { Chroma } from "@langchain/community/vectorstores/chroma";

// Embeddings
const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-large",
});

// Existing Chroma Collection
const vectorStore = new Chroma(embeddings, {
  collectionName: "rag",
  url: "http://localhost:8000",
});

// Retriever
const retriever = vectorStore.asRetriever(3);

// Query
const query = "Explain the Group Report assignment in BUS709";

const docs = await retriever.invoke(query);

// Print Results
docs.forEach((doc, index) => {
  console.log(`Result ${index + 1}`);
  console.log("Page:", doc.metadata.page + 1);
  console.log(doc.pageContent);
  console.log("----------------------");
});
