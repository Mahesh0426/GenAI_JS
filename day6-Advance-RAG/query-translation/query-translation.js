import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { HNSWLib } from "@langchain/community/vectorstores/hnswlib";

// ─────────────────────────────────────────────────────────────────────────────
//  SETUP — shared across all techniques
// ─────────────────────────────────────────────────────────────────────────────

const llm = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0 });

const embeddings = new OpenAIEmbeddings({ model: "text-embedding-3-large" });
const indexPath = path.resolve(__dirname, "./hnswlib_index");
const vectorStore = await HNSWLib.load(indexPath, embeddings);
const retriever = vectorStore.asRetriever({ k: 3 });

// The raw user query — intentionally vague/short to show query translation value
const originalQuery = "virtual team problems";

console.log("=".repeat(70));
console.log("  QUERY TRANSLATION DEMO");
console.log("  Original Query:", originalQuery);
console.log("=".repeat(70));

// ─────────────────────────────────────────────────────────────────────────────
//  TECHNIQUE 1: QUERY REWRITING
//  Goal: Rewrite the raw query into a precise, retrieval-optimised version.
//  When to use: When the user query is vague, uses jargon, or is incomplete.
// ─────────────────────────────────────────────────────────────────────────────

async function queryRewriting(rawQuery) {
  console.log("\n" + "─".repeat(70));
  console.log("TECHNIQUE 1: QUERY REWRITING");
  console.log("─".repeat(70));

  // Step 1 – Ask the LLM to rewrite the query for better retrieval
  const rewriteResponse = await llm.invoke([
    {
      role: "system",
      content: `You are an expert at improving search queries for a vector database.
Rewrite the user's query to be more specific, detailed, and retrieval-friendly.
Return ONLY the rewritten query — no explanation, no quotes.`,
    },
    {
      role: "user",
      content: rawQuery,
    },
  ]);

  const rewrittenQuery = rewriteResponse.content.trim();
  console.log("Original :", rawQuery);
  console.log("Rewritten:", rewrittenQuery);

  // Step 2 – Use the rewritten query for retrieval
  const chunks = await retriever.invoke(rewrittenQuery);

  // Step 3 – Generate final answer with rewritten query + retrieved context
  const answer = await llm.invoke([
    {
      role: "system",
      content: `You are a helpful assistant. Answer the user's question using ONLY the context below.
Cite the page number for each piece of information you use.

Context:
${chunks
  .map((c) => `[Page ${c.metadata.loc?.pageNumber ?? "?"}]: ${c.pageContent}`)
  .join("\n\n")}`,
    },
    {
      role: "user",
      content: rewrittenQuery,
    },
  ]);

  console.log("\n📌 Answer (Query Rewriting):");
  console.log(answer.content);
}

// ─────────────────────────────────────────────────────────────────────────────
//  TECHNIQUE 2: MULTI-QUERY (Query Expansion)
//  Goal: Generate N alternative phrasings of the query, retrieve for each,
//        then deduplicate and merge results before answering.
//  When to use: When a single query might miss relevant chunks phrased differently.
// ─────────────────────────────────────────────────────────────────────────────

async function multiQuery(rawQuery, n = 3) {
  console.log("\n" + "─".repeat(70));
  console.log("TECHNIQUE 2: MULTI-QUERY (Query Expansion)");
  console.log("─".repeat(70));

  // Step 1 – Generate N alternative queries
  const expansionResponse = await llm.invoke([
    {
      role: "system",
      content: `You are an expert at query expansion for vector database retrieval.
Generate exactly ${n} different phrasings of the user's query that cover different
angles, synonyms, or related concepts.
Return ONLY a numbered list — one query per line, no extra text.`,
    },
    {
      role: "user",
      content: rawQuery,
    },
  ]);

  // Parse out the N queries from the LLM response
  const alternativeQueries = expansionResponse.content
    .trim()
    .split("\n")
    .map((line) => line.replace(/^\d+[\.\)]\s*/, "").trim())
    .filter(Boolean);

  console.log("Original Query  :", rawQuery);
  console.log("Generated Queries:");
  alternativeQueries.forEach((q, i) => console.log(`  ${i + 1}. ${q}`));

  // Step 2 – Retrieve for ALL queries in parallel
  const allChunksNested = await Promise.all(
    alternativeQueries.map((q) => retriever.invoke(q)),
  );

  // Step 3 – Flatten + Deduplicate by pageContent
  const seen = new Set();
  const uniqueChunks = allChunksNested.flat().filter((chunk) => {
    if (seen.has(chunk.pageContent)) return false;
    seen.add(chunk.pageContent);
    return true;
  });

  console.log(
    `\nRetrieved ${allChunksNested.flat().length} total chunks → ${uniqueChunks.length} unique after dedup`,
  );

  // Step 4 – Generate final answer from merged, deduplicated context
  const answer = await llm.invoke([
    {
      role: "system",
      content: `You are a helpful assistant. Answer the user's original question using ONLY the context below.
Cite the page number for each piece of information you use.

Original Question: "${rawQuery}"

Context:
${uniqueChunks
  .map((c) => `[Page ${c.metadata.loc?.pageNumber ?? "?"}]: ${c.pageContent}`)
  .join("\n\n")}`,
    },
    {
      role: "user",
      content: rawQuery,
    },
  ]);

  console.log("\n📌 Answer (Multi-Query):");
  console.log(answer.content);
}

// ─────────────────────────────────────────────────────────────────────────────
//  TECHNIQUE 3: STEP-BACK PROMPTING
//  Goal: First ask a more ABSTRACT version of the question to retrieve broad
//        background context, then combine with the specific query for retrieval.
//  When to use: When the specific query is too narrow and misses conceptual context.
// ─────────────────────────────────────────────────────────────────────────────

async function stepBackPrompting(rawQuery) {
  console.log("\n" + "─".repeat(70));
  console.log("TECHNIQUE 3: STEP-BACK PROMPTING");
  console.log("─".repeat(70));

  // Step 1 – Generate a more abstract/general "step-back" question
  const stepBackResponse = await llm.invoke([
    {
      role: "system",
      content: `You are an expert at abstracting search queries.
Given a specific question, generate a broader, more general "step-back" question
that provides background context needed to answer the specific question.
Return ONLY the step-back question — no explanation, no quotes.`,
    },
    {
      role: "user",
      content: rawQuery,
    },
  ]);

  const stepBackQuery = stepBackResponse.content.trim();
  console.log("Original Query  :", rawQuery);
  console.log("Step-Back Query :", stepBackQuery);

  // Step 2 – Retrieve for BOTH the specific and step-back queries in parallel
  const [specificChunks, broadChunks] = await Promise.all([
    retriever.invoke(rawQuery),
    retriever.invoke(stepBackQuery),
  ]);

  // Step 3 – Merge and deduplicate
  const seen = new Set();
  const mergedChunks = [...specificChunks, ...broadChunks].filter((chunk) => {
    if (seen.has(chunk.pageContent)) return false;
    seen.add(chunk.pageContent);
    return true;
  });

  console.log(
    `\nSpecific retrieval: ${specificChunks.length} chunks | Step-back retrieval: ${broadChunks.length} chunks`,
  );
  console.log(`Merged unique chunks: ${mergedChunks.length}`);

  // Step 4 – Generate a well-grounded answer using both layers of context
  const answer = await llm.invoke([
    {
      role: "system",
      content: `You are a helpful assistant. Answer the user's specific question using ONLY the context below.
Use the broader background context to improve your explanation.
Cite the page number for each piece of information.

Specific Question: "${rawQuery}"
Step-Back (Background) Question: "${stepBackQuery}"

Context:
${mergedChunks
  .map((c) => `[Page ${c.metadata.loc?.pageNumber ?? "?"}]: ${c.pageContent}`)
  .join("\n\n")}`,
    },
    {
      role: "user",
      content: rawQuery,
    },
  ]);

  console.log("\n📌 Answer (Step-Back Prompting):");
  console.log(answer.content);
}

// ─────────────────────────────────────────────────────────────────────────────
//  RUN ALL THREE TECHNIQUES SEQUENTIALLY
// ─────────────────────────────────────────────────────────────────────────────

await queryRewriting(originalQuery);
await multiQuery(originalQuery, 3);
await stepBackPrompting(originalQuery);

console.log("\n" + "=".repeat(70));
console.log("  DONE — All 3 Query Translation Techniques Completed");
console.log("=".repeat(70));
