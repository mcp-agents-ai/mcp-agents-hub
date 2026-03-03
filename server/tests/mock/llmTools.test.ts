import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the callLLM function
vi.mock('../../src/lib/llm', () => ({
  callLLM: vi.fn()
}));

// Mock the config module
vi.mock('../../src/lib/config', () => ({
  config: {
    openai: {
      apiKey: 'test-api-key',
      baseURL: 'https://test-api-url.com',
      modelName: 'test-model',
      apiKeyIsValid: true
    }
  }
}));

describe('llmTools', () => {
  let mockCallLLM: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    
    const llmModule = await import('../../src/lib/llm');
    mockCallLLM = vi.mocked(llmModule.callLLM);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('translateText', () => {
    it('should translate text to target language', async () => {
      mockCallLLM.mockResolvedValueOnce('Translated text');
      
      const { translateText } = await import('../../src/lib/llmTools');
      const result = await translateText('Hello world', 'zh-hans');

      expect(mockCallLLM).toHaveBeenCalledTimes(1);
      expect(result).toBe('Translated text');
    });

    it('should return original text on error', async () => {
      mockCallLLM.mockRejectedValueOnce(new Error('Translation failed'));
      
      const { translateText } = await import('../../src/lib/llmTools');
      const result = await translateText('Hello world', 'zh-hans');

      expect(result).toBe('Hello world');
    });

    it('should trim the translated text', async () => {
      mockCallLLM.mockResolvedValueOnce('  Translated text  ');
      
      const { translateText } = await import('../../src/lib/llmTools');
      const result = await translateText('Hello world', 'zh-hans');

      expect(result).toBe('Translated text');
    });
  });

  describe('determineCategoryWithLLM', () => {
    it('should return valid category from LLM response', async () => {
      mockCallLLM.mockResolvedValueOnce('databases');
      
      const { determineCategoryWithLLM } = await import('../../src/lib/llmTools');
      const result = await determineCategoryWithLLM('PostgreSQL Server', 'A PostgreSQL database connector');

      expect(result).toBe('databases');
    });

    it('should return "other-tools" when both name and description are empty', async () => {
      const { determineCategoryWithLLM } = await import('../../src/lib/llmTools');
      const result = await determineCategoryWithLLM('', '');

      expect(mockCallLLM).not.toHaveBeenCalled();
      expect(result).toBe('other-tools');
    });

    it('should return "other-tools" when LLM returns invalid category', async () => {
      mockCallLLM.mockResolvedValueOnce('invalid-category');
      
      const { determineCategoryWithLLM } = await import('../../src/lib/llmTools');
      const result = await determineCategoryWithLLM('Test Server', 'Test description');

      expect(result).toBe('other-tools');
    });

    it('should return "other-tools" on LLM error', async () => {
      mockCallLLM.mockRejectedValueOnce(new Error('LLM error'));
      
      const { determineCategoryWithLLM } = await import('../../src/lib/llmTools');
      const result = await determineCategoryWithLLM('Test Server', 'Test description');

      expect(result).toBe('other-tools');
    });

    it('should strip quotes from LLM response', async () => {
      mockCallLLM.mockResolvedValueOnce('"databases"');
      
      const { determineCategoryWithLLM } = await import('../../src/lib/llmTools');
      const result = await determineCategoryWithLLM('PostgreSQL Server', 'A PostgreSQL database connector');

      expect(result).toBe('databases');
    });
  });

  describe('LANGUAGES', () => {
    it('should have all supported languages', async () => {
      const { LANGUAGES } = await import('../../src/lib/llmTools');

      expect(LANGUAGES).toHaveProperty('en', 'English');
      expect(LANGUAGES).toHaveProperty('zh-hans', 'Simplified Chinese');
      expect(LANGUAGES).toHaveProperty('zh-hant', 'Traditional Chinese');
      expect(LANGUAGES).toHaveProperty('ja', 'Japanese');
      expect(LANGUAGES).toHaveProperty('es', 'Spanish');
      expect(LANGUAGES).toHaveProperty('de', 'German');
    });
  });
});
