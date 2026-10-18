# Project

**mcp-server-template**: A Falken's Lab MCP server.

- **What**: an MCP server over stdio, published on npm as `@falkenslab/mcp-server-template`, that an AI app (Claude Code, Claude Desktop, an agent built on agent-kit) starts with `npx`.
- **For whom**: the people those agents work for, through Falken's Lab's agents (miyagi for teachers, padawan for students) or any MCP client.
- **How it reaches agents**: as an extension in [agent-kit-extensions](https://github.com/falkenslab/agent-kit-extensions), which pins its version, adds the skills to use it well and declares its capabilities.
- **Out of scope**: anything an agent's own tools already do (reading and writing local files, the shell), and the craft of the domain around it, which belongs to the agent.

Replace this file's text when the template becomes a real server (`npm run init`): what it does, for whom, and what it leaves out.
