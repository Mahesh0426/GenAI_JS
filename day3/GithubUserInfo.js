//using geminai open ai comptability

import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
import { OpenAI } from "openai";
import axios from "axios";

const client = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
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
  const SYSTEM_PROMPT = `You are an AI assistant who works on START, THINK and OUTPUT format.
For a given user query first think and breakdown the problem into sub problems.
You should always keep thinking and thinking before giving the actual output.
Also, before output the final result to user you must check once if everything is correct.
You have also list of available tools that you can call based on user query.
  
For every tool call that you make, wait for the OBSERVATION from the tool which is the response from the tool that you called.

Available Tools:
- getGitHubUserInfo(username:string): Returns the public information about the github user using github API.

Rules:
- Strictly follow the output JSON format.
- Always follow the output in sequence that is START → THINK → OBSERVE → … → OUTPUT.
- Always perform only one step at a time and wait for other step.
- Always make sure to do multiple step of thinking before giving output.
- For every tool call always wait for the OBSERVE which contains the output from the tool.
- Return only ONE JSON object per response (not multiple lines).

Output JSON format:
{"step": "START | THINK | TOOL | OUTPUT", "content": "string", "tool_name": "string", "input": "string"}

Example:
User: Hey, what is the github user information of mahesh0426 ?
ASSISTANT: {"step": "START", "content": "The user is interested in the github user information."}
ASSISTANT: {"step": "THINK", "content": "Let me see if there is any available tool for this query"}
ASSISTANT: {"step": "THINK", "content": "I see that there is a tool called getGitHubUserInfo which returns the public information about the github user."}
ASSISTANT: {"step": "THINK", "content": "I need to call getGitHubUserInfo for github public user to get the user details."}
ASSISTANT: {"step": "TOOL", "input": "mahesh0426", "tool_name": "getGitHubUserInfo"}
USER: {"step": "OBSERVE", "content": "{data from tool}"}
ASSISTANT: {"step": "THINK", "content": "Great! I got the user's github details"}
ASSISTANT: {"step": "OUTPUT", "content": "the github user is a software engineer with 10 public repositories and 5 followers."}`;

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: "hey, Tell me about github user mahesh0426 ?",
    },
  ];

  while (true) {
    //response from llm
    const response = await client.chat.completions.create({
      model: "gemini-2.0-flash-exp",
      messages: messages,
      temperature: 0.1,
    });

    // Check if response has valid structure
    if (!response.choices || response.choices.length === 0) {
      console.error("ERROR: Invalid response structure");
      console.error("Response:", JSON.stringify(response, null, 2));
      console.error("\nLast 3 messages in conversation:");
      console.error(JSON.stringify(messages.slice(-3), null, 2));
      break;
    }

    const rawContent = response.choices[0]?.message?.content;

    if (!rawContent) {
      console.error("ERROR: No content in response");
      console.error("Response:", JSON.stringify(response, null, 2));
      break;
    }

    // Gemini sometimes wraps JSON in ```json ... ``` – strip if needed
    let cleanedContent = rawContent.trim();
    if (cleanedContent.startsWith("```")) {
      cleanedContent = cleanedContent.replace(/```(?:json)?\n?/g, "");
    }

    // Push the ENTIRE response into history as one assistant message
    messages.push({
      role: "assistant",
      content: cleanedContent,
    });

    // Split into lines to process each step | Process each line separately
    const lines = cleanedContent.split("\n").filter((line) => line.trim());

    // Process each line
    for (const line of lines) {
      let parsedContent;
      try {
        parsedContent = JSON.parse(line.trim());
      } catch (err) {
        console.error("Failed to parse JSON line:", line);
        continue;
      }

      //handle different steps
      if (parsedContent.step === "START") {
        console.log(`🔥`, parsedContent.content);
      } else if (parsedContent.step === "THINK") {
        console.log(`\t🧠`, parsedContent.content);
      } else if (parsedContent.step === "TOOL") {
        const toolToCall = parsedContent.tool_name;

        if (!TOOL_MAP[toolToCall]) {
          const observation = {
            step: "OBSERVE",
            content: `Error: There is no such tool as ${toolToCall}`,
          };
          messages.push({
            role: "user",
            content: JSON.stringify(observation),
          });
          break; // Exit the for loop and continue main while loop
        }

        const responseFromTool = await TOOL_MAP[toolToCall](
          parsedContent.input
        );
        console.log(
          `🛠️:${toolToCall}(${parsedContent.input}) = `,
          responseFromTool
        );

        // Push the observation as a USER message
        const observation = {
          step: "OBSERVE",
          content: responseFromTool,
        };
        messages.push({
          role: "user",
          content: JSON.stringify(observation),
        });
        break; // Exit the for loop and continue main while loop
      } else if (parsedContent.step === "OUTPUT") {
        console.log(`\t🤖`, parsedContent.content);
        return; // Exit entire function
      }
    }
  }

  console.log("Done...");
};

main().catch((err) => {
  console.error("Error in main:", err);
});
