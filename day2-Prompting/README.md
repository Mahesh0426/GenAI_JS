# Understanding AI Models and Prompting

## What is GIGO?

GIGO stands for "Garbage In, Garbage Out". In AI, this means the quality of your prompts directly affects the quality of responses you get. If you give unclear or poorly structured prompts, you'll get low-quality responses. Good prompts = good responses!

## What is Prompting?

Prompting is how we talk to AI models. It's like giving instructions to a very smart but literal assistant. The better and clearer your instructions (prompts) are, the better results you'll get.

## Prompting Styles

## ChatML Prompting Style

ChatML is a standardized message format used for communicating with AI models. It provides a structured way to format conversations, making them clear and consistent.

### Basic Structure

ChatML messages consist of:

- A `role` field indicating who is speaking
- A `content` field containing the actual message
- Optional fields like `name` or `function_call` for special purposes

### Example Usage

````javascript
const messages = [
  {
    role: "system",
    content:
      "You are a JavaScript coding assistant. Provide clear, concise answers with code examples.",
  },
  {
    role: "user",
    content: "How do I create an array in JavaScript?",
  },
  {
    role: "assistant",
    content:
      "Here are two common ways to create an array:\n```js\n// Empty array using literals\nlet arr1 = [];\n\n// Array with elements\nlet arr2 = [1, 2, 3];\n```",
  },
  {
    role: "user",
    content: "How do I add elements to it?",
  },
  {
    role: "assistant",
    content:
      "You can use push() to add elements:\n```js\narr1.push(4); // adds to end\n```",
  },
];
````

## Types of Prompts

### 1. Zero-Shot Prompting

- The simplest form of prompting
- Just ask the question directly without examples
- Example from [chat.js](chat.js):

```javascript
messages: [
  {
    role: "system",
    content:
      "You are an AI assistant who is expert in e-commerce online business...",
  },
  {
    role: "user",
    content: "i order something but cannot pay for it",
  },
];
```

### 2. Few-Shot Prompting

- Giving examples to help the AI understand the pattern
- Shows the AI exactly how you want it to respond
- Example from [few_short.js](few_short.js):

```javascript
Examples:
User: i order something but cannot pay for it.
Storify: we have a payment gateway which you can use to pay for your order.

User: what kinds of product you have?
Storify: we sell specially clothes and shoes...
```

### 3. Chain of Thought (CoT) Prompting

- Breaking down complex problems into steps
- Makes the AI show its work
- Example from [Cot.js](Cot.js) and [Cot2.js](Cot2.js):

```javascript
START → THINK → OUTPUT format
```

## API Compatibility

Different AI providers (like Google, Groq) allow using OpenAI-style SDK to interact with their models. This means you can use the same code structure to work with different AI models!

### Example: Using Gemini with OpenAI SDK

From [gemini.js](gemini.js):

```javascript
const openai = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
});
```

### Example: Using Groq with OpenAI SDK

From [groq.js](groq.js):

```javascript
const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});
```

## Key Benefits of API Compatibility

1. Use same code structure for different AI models
2. Easy to switch between models
3. No need to learn different APIs
4. Faster integration with existing code
