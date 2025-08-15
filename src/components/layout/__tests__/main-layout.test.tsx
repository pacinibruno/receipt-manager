import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { MainLayout, RecipeLayout, HomeLayout } from '../main-layout';
import { SearchFilters } from '@/lib/types';
import { vi } from 'vitest';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
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
import { it } from 'node:test';
import { it } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

// Mock the layout components
vi.mock('../header', () => ({
  Header: ({ onAddRecipe, showAddButton }: any) => (
    <div data-testid="header">
      <button onClick={onAddRecipe} disabled={!showAddButton}>
        Add Recipe
      </button>
    </div>
  ),
}));

vi.mock('../sidebar', () => ({
  Sidebar: ({ selectedFolderId, onFolderSelect, isMobile, isOpen }: any) => (
    <div data-testid={isMobile ? 'mobile-sidebar' : 'desktop-sidebar'}>
      <button onClick={() => onFolderSelect('test-folder')}>
        Select Folder
      </button>
      <div>Selected: {selectedFolderId || 'none'}</div>
      <div>Mobile: {isMobile ? 'yes' : 'no'}</div>
      <div>Open: {isOpen ? 'yes' : 'no'}</div>
    </div>
  ),
  useSidebar: () => ({
    isSidebarOpen: false,
    openSidebar: vi.fn(),
    closeSidebar: vi.fn(),
    toggleSidebar: vi.fn(),
  }),
}));

vi.mock('../breadcrumb', () => ({
  Breadcrumb: () => <div data-testid="breadcrumb">Breadcrumb</div>,
}));

const mockUsePathname = usePathname as any;

describe('MainLayout', () => {
  const defaultProps = {
    children: <div data-testid="main-content">Main Content</div>,
    selectedFolderId: undefined,
    onFolderSelect: vi.fn(),
    searchFilters: {} as SearchFilters,
    onFiltersChange: vi.fn(),
    availableTags: ['tag1', 'tag2'],
    onAddRecipe: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders header and main content', () => {
    mockUsePathname.mockReturnValue('/');
    
    render(<MainLayout {...defaultProps} />);
    
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('main-content')).toBeInTheDocument();
  });

  it('shows sidebar on home page by default', () => {
    mockUsePathname.mockReturnValue('/');
    
    render(<MainLayout {...defaultProps} />);
    
    expect(screen.getByTestId('desktop-sidebar')).toBeInTheDocument();
    expect(screen.getByText('Filters & Folders')).toBeInTheDocument();
  });

  it('hides sidebar when showSidebar is false', () => {
    mockUsePathname.mockReturnValue('/');
    
    render(<MainLayout {...defaultProps} showSidebar={false} />);
    
    expect(screen.queryByTestId('desktop-sidebar')).not.toBeInTheDocument();
    expect(screen.queryByText('Filters & Folders')).not.toBeInTheDocument();
  });

  it('shows breadcrumb on recipe pages by default', () => {
    mockUsePathname.mockReturnValue('/recipe/123');
    
    render(<MainLayout {...defaultProps} />);
    
    expect(screen.getByTestId('breadcrumb')).toBeInTheDocument();
  });

  it('hides breadcrumb when showBreadcrumb is false', () => {
    mockUsePathname.mockReturnValue('/recipe/123');
    
    render(<MainLayout {...defaultProps} showBreadcrumb={false} />);
    
    expect(screen.queryByTestId('breadcrumb')).not.toBeInTheDocument();
  });

  it('hides breadcrumb on home page', () => {
    mockUsePathname.mockReturnValue('/');
    
    render(<MainLayout {...defaultProps} />);
    
    expect(screen.queryByTestId('breadcrumb')).not.toBeInTheDocument();
  });

  it('calls onAddRecipe when header add button is clicked', () => {
    mockUsePathname.mockReturnValue('/');
    const mockOnAddRecipe = vi.fn();
    
    render(<MainLayout {...defaultProps} onAddRecipe={mockOnAddRecipe} />);
    
    fireEvent.click(screen.getByText('Add Recipe'));
    
    expect(mockOnAddRecipe).toHaveBeenCalledTimes(1);
  });

  it('calls onFolderSelect when folder is selected', () => {
    mockUsePathname.mockReturnValue('/');
    const mockOnFolderSelect = vi.fn();
    
    render(<MainLayout {...defaultProps} onFolderSelect={mockOnFolderSelect} />);
    
    // Click on the desktop sidebar button specifically
    const desktopSidebar = screen.getByTestId('desktop-sidebar');
    const selectButton = within(desktopSidebar).getByText('Select Folder');
    fireEvent.click(selectButton);
    
    expect(mockOnFolderSelect).toHaveBeenCalledWith('test-folder');
  });

  it('adjusts grid layout based on sidebar visibility', () => {
    mockUsePathname.mockReturnValue('/');
    
    const { rerender } = render(<MainLayout {...defaultProps} showSidebar={true} />);
    
    let mainContent = screen.getByTestId('main-content').parentElement;
    expect(mainContent).toHaveClass('lg:col-span-3');
    
    rerender(<MainLayout {...defaultProps} showSidebar={false} />);
    
    mainContent = screen.getByTestId('main-content').parentElement;
    expect(mainContent).toHaveClass('lg:col-span-4');
  });

  it('applies custom className', () => {
    mockUsePathname.mockReturnValue('/');
    
    const { container } = render(
      <MainLayout {...defaultProps} className="custom-layout" />
    );
    
    expect(container.firstChild).toHaveClass('custom-layout');
  });

  it('shows mobile sidebar toggle button on home page', () => {
    mockUsePathname.mockReturnValue('/');
    
    render(<MainLayout {...defaultProps} />);
    
    expect(screen.getByText('Filters & Folders')).toBeInTheDocument();
  });

  it('hides mobile sidebar toggle on recipe pages', () => {
    mockUsePathname.mockReturnValue('/recipe/123');
    
    render(<MainLayout {...defaultProps} />);
    
    expect(screen.queryByText('Filters & Folders')).not.toBeInTheDocument();
  });
});

describe('RecipeLayout', () => {
  it('renders with correct layout settings for recipe pages', () => {
    mockUsePathname.mockReturnValue('/recipe/123');
    
    render(
      <RecipeLayout>
        <div data-testid="recipe-content">Recipe Content</div>
      </RecipeLayout>
    );
    
    expect(screen.getByTestId('recipe-content')).toBeInTheDocument();
    expect(screen.getByTestId('breadcrumb')).toBeInTheDocument();
    expect(screen.queryByTestId('desktop-sidebar')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    mockUsePathname.mockReturnValue('/recipe/123');
    
    const { container } = render(
      <RecipeLayout className="custom-recipe-layout">
        <div>Content</div>
      </RecipeLayout>
    );
    
    expect(container.firstChild).toHaveClass('custom-recipe-layout');
  });
});

describe('HomeLayout', () => {
  const homeLayoutProps = {
    children: <div data-testid="home-content">Home Content</div>,
    selectedFolderId: 'folder-1',
    onFolderSelect: vi.fn(),
    searchFilters: { query: 'test' } as SearchFilters,
    onFiltersChange: vi.fn(),
    availableTags: ['tag1', 'tag2'],
    onAddRecipe: vi.fn(),
  };

  it('renders with correct layout settings for home page', () => {
    mockUsePathname.mockReturnValue('/');
    
    render(<HomeLayout {...homeLayoutProps} />);
    
    expect(screen.getByTestId('home-content')).toBeInTheDocument();
    expect(screen.getByTestId('desktop-sidebar')).toBeInTheDocument();
    expect(screen.queryByTestId('breadcrumb')).not.toBeInTheDocument();
  });

  it('passes all props to MainLayout correctly', () => {
    mockUsePathname.mockReturnValue('/');
    const mockOnFolderSelect = vi.fn();
    const mockOnAddRecipe = vi.fn();
    
    render(
      <HomeLayout 
        {...homeLayoutProps}
        onFolderSelect={mockOnFolderSelect}
        onAddRecipe={mockOnAddRecipe}
      />
    );
    
    // Test folder selection
    const desktopSidebar = screen.getByTestId('desktop-sidebar');
    const selectButton = within(desktopSidebar).getByText('Select Folder');
    fireEvent.click(selectButton);
    expect(mockOnFolderSelect).toHaveBeenCalledWith('test-folder');
    
    // Test add recipe
    fireEvent.click(screen.getByText('Add Recipe'));
    expect(mockOnAddRecipe).toHaveBeenCalledTimes(1);
    
    // Check selected folder is displayed in desktop sidebar
    expect(within(desktopSidebar).getByText('Selected: folder-1')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    mockUsePathname.mockReturnValue('/');
    
    const { container } = render(
      <HomeLayout {...homeLayoutProps} className="custom-home-layout" />
    );
    
    expect(container.firstChild).toHaveClass('custom-home-layout');
  });
});