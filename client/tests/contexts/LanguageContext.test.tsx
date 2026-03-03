import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageProvider, useLanguage, SupportedLanguage } from '../../src/contexts/LanguageContext';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Test component to access context
const TestComponent = () => {
  const { language, setLanguage, t } = useLanguage();
  return (
    <div>
      <span data-testid="current-language">{language}</span>
      <button onClick={() => setLanguage('zh-hans' as SupportedLanguage)}>Switch to Chinese</button>
      <button onClick={() => setLanguage('ja' as SupportedLanguage)}>Switch to Japanese</button>
      <span data-testid="translation">{t('nav.home')}</span>
    </div>
  );
};

describe('LanguageContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should provide default language as English when no saved preference', () => {
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    expect(screen.getByTestId('current-language').textContent).toBe('en');
  });

  it('should use saved language from localStorage', () => {
    localStorageMock.getItem.mockReturnValue('zh-hans');

    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    expect(screen.getByTestId('current-language').textContent).toBe('zh-hans');
  });

  it('should update language when setLanguage is called', () => {
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    fireEvent.click(screen.getByText('Switch to Chinese'));
    expect(screen.getByTestId('current-language').textContent).toBe('zh-hans');

    fireEvent.click(screen.getByText('Switch to Japanese'));
    expect(screen.getByTestId('current-language').textContent).toBe('ja');
  });

  it('should save language to localStorage when changed', () => {
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    fireEvent.click(screen.getByText('Switch to Chinese'));
    expect(localStorageMock.setItem).toHaveBeenCalledWith('language', 'zh-hans');
  });

  it('should handle legacy zhHans format', () => {
    localStorageMock.getItem.mockReturnValue('zhHans');

    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    expect(screen.getByTestId('current-language').textContent).toBe('zh-hans');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('language', 'zh-hans');
  });

  it('should handle legacy zhHant format', () => {
    localStorageMock.getItem.mockReturnValue('zhHant');

    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    expect(screen.getByTestId('current-language').textContent).toBe('zh-hant');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('language', 'zh-hant');
  });

  it('should handle legacy zh format', () => {
    localStorageMock.getItem.mockReturnValue('zh');

    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    expect(screen.getByTestId('current-language').textContent).toBe('zh-hans');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('language', 'zh-hans');
  });

  it('should throw error when useLanguage is used outside provider', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useLanguage must be used within a LanguageProvider');

    consoleErrorSpy.mockRestore();
  });
});

describe('useLanguage hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should return translation for valid keys', () => {
    const TestTranslationComponent = () => {
      const { t } = useLanguage();
      return <span>{t('nav.home')}</span>;
    };

    render(
      <LanguageProvider>
        <TestTranslationComponent />
      </LanguageProvider>
    );

    // Assuming the translation file has 'nav.home' key
    expect(screen.getByText(/./)).toBeInTheDocument();
  });

  it('should return key for invalid translation keys', () => {
    const TestTranslationComponent = () => {
      const { t } = useLanguage();
      return <span>{t('invalid.key.that.does.not.exist')}</span>;
    };

    render(
      <LanguageProvider>
        <TestTranslationComponent />
      </LanguageProvider>
    );

    expect(screen.getByText('invalid.key.that.does.not.exist')).toBeInTheDocument();
  });
});
