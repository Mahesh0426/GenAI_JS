import { aiAgent } from "./agent.js";

// await aiAgent("Add a note: Buy milk and eggs");
// await aiAgent("Read my notes");
await aiAgent(
  "can you update line 1 to buy milk and eggs? and in line 2 buy breads?"
);
await aiAgent("Read my notes");
// await aiAgent("Delete line 2");
