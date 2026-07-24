//In the Agents SDK (Python or JavaScript), handoffs let one agent defer responsibilities
// to another agent that’s better suited for the job For example,
// a refund agent or a booking agent. The system treats a handoff as a tool the LLM can invoke,
// like transfer_to_refund_agent.

import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
import { Agent, run, tool } from "@openai/agents";
import { z } from "zod";

// TOOLS
// tool to get current time
const getCurrentTime = tool({
  name: "get_Current_Time",
  description: "This tool returns the current time .",
  parameters: z.object({}),

  async execute() {
    const currentTime = new Date().toLocaleTimeString();
    return currentTime;
  },
});

// tool to get menu items
const getMenuTool = tool({
  name: "get_menu",
  description: "Fetches and returns the menu items",
  parameters: z.object({}),

  async execute() {
    // Simulate fetching menu items from a database or API
    const menuItems = {
      drinks: {
        coke: "$2",
        pepsi: "$2",
      },
      pizza: {
        margherita: "$10",
        pepperoni: "$12",
      },
    };
    // return `Today's menu items are: Drinks - Coke: ${menuItems.drinks.coke}, Pepsi: ${menuItems.drinks.pepsi}; Pizza - Margherita: ${menuItems.pizza.margherita}, Pepperoni: ${menuItems.pizza.pepperoni}`;
    return `Today's menu items are: Drinks - ${JSON.stringify(
      menuItems.drinks
    )}; Pizza - ${JSON.stringify(menuItems.pizza)}`;
  },
});

// create cooking agent
const cookingAgent = new Agent({
  name: "Cooking_Agent",
  model: "gpt-4.1-mini",
  //   apiKey: process.env.OPENAI_API_KEY,
  tools: [getCurrentTime, getMenuTool],
  instructions: `
    You are an helpful cooking assistant who is specializes in  cooking food.
    You help the users with food options and recipes and help them cook food
    `,
});

//create a coding agent
const codingAgent = new Agent({
  name: "Coding_Agent",
  model: "gpt-4.1-mini",
  instructions: `
    You are an expert coding assistant particularly in javascript programming language.
    `,
});

// hand offs agent  | who determines which agent to use | middleware
// const gatewayAgent = Agent.create({
//   name: "Gateway_Agent",
//   instructions: `You are a triage agent.
//     - If the query is about food, recipes, or menu items → hand off to Cooking_Agent.
//     - If the query is about programming or coding → hand off to Coding_Agent.
//     Do not answer directly yourself.`,
//   handoffs: [cookingAgent, codingAgent],
// });

// hand offs agent  | who determines which agent to use | middleware
const gatewayAgent = Agent.create({
  name: "Gateway_Agent",
  instructions: `
   You have list of handoffs which you need to use to handoff the current user query to the correct agent.
    You should hand off to Coding Agent if user asks about a coding question.
    You should hand off to Cooking Agent if question is realted to Cooking.
  `,
  handoffs: [cookingAgent, codingAgent],
});

// chat with the agent
const chatWithAgent = async (query) => {
  const result = await run(gatewayAgent, query);
  console.log("History:", result.history);
  console.log(result.finalOutput);
};

chatWithAgent(
  "Depending on the current time, whare are food options in sydney also what items are available in the menu?"
);
