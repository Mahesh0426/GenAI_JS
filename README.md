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

Feel free to explore the folders for more specific examples and agent implementations.
