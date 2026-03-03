import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchBar } from '../../src/components/SearchBar';

// Mock the useLanguage hook
vi.mock('../../src/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'home.search.placeholder': 'Search MCP servers...',
        'home.search.button': 'Search'
      };
      return translations[key] || key;
    },
    language: 'en'
  })
}));

describe('SearchBar', () => {
  const mockOnChange = vi.fn();
  const mockOnSearch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render input field and search button', () => {
    render(
      <SearchBar 
        value="" 
        onChange={mockOnChange} 
        onSearch={mockOnSearch} 
      />
    );

    expect(screen.getByPlaceholderText('Search MCP servers...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
  });

  it('should display initial value', () => {
    render(
      <SearchBar 
        value="initial query" 
        onChange={mockOnChange} 
        onSearch={mockOnSearch} 
      />
    );

    expect(screen.getByDisplayValue('initial query')).toBeInTheDocument();
  });

  it('should call onChange when input value changes', () => {
    render(
      <SearchBar 
        value="" 
        onChange={mockOnChange} 
        onSearch={mockOnSearch} 
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test query' } });

    expect(mockOnChange).toHaveBeenCalledWith('test query');
  });

  it('should call onSearch when button is clicked', () => {
    render(
      <SearchBar 
        value="test query" 
        onChange={mockOnChange} 
        onSearch={mockOnSearch} 
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Search' }));

    expect(mockOnSearch).toHaveBeenCalledWith('test query');
  });

  it('should call onSearch when Enter key is pressed', () => {
    render(
      <SearchBar 
        value="test query" 
        onChange={mockOnChange} 
        onSearch={mockOnSearch} 
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockOnSearch).toHaveBeenCalledWith('test query');
  });

  it('should auto-trigger search when input is cleared', () => {
    render(
      <SearchBar 
        value="existing query" 
        onChange={mockOnChange} 
        onSearch={mockOnSearch} 
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '' } });

    expect(mockOnSearch).toHaveBeenCalledWith('');
  });

  it('should not auto-trigger search when input has value', () => {
    render(
      <SearchBar 
        value="" 
        onChange={mockOnChange} 
        onSearch={mockOnSearch} 
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test' } });

    // onSearch should not be called when input has value
    expect(mockOnSearch).not.toHaveBeenCalled();
  });

  it('should update internal state when prop value changes', () => {
    const { rerender } = render(
      <SearchBar 
        value="initial" 
        onChange={mockOnChange} 
        onSearch={mockOnSearch} 
      />
    );

    expect(screen.getByDisplayValue('initial')).toBeInTheDocument();

    rerender(
      <SearchBar 
        value="updated" 
        onChange={mockOnChange} 
        onSearch={mockOnSearch} 
      />
    );

    expect(screen.getByDisplayValue('updated')).toBeInTheDocument();
  });
});
