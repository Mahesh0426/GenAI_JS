import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
import { OpenAI } from "openai";
import axios from "axios";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const getGitHubUserInfo = async (username = "") => {
  const url = `https://api.github.com/users/${username.toLowerCase()}`;
  const { data } = await axios.get(url);
  return JSON.stringify({
    name: data.name,
    login: data.login,
    user_view_type: data.user_view_type,
    location: data.location,
    public_repos: data.public_repos,
    public_gists: data.public_gists,
    followers: data.followers,
    following: data.following,
    bio: data.bio,
  });
};

//create a TOOL_MAP object to map tool names to their corresponding functions
const TOOL_MAP = {
  getGitHubUserInfo: getGitHubUserInfo,
};

const main = async () => {
  const SYSTEM_PROMPT = `
    You are a  AI assistant who works on START, THINK and OUTPUT format.
     For a given user query first think and brealdown the probem into sub problems.
     You should always keep thinking and thinking before giving the actual output.
     Also,before outputing the final result to user you must check once if everyting is correct.
     You have  also list of available tools that you can call based on user query.

     For every tool call that you make, wait for the OBSERVATION from the tool which is the response 
     from the tool that you called.

 

     Available Tools:
     - getGitHubUserInfo(username:string): Returns the public information about the github user using github API.
     
     Rules:
     - Strictly follow the output JSON format.
     - Always follow the output in sequence that is START → THINK → OBSERVE → … → OUTPUT.
     - Always perform only one step at a time. and wait for other step.
     - Always make sure to do multiple step of thinking  before  giving output.
     - for every tool call always wait for the OBSERVE  which contains the output from the tool.


     Output JSON format:
     {"step": "START | THINK |OBSERVE | TOOL | OUTPUT", "content": "string", tool_name: "string", input: "string"}

     Example:
     User: Hey, what is the github user information of mahesh0426 ?
     ASSISTANT: {"step": "START", "content": "The user is interested in the  github user information."}
     ASSISTANT: {"step": "THINK", "content": "Let me see if there is any available tool for this query"}
     ASSISTANT: {"step": "THINK", "content": "I see that there is a tool called getGitHubUserInfo which returns the public information about the github user."}
     ASSISTANT: {"step": "THINK", "content": "I need to call getGitHubUserInfo for github public user to get the user details."}
     ASSISTANT: {"step": "THINK", "content": "I will call getGitHubUserInfo for github public user to get the public information about the user."}
     ASSISTANT: {"step": "TOOL", "input": "mahesh0426", tool_name: "getGitHubUserInfo"}
     DEVELOPER: {"step": "OBSERVE", "content": "the github user  is a software engineer with 10 public repositories and 5 followers."}
     ASSISTANT: {"step": "THINK", "content": "Great! ,I got the user's github details of mahesh0426"}
     ASSISTANT: {"step": "OUTPUT", "content": "the github user  is a software engineer with 10 public repositories and 5 followers."}

    `;

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: "hey, Tell me about github user rishisingh1034 ?",
    },
  ];

  while (true) {
    //response from llm
    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: messages,
    });

    //parse the response
    const rawContent = response.choices[0].message.content;

    let parsedContent;
    try {
      parsedContent = JSON.parse(rawContent);
    } catch (err) {
      console.error("Failed to parse JSON from assistant:", rawContent, err);
      break;
    }

    //add the parsed content to messages array
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
      if (!TOOL_MAP[toolToCall]) {
        messages.push({
          role: "developer",
          content: `There is no such tool as ${toolToCall}`,
        });
        continue;
      }
      const responseFromTool = await TOOL_MAP[toolToCall](parsedContent.input);
      console.log(
        `🛠️:${toolToCall}(${parsedContent.input}) = `,
        responseFromTool
      );
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

main().catch((err) => {
  console.error("Error in main:", err);
});
