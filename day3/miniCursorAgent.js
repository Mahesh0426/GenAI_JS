import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
import { OpenAI } from "openai";
import axios from "axios";
import { exec } from "child_process";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const executeCommand = async (cmd = "") => {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, data) => {
      if (error) {
        return resolve(`Error executing command: ${error}`);
      } else {
        resolve(data);
      }
    });
  });
};

const TOOL_MAP = {
  executeCommand: executeCommand,
};

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
     - executeCommand(command:string): Takes a linux/ unix command  as a arg and execute the command on user machine and returns the output.


     Rules:
     - Strictly follow the output JSON format.
     - Always follow the output in sequence that is START → THINK → OBSERVE → TOOL → OUTPUT.
     - Always perform only one step at a time. and wait for other step.
     - Always make sure to do multiple step of thinking  before  giving output.
     - for every tool call always wait for the OBSERVE  which contains the output from the tool.


     Output JSON format:
     {"step": "START | THINK |OBSERVE | TOOL | OUTPUT", "content": "string", tool_name: "string", input: "string"}

     Example:
     User: Hey, create a folder todo_app and create a simple todo application using html, css and js ?
     ASSISTANT: {"step": "START", "content": "The user is interested in creating a todo application."}
     ASSISTANT: {"step": "THINK", "content": "Let me see if there is any available tool for this query"}
     ASSISTANT: {"step": "THINK", "content": "I see that there is a tool called executeCommand which can run shell commands."}
     ASSISTANT: {"step": "THINK", "content": "I need to call executeCommand to create necessary folders and files for the todo application."}
     ASSISTANT: {"step": "THINK", "content": "I will call executeCommand to create the folder and the necessary files."}
     ASSISTANT: {"step": "TOOL", "input": "mkdir todo_app && cd todo_app && touch index.html styles.css script.js", tool_name: "executeCommand"}
     DEVELOPER: {"step": "OBSERVE", "content": "Created folder todo_app and files index.html, styles.css, script.js"}
     ASSISTANT: {"step": "THINK", "content": "Great! ,I got the folder and files created successfully"}
     ASSISTANT: {"step": "OUTPUT", "content": "The todo application structure has been created successfully."}

    `;

  //messages array
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      //   content:
      //     "Hey, create a folder calculator_app and create a simple calculator application using html, css and js ?",
      content:
        "can you go to GenAI_JS folde using command cd .. and then from there do git add. and in commit message write githubuserinfo agent and mini cursoe agent created and then do git push  ",
    },
  ];

  //interaction  loop
  while (true) {
    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: messages,
      temperature: 0.2,
    });

    //parse raw respone
    const rawContent = response.choices[0].message.content;
    const parseContent = JSON.parse(rawContent);

    //push the assistant response to messages array
    messages.push({
      role: "assistant",
      content: JSON.stringify(parseContent),
    });

    //handle different steps
    if (parseContent.step === "START") {
      console.log(`🔥`, parseContent.content);
      continue;
    }
    if (parseContent.step === "THINK") {
      console.log(`\t🧠`, parseContent.content);
      continue;
    }
    if (parseContent.step === "TOOL") {
      const toolToCall = parseContent.tool_name;
      if (!TOOL_MAP[toolToCall]) {
        messages.push({
          role: "developer",
          content: `There is no such tool as ${toolToCall}`,
        });
        continue;
      }
      const responseFromTool = await TOOL_MAP[toolToCall](parseContent.input);
      console.log(
        `🛠️:${toolToCall}(${parseContent.input}) = `,
        responseFromTool
      );

      //push observation to messages array
      messages.push({
        role: "developer",
        content: JSON.stringify({
          step: "OBSERVE",
          content: responseFromTool,
        }),
      });
      continue;
    }

    //final output
    if (parseContent.step === "OUTPUT") {
      console.log(`\t🤖`, parseContent.content);
      break;
    }
  }
  console.log("Done...");
};
main().catch((err) => {
  console.error("Error in main:", err);
});
