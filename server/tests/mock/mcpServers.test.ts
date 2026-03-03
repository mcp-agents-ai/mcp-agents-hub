import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';

// Mock fs/promises and path modules
vi.mock('fs/promises', () => ({
  default: {
    access: vi.fn(),
    readdir: vi.fn(),
    readFile: vi.fn()
  },
  access: vi.fn(),
  readdir: vi.fn(),
  readFile: vi.fn()
}));

// We need to mock the module before importing
const mockFs = vi.mocked(fs);

// Import the module after mocking
const { loadMcpServersData, getCleanedServersData } = await import('../../src/lib/mcpServers');

describe('mcpServers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('loadMcpServersData', () => {
    it('should load server data from JSON files', async () => {
      const mockServerData = {
        mcpId: 'test-server',
        name: 'Test Server',
        author: 'Test Author',
        description: 'A test server',
        hubId: 'test-hub'
      };

      mockFs.access.mockResolvedValueOnce(undefined);
      mockFs.readdir.mockResolvedValueOnce(['server1.json'] as any);
      mockFs.readFile.mockResolvedValueOnce(JSON.stringify(mockServerData));

      const result = await loadMcpServersData('en');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockServerData);
    });

    it('should return empty array when directory does not exist', async () => {
      mockFs.access.mockRejectedValueOnce(new Error('Directory not found'));
      mockFs.readdir.mockResolvedValueOnce([]);

      const result = await loadMcpServersData('non-existent-locale');

      // Falls back to default locale directory
      expect(result).toEqual([]);
    });

    it('should skip non-JSON files', async () => {
      mockFs.access.mockResolvedValueOnce(undefined);
      mockFs.readdir.mockResolvedValueOnce(['server1.json', 'readme.txt', 'data.csv'] as any);
      mockFs.readFile.mockResolvedValueOnce(JSON.stringify({
        mcpId: 'test-server',
        name: 'Test Server',
        author: 'Test Author',
        description: 'A test server',
        hubId: 'test-hub'
      }));

      const result = await loadMcpServersData('en');

      expect(result).toHaveLength(1);
      expect(mockFs.readFile).toHaveBeenCalledTimes(1);
    });

    it('should handle malformed JSON files gracefully', async () => {
      mockFs.access.mockResolvedValueOnce(undefined);
      mockFs.readdir.mockResolvedValueOnce(['valid.json', 'invalid.json'] as any);
      mockFs.readFile
        .mockResolvedValueOnce(JSON.stringify({
          mcpId: 'valid-server',
          name: 'Valid Server',
          author: 'Test Author',
          description: 'A valid server',
          hubId: 'test-hub'
        }))
        .mockResolvedValueOnce('invalid json content');

      const result = await loadMcpServersData('en');

      // Should still return the valid server
      expect(result).toHaveLength(1);
      expect(result[0].mcpId).toBe('valid-server');
    });

    it('should use default locale when unsupported locale is provided', async () => {
      mockFs.access.mockResolvedValueOnce(undefined);
      mockFs.readdir.mockResolvedValueOnce(['server1.json'] as any);
      mockFs.readFile.mockResolvedValueOnce(JSON.stringify({
        mcpId: 'test-server',
        name: 'Test Server',
        author: 'Test Author',
        description: 'A test server',
        hubId: 'test-hub'
      }));

      const result = await loadMcpServersData('fr');

      // Should fallback to English
      expect(result).toBeDefined();
    });
  });

  describe('getCleanedServersData', () => {
    it('should remove hubId from server data', () => {
      const serversData = [
        {
          mcpId: 'server1',
          name: 'Server 1',
          author: 'Author 1',
          description: 'Description 1',
          hubId: 'hub1'
        },
        {
          mcpId: 'server2',
          name: 'Server 2',
          author: 'Author 2',
          description: 'Description 2',
          hubId: 'hub2'
        }
      ];

      const result = getCleanedServersData(serversData);

      expect(result).toHaveLength(2);
      expect(result[0]).not.toHaveProperty('hubId');
      expect(result[1]).not.toHaveProperty('hubId');
      expect(result[0].mcpId).toBe('server1');
      expect(result[1].mcpId).toBe('server2');
    });

    it('should preserve other properties', () => {
      const serversData = [
        {
          mcpId: 'server1',
          name: 'Server 1',
          author: 'Author 1',
          description: 'Description 1',
          hubId: 'hub1',
          category: 'tools',
          tags: ['tag1', 'tag2'],
          githubStars: 100
        }
      ];

      const result = getCleanedServersData(serversData);

      expect(result[0]).toEqual({
        mcpId: 'server1',
        name: 'Server 1',
        author: 'Author 1',
        description: 'Description 1',
        category: 'tools',
        tags: ['tag1', 'tag2'],
        githubStars: 100
      });
    });

    it('should handle empty array', () => {
      const result = getCleanedServersData([]);
      expect(result).toEqual([]);
    });
  });
});
