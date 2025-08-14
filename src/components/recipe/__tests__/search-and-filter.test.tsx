import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchAndFilter } from '../search-and-filter';
import { SearchFilters } from '@/lib/types';
import { vi } from 'vitest';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

const mockAvailableTags = ['dessert', 'quick', 'vegetarian', 'gluten-free', 'healthy'];

describe('SearchAndFilter', () => {
  const defaultProps = {
    availableTags: mockAvailableTags,
    filters: {} as SearchFilters,
    onFiltersChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input with placeholder', () => {
    render(<SearchAndFilter {...defaultProps} />);
    
    expect(screen.getByPlaceholderText('Search recipes...')).toBeInTheDocument();
  });

  it('renders custom placeholder when provided', () => {
    render(
      <SearchAndFilter 
        {...defaultProps} 
        placeholder="Find your recipe..." 
      />
    );
    
    expect(screen.getByPlaceholderText('Find your recipe...')).toBeInTheDocument();
  });

  it('calls onFiltersChange when search query changes', async () => {
    render(<SearchAndFilter {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search recipes...');
    fireEvent.change(searchInput, { target: { value: 'pasta' } });
    
    // Wait for debounce
    await waitFor(() => {
      expect(defaultProps.onFiltersChange).toHaveBeenCalledWith({
        query: 'pasta',
      });
    }, { timeout: 500 });
  });

  it('clears search query when X button is clicked', async () => {
    render(<SearchAndFilter {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search recipes...');
    fireEvent.change(searchInput, { target: { value: 'pasta' } });
    
    // Wait for clear button to appear
    await waitFor(() => {
      const clearButton = screen.getByRole('button', { name: /clear search/i });
      fireEvent.click(clearButton);
    });
    
    expect(searchInput).toHaveValue('');
  });

  it('displays available tags in dropdown', async () => {
    render(<SearchAndFilter {...defaultProps} />);
    
    const tagsButton = screen.getByRole('button', { name: /tags/i });
    fireEvent.click(tagsButton);
    
    await waitFor(() => {
      mockAvailableTags.forEach(tag => {
        expect(screen.getByText(tag)).toBeInTheDocument();
      });
    });
  });

  it('handles tag selection and deselection', async () => {
    render(<SearchAndFilter {...defaultProps} />);
    
    const tagsButton = screen.getByRole('button', { name: /tags/i });
    fireEvent.click(tagsButton);
    
    await waitFor(() => {
      const dessertTag = screen.getByText('dessert');
      fireEvent.click(dessertTag);
    });
    
    expect(defaultProps.onFiltersChange).toHaveBeenCalledWith({
      tags: ['dessert'],
    });
  });

  it('shows selected tag count in tags button', async () => {
    const filtersWithTags = { tags: ['dessert', 'quick'] };
    render(
      <SearchAndFilter 
        {...defaultProps} 
        filters={filtersWithTags} 
      />
    );
    
    const tagsButton = screen.getByRole('button', { name: /tags/i });
    expect(tagsButton).toHaveTextContent('2');
  });

  it('displays difficulty filter options', async () => {
    render(<SearchAndFilter {...defaultProps} />);
    
    const difficultyButton = screen.getByRole('button', { name: /difficulty/i });
    fireEvent.click(difficultyButton);
    
    await waitFor(() => {
      expect(screen.getByText('Easy')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
      expect(screen.getByText('Hard')).toBeInTheDocument();
    });
  });

  it('handles difficulty selection', async () => {
    render(<SearchAndFilter {...defaultProps} />);
    
    const difficultyButton = screen.getByRole('button', { name: /difficulty/i });
    fireEvent.click(difficultyButton);
    
    await waitFor(() => {
      const easyOption = screen.getByText('Easy');
      fireEvent.click(easyOption);
    });
    
    expect(defaultProps.onFiltersChange).toHaveBeenCalledWith({
      difficulty: ['Easy'],
    });
  });

  it('handles prep time filter selection', async () => {
    render(<SearchAndFilter {...defaultProps} />);
    
    const prepTimeSelect = screen.getByRole('combobox', { name: /prep time/i });
    fireEvent.click(prepTimeSelect);
    
    await waitFor(() => {
      const option = screen.getByText('≤ 30 min');
      fireEvent.click(option);
    });
    
    expect(defaultProps.onFiltersChange).toHaveBeenCalledWith({
      prepTimeMax: 30,
    });
  });

  it('handles cook time filter selection', async () => {
    render(<SearchAndFilter {...defaultProps} />);
    
    const cookTimeSelect = screen.getByRole('combobox', { name: /cook time/i });
    fireEvent.click(cookTimeSelect);
    
    await waitFor(() => {
      const option = screen.getByText('≤ 1 hour');
      fireEvent.click(option);
    });
    
    expect(defaultProps.onFiltersChange).toHaveBeenCalledWith({
      cookTimeMax: 60,
    });
  });

  it('shows clear all button when filters are active', () => {
    const filtersWithData = {
      query: 'pasta',
      tags: ['dessert'],
      difficulty: ['Easy'],
    };
    
    render(
      <SearchAndFilter 
        {...defaultProps} 
        filters={filtersWithData} 
      />
    );
    
    expect(screen.getByRole('button', { name: /clear all/i })).toBeInTheDocument();
  });

  it('clears all filters when clear all is clicked', () => {
    const filtersWithData = {
      query: 'pasta',
      tags: ['dessert'],
      difficulty: ['Easy'],
    };
    
    render(
      <SearchAndFilter 
        {...defaultProps} 
        filters={filtersWithData} 
      />
    );
    
    const clearAllButton = screen.getByRole('button', { name: /clear all/i });
    fireEvent.click(clearAllButton);
    
    expect(defaultProps.onFiltersChange).toHaveBeenCalledWith({});
  });

  it('displays active filter badges', () => {
    const filtersWithTags = {
      tags: ['dessert', 'quick'],
      difficulty: ['Easy'],
    };
    
    render(
      <SearchAndFilter 
        {...defaultProps} 
        filters={filtersWithTags} 
      />
    );
    
    // Should show tag badges
    expect(screen.getByText('dessert')).toBeInTheDocument();
    expect(screen.getByText('quick')).toBeInTheDocument();
    expect(screen.getByText('Easy')).toBeInTheDocument();
  });

  it('removes individual filter badges when clicked', () => {
    const filtersWithTags = {
      tags: ['dessert', 'quick'],
    };
    
    render(
      <SearchAndFilter 
        {...defaultProps} 
        filters={filtersWithTags} 
      />
    );
    
    const dessertBadge = screen.getByText('dessert');
    fireEvent.click(dessertBadge);
    
    expect(defaultProps.onFiltersChange).toHaveBeenCalledWith({
      tags: ['quick'],
    });
  });

  it('shows correct active filter count', () => {
    const filtersWithMultiple = {
      query: 'pasta',
      tags: ['dessert'],
      difficulty: ['Easy'],
      prepTimeMax: 30,
    };
    
    render(
      <SearchAndFilter 
        {...defaultProps} 
        filters={filtersWithMultiple} 
      />
    );
    
    const clearAllButton = screen.getByRole('button', { name: /clear all/i });
    expect(clearAllButton).toHaveTextContent('4');
  });

  it('handles empty tags list', async () => {
    render(<SearchAndFilter {...defaultProps} availableTags={[]} />);
    
    const tagsButton = screen.getByRole('button', { name: /tags/i });
    fireEvent.click(tagsButton);
    
    await waitFor(() => {
      expect(screen.getByText('No tags available')).toBeInTheDocument();
    });
  });

  it('initializes with provided filters', () => {
    const initialFilters = {
      query: 'initial search',
      tags: ['dessert'],
      difficulty: ['Medium'],
      prepTimeMax: 60,
    };
    
    render(
      <SearchAndFilter 
        {...defaultProps} 
        filters={initialFilters} 
      />
    );
    
    const searchInput = screen.getByPlaceholderText('Search recipes...');
    expect(searchInput).toHaveValue('initial search');
  });
});