import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response } from 'express';

// Mock dependencies
vi.mock('../../src/lib/mcpServers', () => ({
  refreshCacheIfNeeded: vi.fn(),
  getCleanedServersData: vi.fn()
}));

vi.mock('../../src/lib/githubEnrichment', () => ({
  fetchReadmeContent: vi.fn()
}));

describe('mcp routes', () => {
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
    it('should return servers data for default locale', async () => {
      const mockServers = [
        { mcpId: 'server1', name: 'Server 1', author: 'Author 1', description: 'Description 1', hubId: 'hub1' }
      ];
      const mockCleanedData = [
        { mcpId: 'server1', name: 'Server 1', author: 'Author 1', description: 'Description 1' }
      ];

      vi.resetModules();
      const mcpServersModule = await import('../../src/lib/mcpServers');
      vi.mocked(mcpServersModule.refreshCacheIfNeeded).mockResolvedValueOnce(mockServers);
      vi.mocked(mcpServersModule.getCleanedServersData).mockReturnValueOnce(mockCleanedData as any);

      // Import routes after mocking
      const { default: router } = await import('../../src/routes/mcp');
      
      // Create mock request with query
      mockRequest = { query: {} };

      // Find and call the GET /servers handler
      const handlers = router.stack.filter((layer: any) => layer.route?.methods?.get);
      const serversHandler = handlers.find((layer: any) => layer.route?.path === '/servers');
      
      if (serversHandler) {
        await serversHandler.route.stack[0].handle(mockRequest as Request, mockResponse as Response);
        
        expect(mcpServersModule.refreshCacheIfNeeded).toHaveBeenCalledWith('en');
        expect(mcpServersModule.getCleanedServersData).toHaveBeenCalledWith(mockServers);
        expect(mockJson).toHaveBeenCalledWith(mockCleanedData);
      }
    });

    it('should return servers data for specified locale', async () => {
      const mockServers = [
        { mcpId: 'server1', name: 'Server 1', author: 'Author 1', description: 'Description 1', hubId: 'hub1' }
      ];
      const mockCleanedData = [
        { mcpId: 'server1', name: 'Server 1', author: 'Author 1', description: 'Description 1' }
      ];

      vi.resetModules();
      const mcpServersModule = await import('../../src/lib/mcpServers');
      vi.mocked(mcpServersModule.refreshCacheIfNeeded).mockResolvedValueOnce(mockServers);
      vi.mocked(mcpServersModule.getCleanedServersData).mockReturnValueOnce(mockCleanedData as any);

      // Import routes after mocking
      const { default: router } = await import('../../src/routes/mcp');
      
      mockRequest = { query: { locale: 'zh-hans' } };

      const handlers = router.stack.filter((layer: any) => layer.route?.methods?.get);
      const serversHandler = handlers.find((layer: any) => layer.route?.path === '/servers');
      
      if (serversHandler) {
        await serversHandler.route.stack[0].handle(mockRequest as Request, mockResponse as Response);
        
        expect(mcpServersModule.refreshCacheIfNeeded).toHaveBeenCalledWith('zh-hans');
        expect(mockJson).toHaveBeenCalledWith(mockCleanedData);
      }
    });

    it('should handle errors and return 500', async () => {
      vi.resetModules();
      const mcpServersModule = await import('../../src/lib/mcpServers');
      vi.mocked(mcpServersModule.refreshCacheIfNeeded).mockRejectedValueOnce(new Error('Database error'));

      const { default: router } = await import('../../src/routes/mcp');
      
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

  describe('POST /download', () => {
    it('should return 400 if mcpId is missing', async () => {
      vi.resetModules();
      const { default: router } = await import('../../src/routes/mcp');
      
      mockRequest = { body: {} };

      const handlers = router.stack.filter((layer: any) => layer.route?.methods?.post);
      const downloadHandler = handlers.find((layer: any) => layer.route?.path === '/download');
      
      if (downloadHandler) {
        await downloadHandler.route.stack[0].handle(mockRequest as Request, mockResponse as Response);
        
        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson).toHaveBeenCalledWith({ error: 'mcpId is required' });
      }
    });

    it('should return 404 if server not found', async () => {
      vi.resetModules();
      const mcpServersModule = await import('../../src/lib/mcpServers');
      vi.mocked(mcpServersModule.refreshCacheIfNeeded).mockResolvedValueOnce([]);

      const { default: router } = await import('../../src/routes/mcp');
      
      mockRequest = { body: { mcpId: 'non-existent' } };

      const handlers = router.stack.filter((layer: any) => layer.route?.methods?.post);
      const downloadHandler = handlers.find((layer: any) => layer.route?.path === '/download');
      
      if (downloadHandler) {
        await downloadHandler.route.stack[0].handle(mockRequest as Request, mockResponse as Response);
        
        expect(mockStatus).toHaveBeenCalledWith(404);
        expect(mockJson).toHaveBeenCalledWith({ error: 'Server not found' });
      }
    });

    it('should return server data with README content', async () => {
      const mockServer = {
        mcpId: 'test-server',
        name: 'Test Server',
        author: 'Test Author',
        description: 'Test Description',
        hubId: 'test-hub',
        githubUrl: 'https://github.com/test/repo'
      };

      vi.resetModules();
      const mcpServersModule = await import('../../src/lib/mcpServers');
      const githubModule = await import('../../src/lib/githubEnrichment');
      
      vi.mocked(mcpServersModule.refreshCacheIfNeeded).mockResolvedValueOnce([mockServer]);
      vi.mocked(githubModule.fetchReadmeContent).mockResolvedValueOnce('# Test README');

      const { default: router } = await import('../../src/routes/mcp');
      
      mockRequest = { body: { mcpId: 'test-server' } };

      const handlers = router.stack.filter((layer: any) => layer.route?.methods?.post);
      const downloadHandler = handlers.find((layer: any) => layer.route?.path === '/download');
      
      if (downloadHandler) {
        await downloadHandler.route.stack[0].handle(mockRequest as Request, mockResponse as Response);
        
        expect(mockJson).toHaveBeenCalledWith({
          ...mockServer,
          readmeContent: '# Test README'
        });
      }
    });

    it('should continue even if README fetch fails', async () => {
      const mockServer = {
        mcpId: 'test-server',
        name: 'Test Server',
        author: 'Test Author',
        description: 'Test Description',
        hubId: 'test-hub',
        githubUrl: 'https://github.com/test/repo'
      };

      vi.resetModules();
      const mcpServersModule = await import('../../src/lib/mcpServers');
      const githubModule = await import('../../src/lib/githubEnrichment');
      
      vi.mocked(mcpServersModule.refreshCacheIfNeeded).mockResolvedValueOnce([mockServer]);
      vi.mocked(githubModule.fetchReadmeContent).mockRejectedValueOnce(new Error('Fetch failed'));

      const { default: router } = await import('../../src/routes/mcp');
      
      mockRequest = { body: { mcpId: 'test-server' } };

      const handlers = router.stack.filter((layer: any) => layer.route?.methods?.post);
      const downloadHandler = handlers.find((layer: any) => layer.route?.path === '/download');
      
      if (downloadHandler) {
        await downloadHandler.route.stack[0].handle(mockRequest as Request, mockResponse as Response);
        
        expect(mockJson).toHaveBeenCalledWith({
          ...mockServer,
          readmeContent: ''
        });
      }
    });
  });
});
