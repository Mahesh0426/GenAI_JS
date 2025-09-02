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

// chat with the agent
const chatWithAgent = async (query) => {
  const result = await run(cookingAgent, query);
  console.log("History:", result.history);
  console.log(result.finalOutput);
};

chatWithAgent(
  "Depending on the current time, whare are food options in sydney also what items are available in the menu?"
);
