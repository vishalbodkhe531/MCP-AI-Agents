import { config } from "dotenv";
import readline from "readline/promises";
import { GoogleGenAI, Type } from "@google/genai";
import type { FunctionDeclaration, Schema } from "@google/genai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

config();

const chatHistory: Array<{
  role: "user" | "model";
  parts: { text: string; type: "text" }[];
}> = [];

let tools: FunctionDeclaration[] = [];

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

if (!process.env.GEMINI_API_KEY) {
  console.error("Missing GEMINI_API_KEY in .env");
  process.exit(1);
}

const mcpClient = new Client({
  name: "example-client",
  version: "1.0.0",
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

mcpClient
  .connect(new SSEClientTransport(new URL("http://localhost:3001/sse")))
  .then(async () => {
    console.log("Connected to MCP server");

    const { tools: fetchedTools } = await mcpClient.listTools();
    tools = fetchedTools.map((tool) => {
      return {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: Type.OBJECT,
          properties: tool.inputSchema.properties as Record<string, Schema>,
          required: tool.inputSchema.required as string[] | undefined,
        },
      };
    });
    chatLoop();
  });

async function chatLoop(toolCall?: { name: string; args: any }) {
  if (toolCall) {
    if (!toolCall.name) {
      console.error("Tool call name is undefined.");
      return;
    }

    console.log("Calling tool:", toolCall.name);

    const toolResult = await mcpClient.callTool({
      name: toolCall.name,
      arguments: toolCall.args,
    });

    const content = toolResult.content as Array<{ text: string }>;
    const toolResponseText = content[0]?.text ?? "No response";

    chatHistory.push({
      role: "user",
      parts: [
        {
          text: "Tool result: " + toolResponseText,
          type: "text",
        },
      ],
    });
  } else {
    const question = await rl.question("You: ");
    chatHistory.push({
      role: "user",
      parts: [
        {
          text: question,
          type: "text",
        },
      ],
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: chatHistory,
    config: {
      tools: [
        {
          functionDeclarations: tools,
        },
      ],
    },
  });

  const part = response.candidates?.[0]?.content?.parts?.[0];

  if (part?.functionCall && part.functionCall.name) {
    return chatLoop({
      name: part.functionCall.name,
      args: part.functionCall.args,
    });
  }

  const responseText = part?.text ?? "No response from AI";

  chatHistory.push({
    role: "model",
    parts: [
      {
        text: responseText,
        type: "text",
      },
    ],
  });

  console.log(`AI: ${responseText}`);

  return chatLoop();
}
