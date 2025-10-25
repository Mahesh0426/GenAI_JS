import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
import { OpenAI } from "openai";
import axios from "axios";

const API_KEY = process.env.OPENAI_API_KEY;

const getWeatherByCity = async (city = "") => {
  const url = `https://wttr.in/${city.toLowerCase()}?format=%C+%t`;
  const { data } = await axios.get(url, { responseType: "text" });
  return ` the current temperature in ${city} is ${data}`;
};

// getWeatherByCity("melbourne").then(console.log);

const TOOL_MAP = {
  getWeatherByCity: getWeatherByCity,
};

const client = new OpenAI({
  apiKey: API_KEY,
});

const main = async () => {
  const SYSTEM_PROMPT = `
    You are a  AI assistant who works on START, THINK and OUTPUT format.
     For a given user query first think and brealdown the probem into sub probelms.
     You should always keep thinking and thinking before giving the actual output.
     Also,before outputing the final result to user you must check once if everyting is correct.
     You have  also list of available tools that you can call based on user query.

     For every tool call that you make, wait for the OBSERVATION from the tool which is the response 
     from the tool that you called.

     Available Tools:
     - getWeatherByCity(city:string): Returns the current weather data of the city.
     
     Rules:
     - Strictly follow the output JSON format.
     - Always follow the output in sequence that is START → THINK → OBSERVE → TOOL → OUTPUT.
     - Always perform only one step at a time. and wait for other step.
     - Always make sure to do multiple step of thinking  before  giving output.
     - for every tool call always wait for the OBSERVE  which contains the output from the tool.


     Output JSON format:
     {"step": "START | THINK | OBSERVE | TOOL | OUTPUT", "content": "string", tool_name: "string", input: "string"}

     Example:
     User: Hey, what is the temperature or weather  in sydney ?
     ASSISTANT: {"step": "START", "content": "The user is interested in the current weather details about sydney."}
     ASSISTANT: {"step": "THINK", "content": "Let me see if there is any available tool for this query"}
     ASSISTANT: {"step": "THINK", "content": "I see that there is a tool called getWeatherByCity which returns the current weather data of the city."}
     ASSISTANT: {"step": "THINK", "content": "I need to call getWeatherByCity for city sydney to get the weather details."}
     ASSISTANT: {"step": "THINK", "content": "I will call getWeatherByCity for city sydney to get the weather details."}
     ASSISTANT: {"step": "TOOL", "input": "sydney", tool_name: "getWeatherByCity"}
     DEVELOPER: {"step": "OBSERVE", "content": "the current weather of sydney is  Rain shower +14 Celsius"}
     ASSISTANT: {"step": "THINK", "content": "Great! ,I got the weather details of sydney"}
     ASSISTANT: {"step": "OUTPUT", "content": "the weather of sydney is 14 C with rain shower.Please make sure to carry umbrella with you ☔️."}

    `;
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: "what is the weather in kathmandu ?" },
  ];
  // console.log("messages", messages);

  while (true) {
    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: messages,
    });
    const rawContent = response.choices[0].message.content;
    // console.log("💬 Raw Content:", rawContent);

    //convert raw content to json
    const parsedContent = JSON.parse(rawContent);
    // console.log("🚀 Parsed Content:", parsedContent);

    //push assistant response to messages array
    messages.push({
      role: "assistant",
      content: JSON.stringify(parsedContent),
    });

    //handle different steps
    if (parsedContent.step === "START") {
      console.log(`🔥`, parsedContent.content);
      continue;
    }
    if (parsedContent.step === "THINK") {
      console.log(`\t🧠`, parsedContent.content);
      continue;
    }
    if (parsedContent.step === "TOOL") {
      const toolToCall = parsedContent.tool_name;

      //check if tool exists
      if (!TOOL_MAP[toolToCall]) {
        messages.push({
          role: "developer",
          content: `There is no such tool as ${toolToCall}`,
        });
        continue;
      }

      //if tool exists call the tool
      const responseFromTool = await TOOL_MAP[toolToCall](parsedContent.input);
      console.log(
        `🛠️:${toolToCall}(${parsedContent.input}) = `,
        responseFromTool
      );

      //push the observation to messages array
      messages.push({
        role: "developer",
        content: JSON.stringify({ step: "OBSERVE", content: responseFromTool }),
      });
      continue;
    }

    if (parsedContent.step === "OUTPUT") {
      console.log(`\t🤖`, parsedContent.content);
      break;
    }
  }
  console.log("Done...");
};

main();
