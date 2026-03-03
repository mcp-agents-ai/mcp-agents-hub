import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ServerCard } from '../../src/components/ServerCard';
import { MemoryRouter } from 'react-router-dom';

// Mock the useLanguage hook
vi.mock('../../src/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'server.by': 'by',
        'server.recommended': 'Recommended',
        'server.viewOnGithub': 'View on GitHub'
      };
      return translations[key] || key;
    },
    language: 'en'
  })
}));

const mockServer = {
  mcpId: 'test-server',
  githubUrl: 'https://github.com/test/repo',
  name: 'Test Server',
  author: 'Test Author',
  description: 'A test server for unit testing',
  codiconIcon: '',
  logoUrl: '',
  category: 'databases',
  tags: ['test', 'database', 'mock'],
  requiresApiKey: false,
  isRecommended: true,
  githubStars: 1234,
  downloadCount: 5678,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-02',
  hubId: 'test-hub-id'
};

const renderWithRouter = (component: React.ReactNode) => {
  return render(
    <MemoryRouter>
      {component}
    </MemoryRouter>
  );
};

describe('ServerCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render server name and author', () => {
    renderWithRouter(<ServerCard server={mockServer} />);
    
    expect(screen.getByText('Test Server')).toBeInTheDocument();
    expect(screen.getByText(/by Test Author/)).toBeInTheDocument();
  });

  it('should render server description', () => {
    renderWithRouter(<ServerCard server={mockServer} />);
    
    expect(screen.getByText('A test server for unit testing')).toBeInTheDocument();
  });

  it('should render recommended badge for recommended servers', () => {
    renderWithRouter(<ServerCard server={mockServer} />);
    
    expect(screen.getByText('Recommended')).toBeInTheDocument();
  });

  it('should not render recommended badge for non-recommended servers', () => {
    const nonRecommendedServer = { ...mockServer, isRecommended: false };
    renderWithRouter(<ServerCard server={nonRecommendedServer} />);
    
    expect(screen.queryByText('Recommended')).not.toBeInTheDocument();
  });

  it('should render tags', () => {
    renderWithRouter(<ServerCard server={mockServer} />);
    
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('database')).toBeInTheDocument();
    expect(screen.getByText('mock')).toBeInTheDocument();
  });

  it('should render GitHub stars and download count', () => {
    renderWithRouter(<ServerCard server={mockServer} />);
    
    expect(screen.getByText('1,234')).toBeInTheDocument();
    expect(screen.getByText('5,678')).toBeInTheDocument();
  });

  it('should render View on GitHub link', () => {
    renderWithRouter(<ServerCard server={mockServer} />);
    
    // Use getAllByRole since there are multiple links (card link + github link)
    const githubLinks = screen.getAllByRole('link', { name: /view on github/i });
    const githubLink = githubLinks.find(link => link.getAttribute('href') === 'https://github.com/test/repo');
    
    expect(githubLink).toBeDefined();
    expect(githubLink).toHaveAttribute('href', 'https://github.com/test/repo');
    expect(githubLink).toHaveAttribute('target', '_blank');
  });

  it('should render logo image when logoUrl is provided', () => {
    const serverWithLogo = { ...mockServer, logoUrl: 'https://example.com/logo.png' };
    renderWithRouter(<ServerCard server={serverWithLogo} />);
    
    const logo = screen.getByRole('img');
    expect(logo).toHaveAttribute('src', 'https://example.com/logo.png');
    expect(logo).toHaveAttribute('alt', 'Test Server');
  });

  it('should render default icon when logoUrl is not provided', () => {
    renderWithRouter(<ServerCard server={mockServer} />);
    
    // Should not have an img element
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
