import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { HNSWLib } from "@langchain/community/vectorstores/hnswlib";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

//env setup
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

//llm setup
const llm = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0 });

//vector store setup
const embeddings = new OpenAIEmbeddings({ model: "text-embedding-3-small" });
const indexPath = path.resolve(__dirname, "./hnswlib_index");
const vectorStore = await HNSWLib.load(indexPath, embeddings);
const retriever = vectorStore.asRetriever({ k: 3 });

// The raw user query
const originalQuery = "Managing Conflict within the Project Team";

console.log("=".repeat(70));
console.log("  QUERY TRANSLATION DEMO");
console.log("=".repeat(70));

// ChatPromptTemplate for query rewriting
const queryRewritePrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are an expert at query re-writing from the given user vague query for a vector database search.
Re-write the user's query into more detailed, specific and more relevant.
Return ONLY the rewritten query .
DO NOT generate answer, no explanation, no quotes.`,
  ],
  ["human", "{query}"],
]);

// Build the LCEL chain using .pipe() prompt → llm → parser  (equivalent to py prompt | llm | parser)
const queryRewriteChain = queryRewritePrompt
  .pipe(llm)
  .pipe(new StringOutputParser());

// QUERY REWRITING TECHNIQUE
const queryRewriting = async (rawQuery) => {
  console.log("=== QUERY REWRITING TECHNIQUE ===");

  // Step 1 – Ask the LLM to rewrite the query for better retrieval
  const rewriteResponse = await queryRewriteChain.invoke({ query: rawQuery });

  const rewrittenQuery = rewriteResponse.trim(); // StringOutputParser already returns a plain string
  //   console.log("Query Rewriting response:", rewriteResponse);
  console.log("Original Query: ", rawQuery);
  console.log("Rewritten Query: ", rewrittenQuery);

  //Step 2 - Use the rewritten query for retrieval
};

// queryRewriting(originalQuery);
await queryRewriting(originalQuery);
