import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar, useSidebar } from '../sidebar';
import { SearchFilters } from '@/lib/types';
import { vi } from 'vitest';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
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

// Mock the folder and search components
vi.mock('@/components/folder/folder-tree-with-dnd', () => ({
  FolderTreeWithDnd: ({ selectedFolderId, onFolderSelect }: any) => (
    <div data-testid="folder-tree">
      <button onClick={() => onFolderSelect('folder-1')}>
        Select Folder 1
      </button>
      <div>Selected: {selectedFolderId || 'none'}</div>
    </div>
  ),
}));

vi.mock('@/components/recipe/search-and-filter', () => ({
  SearchAndFilter: ({ filters, onFiltersChange, placeholder }: any) => (
    <div data-testid="search-filter">
      <input
        placeholder={placeholder}
        value={filters.query || ''}
        onChange={(e) => onFiltersChange({ ...filters, query: e.target.value })}
      />
      <div>Current query: {filters.query || 'none'}</div>
    </div>
  ),
}));

describe('Sidebar', () => {
  const defaultProps = {
    selectedFolderId: undefined,
    onFolderSelect: vi.fn(),
    searchFilters: {} as SearchFilters,
    onFiltersChange: vi.fn(),
    availableTags: ['tag1', 'tag2'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search and filter section', () => {
    render(<Sidebar {...defaultProps} />);
    
    expect(screen.getByText('Search & Filter')).toBeInTheDocument();
    expect(screen.getByTestId('search-filter')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search recipes...')).toBeInTheDocument();
  });

  it('renders folder tree section', () => {
    render(<Sidebar {...defaultProps} />);
    
    expect(screen.getByText('Folders')).toBeInTheDocument();
    expect(screen.getByTestId('folder-tree')).toBeInTheDocument();
  });

  it('displays folder error when provided', () => {
    render(
      <Sidebar 
        {...defaultProps} 
        foldersError="Failed to load folders" 
      />
    );
    
    expect(screen.getByText('Error loading folders: Failed to load folders')).toBeInTheDocument();
    expect(screen.queryByTestId('folder-tree')).not.toBeInTheDocument();
  });

  it('calls onFolderSelect when folder is selected', () => {
    const mockOnFolderSelect = vi.fn();
    
    render(
      <Sidebar 
        {...defaultProps} 
        onFolderSelect={mockOnFolderSelect}
      />
    );
    
    fireEvent.click(screen.getByText('Select Folder 1'));
    
    expect(mockOnFolderSelect).toHaveBeenCalledWith('folder-1');
  });

  it('calls onFiltersChange when search input changes', () => {
    const mockOnFiltersChange = vi.fn();
    
    render(
      <Sidebar 
        {...defaultProps} 
        onFiltersChange={mockOnFiltersChange}
      />
    );
    
    const searchInput = screen.getByPlaceholderText('Search recipes...');
    fireEvent.change(searchInput, { target: { value: 'pasta' } });
    
    expect(mockOnFiltersChange).toHaveBeenCalledWith({ query: 'pasta' });
  });

  it('displays selected folder in folder tree', () => {
    render(
      <Sidebar 
        {...defaultProps} 
        selectedFolderId="folder-1"
      />
    );
    
    expect(screen.getByText('Selected: folder-1')).toBeInTheDocument();
  });

  it('displays current search query', () => {
    const searchFilters = { query: 'chicken' };
    
    render(
      <Sidebar 
        {...defaultProps} 
        searchFilters={searchFilters}
      />
    );
    
    expect(screen.getByText('Current query: chicken')).toBeInTheDocument();
  });

  it('renders as mobile sidebar when isMobile is true', () => {
    render(
      <Sidebar 
        {...defaultProps} 
        isMobile={true}
        isOpen={true}
      />
    );
    
    expect(screen.getByText('Navigation')).toBeInTheDocument();
  });

  it('calls onClose when mobile sidebar close button is clicked', () => {
    const mockOnClose = vi.fn();
    
    render(
      <Sidebar 
        {...defaultProps} 
        isMobile={true}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    
    // Find the close button by its accessible name
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    const { container } = render(
      <Sidebar 
        {...defaultProps} 
        className="custom-sidebar"
      />
    );
    
    expect(container.firstChild).toHaveClass('custom-sidebar');
  });
});

describe('useSidebar hook', () => {
  function TestComponent() {
    const { isSidebarOpen, openSidebar, closeSidebar, toggleSidebar } = useSidebar();
    
    return (
      <div>
        <div data-testid="sidebar-state">{isSidebarOpen ? 'open' : 'closed'}</div>
        <button onClick={openSidebar}>Open</button>
        <button onClick={closeSidebar}>Close</button>
        <button onClick={toggleSidebar}>Toggle</button>
      </div>
    );
  }

  it('initializes with sidebar closed', () => {
    render(<TestComponent />);
    
    expect(screen.getByTestId('sidebar-state')).toHaveTextContent('closed');
  });

  it('opens sidebar when openSidebar is called', () => {
    render(<TestComponent />);
    
    fireEvent.click(screen.getByText('Open'));
    
    expect(screen.getByTestId('sidebar-state')).toHaveTextContent('open');
  });

  it('closes sidebar when closeSidebar is called', () => {
    render(<TestComponent />);
    
    // First open it
    fireEvent.click(screen.getByText('Open'));
    expect(screen.getByTestId('sidebar-state')).toHaveTextContent('open');
    
    // Then close it
    fireEvent.click(screen.getByText('Close'));
    expect(screen.getByTestId('sidebar-state')).toHaveTextContent('closed');
  });

  it('toggles sidebar state when toggleSidebar is called', () => {
    render(<TestComponent />);
    
    // Initially closed
    expect(screen.getByTestId('sidebar-state')).toHaveTextContent('closed');
    
    // Toggle to open
    fireEvent.click(screen.getByText('Toggle'));
    expect(screen.getByTestId('sidebar-state')).toHaveTextContent('open');
    
    // Toggle to closed
    fireEvent.click(screen.getByText('Toggle'));
    expect(screen.getByTestId('sidebar-state')).toHaveTextContent('closed');
  });
});