import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import OpenAI from 'openai';

// Mock the config module
vi.mock('../../src/lib/config', () => ({
  config: {
    openai: {
      apiKey: 'test-api-key',
      baseURL: 'https://test-api-url.com',
      modelName: 'test-model',
      modelCharLimit: 100000,
      apiKeyIsValid: true
    }
  }
}));

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

describe('llm', () => {
  let mockOpenAIInstance: any;
  let mockCreateCompletion: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Re-import to get fresh instances with the mocks applied
    vi.resetModules();
    
    // Import after mocking
    const OpenAI = (await import('openai')).default;
    mockOpenAIInstance = new OpenAI();
    mockCreateCompletion = mockOpenAIInstance.chat.completions.create;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('truncateToModelLimit', () => {
    it('should not truncate content within the limit', async () => {
      const { truncateToModelLimit } = await import('../../src/lib/llm');
      
      const content = 'Short content';
      const result = truncateToModelLimit(content);

      expect(result).toBe(content);
    });

    it('should truncate content that exceeds the limit', async () => {
      const { truncateToModelLimit } = await import('../../src/lib/llm');
      
      // Create content that exceeds the default limit (100000 chars)
      const longContent = 'x'.repeat(150000);
      const result = truncateToModelLimit(longContent);

      // Should truncate to limit minus reserve chars (default 1000)
      expect(result.length).toBe(99000);
    });

    it('should respect custom reserve chars', async () => {
      const { truncateToModelLimit } = await import('../../src/lib/llm');
      
      const longContent = 'x'.repeat(150000);
      const result = truncateToModelLimit(longContent, 5000);

      expect(result.length).toBe(95000);
    });

    it('should handle empty string', async () => {
      const { truncateToModelLimit } = await import('../../src/lib/llm');
      
      const result = truncateToModelLimit('');

      expect(result).toBe('');
    });
  });

  describe('callLLM', () => {
    it('should call OpenAI API and return the response', async () => {
      const { callLLM } = await import('../../src/lib/llm');
      
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'This is the LLM response.'
            }
          }
        ]
      };

      mockCreateCompletion.mockResolvedValueOnce(mockResponse);

      const result = await callLLM('Test prompt');

      expect(mockCreateCompletion).toHaveBeenCalledTimes(1);
      expect(mockCreateCompletion).toHaveBeenCalledWith({
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Test prompt' }
        ],
        model: 'test-model'
      });
      expect(result).toBe('This is the LLM response.');
    });

    it('should use custom system message', async () => {
      const { callLLM } = await import('../../src/lib/llm');
      
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Response'
            }
          }
        ]
      };

      mockCreateCompletion.mockResolvedValueOnce(mockResponse);

      await callLLM('Test prompt', 'Custom system message');

      expect(mockCreateCompletion).toHaveBeenCalledWith({
        messages: [
          { role: 'system', content: 'Custom system message' },
          { role: 'user', content: 'Test prompt' }
        ],
        model: 'test-model'
      });
    });

    it('should return empty string when no content in response', async () => {
      const { callLLM } = await import('../../src/lib/llm');
      
      const mockResponse = {
        choices: [
          {
            message: {
              content: null
            }
          }
        ]
      };

      mockCreateCompletion.mockResolvedValueOnce(mockResponse);

      const result = await callLLM('Test prompt');

      expect(result).toBe('');
    });

    it('should return empty string when choices array is empty', async () => {
      const { callLLM } = await import('../../src/lib/llm');
      
      const mockResponse = {
        choices: []
      };

      mockCreateCompletion.mockResolvedValueOnce(mockResponse);

      const result = await callLLM('Test prompt');

      expect(result).toBe('');
    });

    it('should handle API errors gracefully', async () => {
      const { callLLM } = await import('../../src/lib/llm');
      
      mockCreateCompletion.mockRejectedValueOnce(new Error('API Error'));

      const result = await callLLM('Test prompt');

      expect(result).toBe('');
    });
  });
});
