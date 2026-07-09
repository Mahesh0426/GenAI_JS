import { OpenAI } from "openai";
import "dotenv/config";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Zod schema
const RiskSchema = z.object({
  title: z.string().describe("The title of the risk"),
  tags: z.array(z.string()).describe("3-4 tags for the risk"),
  score: z
    .number()
    .min(1)
    .max(5)
    .describe("Risk score from 1 (low) to 5 (high)"),
});

const OutputSchema = z.object({
  risks: z.array(RiskSchema).describe("List of identified risks"),
});

async function main() {
  // add here .create for  output_text  and .parse for output_parsed
  const result = await client.responses.parse({
    model: "gpt-4.1-mini",
    text: {
      format: zodTextFormat(OutputSchema, "risks"),
    },
    input: `
          Extract the risks from the following document.

          Document:
          Acme Corp stores customer data in a cloud database. Recently, employees
          have been sharing passwords through email, and multi-factor authentication
          is not enabled for administrator accounts. Database backups are only taken
          once a month, increasing the chance of data loss after a system failure.
          The company also relies on a single cloud provider with no disaster recovery
          plan. Developers sometimes deploy code directly to production without code
          reviews, increasing the likelihood of bugs and security vulnerabilities.
          `,
  });

  // This will print the raw text output from the model
  // console.log(result.output_text);
  console.log(result.output_parsed);
}

main();
