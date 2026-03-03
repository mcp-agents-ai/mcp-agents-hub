import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response } from 'express';

// Mock dependencies
vi.mock('../../src/lib/mcpServers', () => ({
  refreshCacheIfNeeded: vi.fn(),
  forceRefreshCache: vi.fn()
}));

vi.mock('../../src/lib/githubEnrichment', () => ({
  enrichServerData: vi.fn(),
  fetchReadmeContent: vi.fn(),
  extractInfoFromReadme: vi.fn()
}));

vi.mock('../../src/lib/llmTools', () => ({
  LANGUAGES: {
    'en': 'English',
    'zh-hans': 'Simplified Chinese',
    'zh-hant': 'Traditional Chinese',
    'ja': 'Japanese',
    'es': 'Spanish',
    'de': 'German'
  },
  translateText: vi.fn(),
  determineCategoryWithLLM: vi.fn()
}));

vi.mock('uuid', () => ({
  v4: vi.fn()
}));

vi.mock('fs/promises', () => ({
  default: {
    writeFile: vi.fn(),
    mkdir: vi.fn()
  },
  writeFile: vi.fn(),
  mkdir: vi.fn()
}));

describe('hub routes', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: ReturnType<typeof vi.fn>;
  let mockStatus: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    
    mockJson = vi.fn();
    mockStatus = vi.fn().mockReturnValue({ json: mockJson });
    
    mockRequest = {};
    mockResponse = {
      json: mockJson,
      status: mockStatus
    };
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /servers', () => {
    it('should return servers data with hubId included', async () => {
      const mockServers = [
        { mcpId: 'server1', name: 'Server 1', hubId: 'hub1' }
      ];

      vi.resetModules();
      const mcpServersModule = await import('../../src/lib/mcpServers');
      vi.mocked(mcpServersModule.refreshCacheIfNeeded).mockResolvedValueOnce(mockServers);

      const { default: router } = await import('../../src/routes/hub');
      
      mockRequest = { query: {} };

      const handlers = router.stack.filter((layer: any) => layer.route?.methods?.get);
      const serversHandler = handlers.find((layer: any) => layer.route?.path === '/servers');
      
      if (serversHandler) {
        await serversHandler.route.stack[0].handle(mockRequest as Request, mockResponse as Response);
        
        expect(mockJson).toHaveBeenCalledWith(mockServers);
      }
    });

    it('should handle errors and return 500', async () => {
      vi.resetModules();
      const mcpServersModule = await import('../../src/lib/mcpServers');
      vi.mocked(mcpServersModule.refreshCacheIfNeeded).mockRejectedValueOnce(new Error('Database error'));

      const { default: router } = await import('../../src/routes/hub');
      
      mockRequest = { query: {} };

      const handlers = router.stack.filter((layer: any) => layer.route?.methods?.get);
      const serversHandler = handlers.find((layer: any) => layer.route?.path === '/servers');
      
      if (serversHandler) {
        await serversHandler.route.stack[0].handle(mockRequest as Request, mockResponse as Response);
        
        expect(mockStatus).toHaveBeenCalledWith(500);
        expect(mockJson).toHaveBeenCalledWith({ error: 'Internal server error' });
      }
    });
  });

  describe('POST /search_servers', () => {
    it('should return filtered and sorted servers', async () => {
      const mockServers = [
        { mcpId: 'server1', name: 'Server 1', hubId: 'hub1', category: 'databases', githubStars: 100, isRecommended: false },
        { mcpId: 'server2', name: 'Server 2', hubId: 'hub2', category: 'tools', githubStars: 200, isRecommended: true },
        { mcpId: 'server3', name: 'Server 3', hubId: 'hub3', category: 'databases', githubStars: 150, isRecommended: false }
      ];

      vi.resetModules();
      const mcpServersModule = await import('../../src/lib/mcpServers');
      vi.mocked(mcpServersModule.refreshCacheIfNeeded).mockResolvedValueOnce(mockServers);

      const { default: router } = await import('../../src/routes/hub');
      
      mockRequest = { 
        body: { 
          categoryKey: 'databases',
          locale: 'en'
        } 
      };

      const handlers = router.stack.filter((layer: any) => layer.route?.methods?.post);
      const searchHandler = handlers.find((layer: any) => layer.route?.path === '/search_servers');
      
      if (searchHandler) {
        await searchHandler.route.stack[0].handle(mockRequest as Request, mockResponse as Response);
        
        const result = mockJson.mock.calls[0][0];
        expect(result.totalItems).toBe(2);
        expect(result.servers.every((s: any) => s.category === 'databases')).toBe(true);
      }
    });

    it('should handle pagination', async () => {
      const mockServers = Array.from({ length: 25 }, (_, i) => ({
        mcpId: `server${i}`,
        name: `Server ${i}`,
        hubId: `hub${i}`,
        githubStars: i
      }));

      vi.resetModules();
      const mcpServersModule = await import('../../src/lib/mcpServers');
      vi.mocked(mcpServersModule.refreshCacheIfNeeded).mockResolvedValueOnce(mockServers);

      const { default: router } = await import('../../src/routes/hub');
      
      mockRequest = { 
        body: { 
          locale: 'en',
          page: 2,
          size: 10
        } 
      };

      const handlers = router.stack.filter((layer: any) => layer.route?.methods?.post);
      const searchHandler = handlers.find((layer: any) => layer.route?.path === '/search_servers');
      
      if (searchHandler) {
        await searchHandler.route.stack[0].handle(mockRequest as Request, mockResponse as Response);
        
        const result = mockJson.mock.calls[0][0];
        expect(result.currentPage).toBe(2);
        expect(result.totalPages).toBe(3);
        expect(result.servers.length).toBe(10);
      }
    });

    it('should return 400 for invalid pagination parameters', async () => {
      vi.resetModules();
      const mcpServersModule = await import('../../src/lib/mcpServers');
      vi.mocked(mcpServersModule.refreshCacheIfNeeded).mockResolvedValueOnce([]);

      const { default: router } = await import('../../src/routes/hub');
      
      mockRequest = { 
        body: { 
          page: 0,
          size: -1
        } 
      };

      const handlers = router.stack.filter((layer: any) => layer.route?.methods?.post);
      const searchHandler = handlers.find((layer: any) => layer.route?.path === '/search_servers');
      
      if (searchHandler) {
        await searchHandler.route.stack[0].handle(mockRequest as Request, mockResponse as Response);
        
        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson).toHaveBeenCalledWith({ error: 'Page and size must be positive integers' });
      }
    });

    it('should filter by search keyword', async () => {
      const mockServers = [
        { mcpId: 'server1', name: 'PostgreSQL Server', hubId: 'hub1', description: 'Database connector' },
        { mcpId: 'server2', name: 'Redis Cache', hubId: 'hub2', description: 'Cache server' },
        { mcpId: 'server3', name: 'MySQL Database', hubId: 'hub3', description: 'MySQL database' }
      ];

      vi.resetModules();
      const mcpServersModule = await import('../../src/lib/mcpServers');
      vi.mocked(mcpServersModule.refreshCacheIfNeeded).mockResolvedValueOnce(mockServers);

      const { default: router } = await import('../../src/routes/hub');
      
      mockRequest = { 
        body: { 
          locale: 'en',
          search_for: 'database'
        } 
      };

      const handlers = router.stack.filter((layer: any) => layer.route?.methods?.post);
      const searchHandler = handlers.find((layer: any) => layer.route?.path === '/search_servers');
      
      if (searchHandler) {
        await searchHandler.route.stack[0].handle(mockRequest as Request, mockResponse as Response);
        
        const result = mockJson.mock.calls[0][0];
        expect(result.totalItems).toBe(2);
      }
    });
  });

  describe('GET /servers/:hubId', () => {
    it('should return 404 if server not found', async () => {
      vi.resetModules();
      const mcpServersModule = await import('../../src/lib/mcpServers');
      vi.mocked(mcpServersModule.refreshCacheIfNeeded).mockResolvedValueOnce([]);

      const { default: router } = await import('../../src/routes/hub');
      
      mockRequest = { params: { hubId: 'non-existent' } };

      const handlers = router.stack.filter((layer: any) => layer.route?.methods?.get);
      const serverByIdHandler = handlers.find((layer: any) => layer.route?.path === '/servers/:hubId');
      
      if (serverByIdHandler) {
        await serverByIdHandler.route.stack[0].handle(mockRequest as Request, mockResponse as Response);
        
        expect(mockStatus).toHaveBeenCalledWith(404);
        expect(mockJson).toHaveBeenCalledWith({ error: 'Server not found' });
      }
    });

    it('should return enriched server data', async () => {
      const mockServer = {
        mcpId: 'test-server',
        name: 'Test Server',
        hubId: 'test-hub'
      };
      const mockEnrichedServer = {
        ...mockServer,
        readmeContent: '# README'
      };

      vi.resetModules();
      const mcpServersModule = await import('../../src/lib/mcpServers');
      const githubModule = await import('../../src/lib/githubEnrichment');
      
      vi.mocked(mcpServersModule.refreshCacheIfNeeded).mockResolvedValueOnce([mockServer]);
      vi.mocked(githubModule.enrichServerData).mockResolvedValueOnce(mockEnrichedServer);

      const { default: router } = await import('../../src/routes/hub');
      
      mockRequest = { params: { hubId: 'test-hub' }, query: {} };

      const handlers = router.stack.filter((layer: any) => layer.route?.methods?.get);
      const serverByIdHandler = handlers.find((layer: any) => layer.route?.path === '/servers/:hubId');
      
      if (serverByIdHandler) {
        await serverByIdHandler.route.stack[0].handle(mockRequest as Request, mockResponse as Response);
        
        expect(mockJson).toHaveBeenCalledWith(mockEnrichedServer);
      }
    });
  });

  describe('GET /server_categories', () => {
    it('should return all categories', async () => {
      vi.resetModules();
      const { default: router } = await import('../../src/routes/hub');
      
      mockRequest = {};

      const handlers = router.stack.filter((layer: any) => layer.route?.methods?.get);
      const categoriesHandler = handlers.find((layer: any) => layer.route?.path === '/server_categories');
      
      if (categoriesHandler) {
        await categoriesHandler.route.stack[0].handle(mockRequest as Request, mockResponse as Response);
        
        const categories = mockJson.mock.calls[0][0];
        expect(categories).toContain('databases');
        expect(categories).toContain('other-tools');
        expect(Array.isArray(categories)).toBe(true);
      }
    });
  });
});
