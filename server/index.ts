import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express, { Request, Response } from "express";
import { z } from "zod";
import { createPost } from "./mcp.tool.mjs";

const server = new McpServer({
  name: "example-server",
  version: "1.0.0",
});

const app = express();

server.tool(
  "addTwoNumbers",
  "Add two numbers",
  {
    a: z.number(),
    b: z.number(),
  },
  async (arg: { a: number; b: number }) => {
    const { a, b } = arg;
    return {
      content: [
        {
          type: "text",
          text: `The sum of ${a} and ${b} is ${a + b}`,
        },
      ],
    };
  }
);

server.tool(
  "subTwoNumbers",
  "Subtract two numbers",
  {
    a: z.number(),
    b: z.number(),
  },
  async (arg: { a: number; b: number }) => {
    const { a, b } = arg;
    return {
      content: [
        {
          type: "text",
          text: `The sub of ${a} and ${b} is ${a - b}`,
        },
      ],
    };
  }
);

server.tool(
  "multiplyTwoNumbers",
  "Multiply Two Numbers",
  {
    a: z.number(),
    b: z.number(),
  },
  async (arg: { a: number; b: number }) => {
    const { a, b } = arg;
    return {
      content: [
        {
          type: "text",
          text: `The multiplication of ${a} and ${b} is ${a * b}`,
        },
      ],
    };
  }
);

server.tool(
  "divideTwoNumbers",
  "Divide Two Numbers",
  {
    a: z.number(),
    b: z.number(),
  },
  async (arg: { a: number; b: number }) => {
    const { a, b } = arg;
    return {
      content: [
        {
          type: "text",
          text: `The division of ${a} and ${b} is ${a / b}`,
        },
      ],
    };
  }
);

server.tool(
  "createPost",
  "Create a post on X (formerly Twitter)",
  {
    status: z.string(),
  },
  async (arg: { status: string }) => {
    const { status } = arg;
    console.log("status : ", status);
    const result = await createPost(status);
    console.log("result : ", result);
    return {
      content: [
        {
          type: "text" as const,
          text: result.content[0].text,
        },
      ],
    };
  }
);

const transports: Record<string, SSEServerTransport> = {}; // useing this SSEServerTransport  client can connect to the server

app.get("/sse", async (req: Request, res: Response) => {
  const transport = new SSEServerTransport("/messages", res);
  transports[transport.sessionId] = transport;
  res.on("close", () => {
    delete transports[transport.sessionId];
  });
  await server.connect(transport);
});

app.post("/messages", async (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string;
  const transport = transports[sessionId];
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(400).send("No transport found for sessionId");
  }
});

app.listen(3001, () => {
  console.log("Server is running on http://localhost:3001");
});

// create an post on X with topic AI agent making coding easy.
