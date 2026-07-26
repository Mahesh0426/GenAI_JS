// ─────────────────────────────────────────────────────────────────────────────
//  PDF RAG with Query Translation
//
//  Pipeline:
//    1. Accept a user question from the terminal
//    2. Detect if the query is vague (too short / generic)
//    3. If vague → apply all 3 query-translation techniques:
//         a) Query Rewriting   – sharpen the raw query
//         b) Multi-Query       – expand into N alternative phrasings
//         c) Step-Back        – derive a broader context question
//       Then retrieve & deduplicate chunks from every translated query
//    4. If specific → retrieve directly
//    5. Feed the merged context into the LLM and generate the final answer
// ─────────────────────────────────────────────────────────────────────────────

import dotenv from "dotenv";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { HNSWLib } from "@langchain/community/vectorstores/hnswlib";

// ─────────────────────────────────────────────────────────────────────────────
//  SETUP
// ─────────────────────────────────────────────────────────────────────────────

const llm = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0 });

const embeddings = new OpenAIEmbeddings({ model: "text-embedding-3-large" });
const indexPath = path.resolve(__dirname, "./hnswlib_index");

console.log("Loading vector store from:", indexPath);
const vectorStore = await HNSWLib.load(indexPath, embeddings);
const retriever = vectorStore.asRetriever({ k: 4 });
console.log("Vector store loaded.\n");

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS — Query Translation Techniques (from query-translation.js)
// ─────────────────────────────────────────────────────────────────────────────

/** Technique 1: Query Rewriting */
async function rewriteQuery(rawQuery) {
  const res = await llm.invoke([
    {
      role: "system",
      content: `You are an expert at improving search queries for a vector database.
Rewrite the user's query to be more specific, detailed, and retrieval-friendly.
Return ONLY the rewritten query — no explanation, no quotes.`,
    },
    { role: "user", content: rawQuery },
  ]);
  return res.content.trim();
}

/** Technique 2: Multi-Query Expansion */
async function expandQuery(rawQuery, n = 3) {
  const res = await llm.invoke([
    {
      role: "system",
      content: `You are an expert at query expansion for vector database retrieval.
Generate exactly ${n} different phrasings of the user's query that cover different
angles, synonyms, or related concepts.
Return ONLY a numbered list — one query per line, no extra text.`,
    },
    { role: "user", content: rawQuery },
  ]);

  return res.content
    .trim()
    .split("\n")
    .map((line) => line.replace(/^\d+[\.\)]\s*/, "").trim())
    .filter(Boolean);
}

/** Technique 3: Step-Back Prompting */
async function stepBackQuery(rawQuery) {
  const res = await llm.invoke([
    {
      role: "system",
      content: `You are an expert at abstracting search queries.
Given a specific question, generate a broader, more general "step-back" question
that provides background context needed to answer the specific question.
Return ONLY the step-back question — no explanation, no quotes.`,
    },
    { role: "user", content: rawQuery },
  ]);
  return res.content.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
//  VAGUENESS DETECTION
//  A query is vague if:
//    - it has 5 or fewer words, OR
//    - it contains no question word AND no auxiliary verb
// ─────────────────────────────────────────────────────────────────────────────

function isVague(query) {
  const words = query.trim().split(/\s+/);
  if (words.length <= 5) return true;

  const hasQuestionWord = /\b(what|how|why|when|where|who|which|explain|describe|tell)\b/i.test(query);
  const hasVerb = /\b(is|are|was|were|does|do|can|could|will|would|should|has|have|had)\b/i.test(query);
  if (!hasQuestionWord && !hasVerb) return true;

  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
//  RETRIEVAL — deduplicated across all queries (from retrieve.js)
// ─────────────────────────────────────────────────────────────────────────────

async function retrieveChunks(queries) {
  const allNested = await Promise.all(queries.map((q) => retriever.invoke(q)));
  const seen = new Set();
  return allNested.flat().filter((chunk) => {
    if (seen.has(chunk.pageContent)) return false;
    seen.add(chunk.pageContent);
    return true;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
//  GENERATION — grounded answer with page citations
// ─────────────────────────────────────────────────────────────────────────────

async function generateAnswer(originalQuery, chunks, translationLog) {
  const context = chunks
    .map(
      (c) =>
        `[Page ${c.metadata.loc?.pageNumber ?? "?"}] (${c.metadata.source}):\n${c.pageContent}`
    )
    .join("\n\n");

  const translationNote =
    translationLog.length > 0
      ? `\n\nNote: Query translation was applied automatically:\n${translationLog.join("\n")}`
      : "";

  const response = await llm.invoke([
    {
      role: "system",
      content: `You are a helpful PDF assistant. Answer the user's question using ONLY the context below.
Cite the page number for each fact you use (e.g., [Page 3]).
If the context does not contain enough information, say so clearly — do NOT fabricate anything.${translationNote}

Context:
${context}`,
    },
    { role: "user", content: originalQuery },
  ]);

  return response.content;
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN PIPELINE
// ─────────────────────────────────────────────────────────────────────────────

async function ragPipeline(userQuery) {
  console.log("\n" + "=".repeat(70));
  console.log("  PDF RAG — User Query:", userQuery);
  console.log("=".repeat(70));

  const vague = isVague(userQuery);
  const queriesToRetrieve = [];
  const translationLog = [];

  if (vague) {
    console.log("\nVague query detected — applying all 3 Query Translation techniques...\n");

    // 1. Query Rewriting
    const rewritten = await rewriteQuery(userQuery);
    console.log("[1] Query Rewriting:");
    console.log("   Original :", userQuery);
    console.log("   Rewritten:", rewritten);
    translationLog.push(`  1. Rewritten query: "${rewritten}"`);
    queriesToRetrieve.push(rewritten);

    // 2. Multi-Query Expansion
    const expanded = await expandQuery(userQuery, 3);
    console.log("\n[2] Multi-Query Expansion:");
    expanded.forEach((q, i) => console.log(`   ${i + 1}. ${q}`));
    translationLog.push(`  2. Expanded into ${expanded.length} alternative queries`);
    queriesToRetrieve.push(...expanded);

    // 3. Step-Back Prompting
    const stepBack = await stepBackQuery(userQuery);
    console.log("\n[3] Step-Back Prompting:");
    console.log("   Step-back question:", stepBack);
    translationLog.push(`  3. Step-back question: "${stepBack}"`);
    queriesToRetrieve.push(stepBack);
  } else {
    console.log("\nSpecific query — retrieving directly (no translation needed).\n");
    queriesToRetrieve.push(userQuery);
  }

  // Retrieve and deduplicate
  console.log(
    `\nRetrieving from vector store using ${queriesToRetrieve.length} query/queries...`
  );
  const chunks = await retrieveChunks(queriesToRetrieve);
  console.log(`Using ${chunks.length} unique context chunks.\n`);

  // Generate answer
  console.log("─".repeat(70));
  console.log("Answer:");
  console.log("─".repeat(70));
  const answer = await generateAnswer(userQuery, chunks, translationLog);
  console.log(answer);
  console.log("\n" + "=".repeat(70));
}

// ─────────────────────────────────────────────────────────────────────────────
//  INTERACTIVE TERMINAL LOOP
// ─────────────────────────────────────────────────────────────────────────────

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function promptUser() {
  rl.question(
    '\nAsk a question about the PDF (or type "exit" to quit):\n> ',
    async (input) => {
      const query = input.trim();

      if (!query) {
        promptUser();
        return;
      }

      if (query.toLowerCase() === "exit" || query.toLowerCase() === "quit") {
        console.log("\nGoodbye!");
        rl.close();
        process.exit(0);
      }

      try {
        await ragPipeline(query);
      } catch (err) {
        console.error("\nError:", err.message);
      }

      // Only loop if stdin is still open (guard against piped / EOF input)
      if (!rl.closed) promptUser();
    }
  );
}

console.log("=".repeat(72));
console.log("  PDF RAG with Smart Query Translation");
console.log("  Vague query? Auto-applies Rewrite + Multi-Query + Step-Back");
console.log("=".repeat(72));

promptUser();
