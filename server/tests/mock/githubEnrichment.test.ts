import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { extractInfoFromReadme } from '../../src/lib/githubEnrichment';
import OpenAI from 'openai';

// Mock the OpenAI module
vi.mock('openai', () => {
  const OpenAIMock = vi.fn();
  OpenAIMock.prototype.chat = {
    completions: {
      create: vi.fn()
    }
  };
  return { default: OpenAIMock };
});

// Mock the config module
vi.mock('../../src/lib/config', () => ({
  config: {
    openai: {
      apiKey: 'test-api-key',
      baseURL: 'https://test-api-url.com',
      modelName: 'test-model',
      apiKeyIsValid: true,
      modelCharLimit: 100000
    },
    cache: {
      ttl: 3600000
    }
  }
}));

// Mock the llm module
vi.mock('../../src/lib/llm', () => ({
  callLLM: vi.fn(),
  truncateToModelLimit: vi.fn((content: string) => content)
}));

describe('extractInfoFromReadme', () => {
  const mockOpenAIInstance = new OpenAI() as any;
  const mockCreateCompletion = mockOpenAIInstance.chat.completions.create;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should extract information from README content successfully', async () => {
    // Sample README markdown content for testing
    const sampleReadme = `
# Sample MCP Server

This is a sample MCP server that demonstrates how to integrate with the Model Context Protocol.

## Features

- Feature 1: Real-time data processing
- Feature 2: Cross-platform compatibility
- Feature 3: Low latency responses

## Installation

To install this server, run:

\`\`\`bash
npm install sample-mcp-server
\`\`\`

## Usage

Here's how to use the server:

\`\`\`typescript
import { MCPServer } from 'sample-mcp-server';

const server = new MCPServer();
await server.start();
console.log('Server is running!');
\`\`\`

## Prerequisites

- Node.js v18 or higher
- OpenAI API key
`;

    // Mock the callLLM to return JSON response
    const { callLLM } = await import('../../src/lib/llm');
    vi.mocked(callLLM).mockResolvedValueOnce(`{
      "name": "Sample MCP Server",
      "description": "This is a sample MCP server that demonstrates how to integrate with the Model Context Protocol.",
      "Installation_instructions": "To install this server, run: npm install sample-mcp-server",
      "Usage_instructions": "Import the MCPServer class, create an instance, and call the start method.",
      "features": [
        "Real-time data processing",
        "Cross-platform compatibility",
        "Low latency responses"
      ],
      "prerequisites": [
        "Node.js v18 or higher",
        "OpenAI API key"
      ]
    }`);

    // Call the function with our sample README content
    const result = await extractInfoFromReadme(sampleReadme);

    // Verify that callLLM was called
    expect(callLLM).toHaveBeenCalledTimes(1);

    // Assert the expected output matches what we got from the function
    expect(result).toEqual({
      name: 'Sample MCP Server',
      description: 'This is a sample MCP server that demonstrates how to integrate with the Model Context Protocol.',
      Installation_instructions: 'To install this server, run: npm install sample-mcp-server',
      Usage_instructions: 'Import the MCPServer class, create an instance, and call the start method.',
      features: [
        'Real-time data processing',
        'Cross-platform compatibility',
        'Low latency responses'
      ],
      prerequisites: [
        'Node.js v18 or higher',
        'OpenAI API key'
      ]
    });
  });

  it('should handle empty README content gracefully', async () => {
    const result = await extractInfoFromReadme('');

    expect(result).toEqual({
      name: '',
      description: '',
      Installation_instructions: '',
      Usage_instructions: '',
      features: [],
      prerequisites: []
    });
  });

  it('should handle OpenAI API errors gracefully', async () => {
    const sampleReadme = '# Sample README\n\nThis is a test.';
    
    // Simulate an API error
    const { callLLM } = await import('../../src/lib/llm');
    vi.mocked(callLLM).mockRejectedValueOnce(new Error('API Error'));

    const result = await extractInfoFromReadme(sampleReadme);

    expect(result).toEqual({
      name: '',
      description: '',
      Installation_instructions: '',
      Usage_instructions: '',
      features: [],
      prerequisites: []
    });
  });

  it('should handle malformed JSON responses from OpenAI', async () => {
    const sampleReadme = '# Sample README\n\nThis is a test.';
    
    // Mock a malformed JSON response
    const { callLLM } = await import('../../src/lib/llm');
    vi.mocked(callLLM).mockResolvedValueOnce('This is not JSON');

    const result = await extractInfoFromReadme(sampleReadme);

    expect(result).toEqual({
      name: '',
      description: '',
      Installation_instructions: '',
      Usage_instructions: '',
      features: [],
      prerequisites: []
    });
  });
});
