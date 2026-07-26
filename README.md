# GenAI_JS

This project contains JavaScript/Node.js code samples and experiments for working with Generative AI, including OpenAI, LangChain,LangGraph, OpenAI Agents SDK.

## Project Structure

- **day1/**: Intro to LLM, tokens, vector stores, embeddings, etc.
- **day2/**: Basic scripts and API usage examples (OpenAI, chat, few-shot, etc.)
- **day3/**: Weather agent example
- **day4-RAG/**: Retrieval-Augmented Generation (RAG) examples, including PDF indexing and Docker setup
- **day5-agents/**: Agent-based examples (basic agent, handoff agent)

## Key Dependencies

- `openai` — OpenAI API client
- `@langchain/core`, `@langchain/community`, `@langchain/openai`, `@langchain/qdrant` — LangChain libraries for LLMs and vector stores
- `dotenv` — Loads environment variables from `.env`
- `axios` — HTTP client
- `pdf-parse` — PDF parsing
- `zod` — Schema validation

## Setup

1. Install dependencies:
   ```sh
   yarn install
   ```
2. Create a `.env` file in the root directory with your API keys:
   ```env
   OPENAI_API_KEY=your_openai_key_here
   ```
3. Run scripts as needed, for example:
   ```sh
   node day2/hello_world.js
   ```

## Notes

- The project uses ES modules (`type: module` in `package.json`).
- Make sure to restart your terminal or dev server after changing `.env`.
- For Vite or browser-based projects, use `VITE_` prefix for env variables.

---

# 🧠 What is Query Translation in RAG?

When a user asks a question, the raw query might be vague, ambiguous, or poorly worded for vector search. **Query Translation** techniques rewrite or expand the query before retrieval to improve the quality of retrieved chunks.

There are 3 main techniques:

| Technique               | What it does                                                                    |
| :---------------------- | :------------------------------------------------------------------------------ |
| **Query Rewriting**     | Rewrites the raw query into a cleaner, more precise version                     |
| **Multi-Query**         | Generates _N_ different phrasings of the query, retrieves for all, deduplicates |
| **Step-Back Prompting** | Generates a more abstract/general "parent" question to broaden context          |

---

## 🔍 How Each Technique Works

> **Demo query used:** `"virtual team problems"` — intentionally vague to highlight the value of query translation.

---

### Technique 1 — Query Rewriting

The LLM rewrites the short, vague query into a detailed, semantically rich sentence before hitting the vector store. This dramatically improves cosine similarity matching.

```
Original  : virtual team problems
Rewritten : challenges faced by virtual teams in remote work environments,
            including communication issues, collaboration difficulties, and
            team cohesion problems
```

**How it works (step by step):**
1. Send the raw query to the LLM with a rewriting prompt.
2. Use the **rewritten query** (not the original) to retrieve chunks from the vector store.
3. Pass the retrieved chunks + rewritten query to the LLM for the final answer.

**Best for:** Vague, short, or keyword-style queries that need more precision.

---

### Technique 2 — Multi-Query (Query Expansion)

Generates N alternative phrasings of the same question, retrieves chunks for **each**, then deduplicates and merges before answering. This casts a wider net across the vector space.

```
Generated 3 alternatives:
  1. challenges faced by remote teams
  2. issues encountered in virtual collaboration
  3. difficulties in managing distributed teams

Retrieved 9 total chunks → 5 unique after deduplication
```

**How it works (step by step):**
1. Ask the LLM to generate N rephrased versions of the query.
2. Run retrieval **in parallel** for all N queries.
3. **Deduplicate** by `pageContent` to avoid repeating the same chunk.
4. Feed the merged unique chunks to the LLM for a richer answer.

**Best for:** Queries where a single phrasing might miss relevant chunks expressed differently in the source document.

---

### Technique 3 — Step-Back Prompting

Generates a more **abstract, general** version of the query (a "step-back" question) to retrieve broader background context, then combines it with the specific query's results.

```
Original    : virtual team problems
Step-Back   : What are the common challenges faced by teams that operate
              remotely or in a virtual environment?

Specific retrieval : 3 chunks
Step-back retrieval: 3 chunks
Merged unique      : 4 chunks
```

**How it works (step by step):**
1. Ask the LLM to generate a broader, more conceptual version of the question.
2. Run retrieval **in parallel** for both the original and the step-back query.
3. Merge and deduplicate the results.
4. Pass both questions and the merged context to the LLM for a well-grounded, comprehensive answer.

**Best for:** Narrow queries that miss conceptual or background context present elsewhere in the document.

---

## 🧠 Mental Model

```
Naive RAG:
  Raw Query ──▶ Retriever ──▶ LLM ──▶ Answer

With Query Translation:
  Raw Query ──▶ LLM (rewrite/expand/abstract)
                    │
                    ▼
             Better Query(ies) ──▶ Retriever ──▶ Merged Chunks ──▶ LLM ──▶ Answer
```

---

## 📊 When to Use Which Technique

| Technique           | Best For                                      | Retrieval Width   |
| :------------------ | :-------------------------------------------- | :---------------- |
| Query Rewriting     | Vague / short / keyword-style queries         | Single query      |
| Multi-Query         | Queries with many valid alternative phrasings | Wide (N queries)  |
| Step-Back Prompting | Narrow queries needing conceptual background  | Two-level (specific + abstract) |

> **Implementation:** See [`day6-Advance-RAG/query-rewriting/query-translation.js`](./day6-Advance-RAG/query-rewriting/query-translation.js)
