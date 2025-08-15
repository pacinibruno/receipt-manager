import React from 'react';
import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { Breadcrumb, SimpleBreadcrumb } from '../breadcrumb';
import { vi } from 'vitest';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

// Mock the hooks
vi.mock('@/hooks/use-folders', () => ({
  useFolders: vi.fn(),
}));

vi.mock('@/hooks/use-recipes', () => ({
  useRecipes: vi.fn(),
}));

const mockUsePathname = usePathname as any;

// Import the mocked hooks
import { useFolders } from '@/hooks/use-folders';
import { useRecipes } from '@/hooks/use-recipes';
import { it } from 'zod/v4/locales';
import { it } from 'zod/v4/locales';
import { it } from 'zod/v4/locales';
import { it } from 'zod/v4/locales';
import { it } from 'zod/v4/locales';
import { describe } from 'node:test';
import { it } from 'zod/v4/locales';
import { it } from 'zod/v4/locales';
import { it } from 'zod/v4/locales';
import { it } from 'zod/v4/locales';
import { it } from 'zod/v4/locales';
import { it } from 'zod/v4/locales';
import { it } from 'zod/v4/locales';
import { it } from 'zod/v4/locales';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

const mockUseFolders = useFolders as any;
const mockUseRecipes = useRecipes as any;

describe('Breadcrumb', () => {
  const mockFolders = [
    { id: 'folder-1', name: 'Main Dishes', parentId: undefined },
    { id: 'folder-2', name: 'Italian', parentId: 'folder-1' },
  ];

  const mockRecipes = [
    {
      id: 'recipe-1',
      title: 'Spaghetti Carbonara',
      folderId: 'folder-2',
      description: 'Classic Italian pasta',
      ingredients: [],
      instructions: [],
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'recipe-2',
      title: 'Chicken Salad',
      folderId: undefined,
      description: 'Fresh salad',
      ingredients: [],
      instructions: [],
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseFolders.mockReturnValue({
      folders: mockFolders,
      loading: false,
      error: null,
      addFolder: vi.fn(),
      editFolder: vi.fn(),
      removeFolder: vi.fn(),
      moveFolder: vi.fn(),
    });
    mockUseRecipes.mockReturnValue({
      recipes: mockRecipes,
      loading: false,
      error: null,
      addRecipe: vi.fn(),
      editRecipe: vi.fn(),
      removeRecipe: vi.fn(),
      fetchRecipe: vi.fn(),
      searchRecipeList: vi.fn(),
      searchResults: null,
      clearSearchResults: vi.fn(),
    });
  });

  it('returns null when on home page', () => {
    mockUsePathname.mockReturnValue('/');
    
    const { container } = render(<Breadcrumb />);
    
    expect(container.firstChild).toBeNull();
  });

  it('shows breadcrumb for recipe without folder', () => {
    mockUsePathname.mockReturnValue('/recipe/recipe-2');
    
    render(<Breadcrumb />);
    
    expect(screen.getByText('All Recipes')).toBeInTheDocument();
    expect(screen.getByText('Chicken Salad')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'All Recipes' })).toHaveAttribute('href', '/');
  });

  it('shows breadcrumb for recipe with folder hierarchy', () => {
    mockUsePathname.mockReturnValue('/recipe/recipe-1');
    
    render(<Breadcrumb />);
    
    expect(screen.getByText('All Recipes')).toBeInTheDocument();
    expect(screen.getByText('Main Dishes')).toBeInTheDocument();
    expect(screen.getByText('Italian')).toBeInTheDocument();
    expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument();
    
    // Check links
    expect(screen.getByRole('link', { name: 'All Recipes' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Main Dishes' })).toHaveAttribute('href', '/?folder=folder-1');
    expect(screen.getByRole('link', { name: 'Italian' })).toHaveAttribute('href', '/?folder=folder-2');
  });

  it('shows icons when showIcons is true', () => {
    mockUsePathname.mockReturnValue('/recipe/recipe-2');
    
    render(<Breadcrumb showIcons={true} />);
    
    // Check for icon presence (icons are rendered as SVG elements)
    const homeIcon = screen.getByText('All Recipes').parentElement?.querySelector('svg');
    const recipeIcon = screen.getByText('Chicken Salad').parentElement?.querySelector('svg');
    
    expect(homeIcon).toBeInTheDocument();
    expect(recipeIcon).toBeInTheDocument();
  });

  it('hides icons when showIcons is false', () => {
    mockUsePathname.mockReturnValue('/recipe/recipe-2');
    
    render(<Breadcrumb showIcons={false} />);
    
    // Icons should not be present
    const homeIcon = screen.getByText('All Recipes').parentElement?.querySelector('svg');
    const recipeIcon = screen.getByText('Chicken Salad').parentElement?.querySelector('svg');
    
    expect(homeIcon).not.toBeInTheDocument();
    expect(recipeIcon).not.toBeInTheDocument();
  });

  it('handles recipe not found', () => {
    mockUsePathname.mockReturnValue('/recipe/non-existent');
    
    const { container } = render(<Breadcrumb />);
    
    // Should only show home breadcrumb, so component returns null
    expect(container.firstChild).toBeNull();
  });

  it('applies custom className', () => {
    mockUsePathname.mockReturnValue('/recipe/recipe-2');
    
    const { container } = render(<Breadcrumb className="custom-breadcrumb" />);
    
    expect(container.firstChild).toHaveClass('custom-breadcrumb');
  });

  it('shows chevron separators between items', () => {
    mockUsePathname.mockReturnValue('/recipe/recipe-1');
    
    const { container } = render(<Breadcrumb />);
    
    // Should have chevron icons as separators - check for SVG elements with chevron class
    const chevrons = container.querySelectorAll('.lucide-chevron-right');
    expect(chevrons.length).toBeGreaterThan(0);
  });
});

describe('SimpleBreadcrumb', () => {
  it('returns null when no items provided', () => {
    const { container } = render(<SimpleBreadcrumb items={[]} />);
    
    expect(container.firstChild).toBeNull();
  });

  it('renders simple breadcrumb items', () => {
    const items = [
      { label: 'Home', href: '/' },
      { label: 'Recipes', href: '/recipes' },
      { label: 'Current Recipe', isActive: true },
    ];
    
    render(<SimpleBreadcrumb items={items} />);
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Recipes')).toBeInTheDocument();
    expect(screen.getByText('Current Recipe')).toBeInTheDocument();
    
    // Check links
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Recipes' })).toHaveAttribute('href', '/recipes');
    
    // Active item should not be a link
    expect(screen.queryByRole('link', { name: 'Current Recipe' })).not.toBeInTheDocument();
  });

  it('highlights active item', () => {
    const items = [
      { label: 'Home', href: '/' },
      { label: 'Current', isActive: true },
    ];
    
    render(<SimpleBreadcrumb items={items} />);
    
    const activeItem = screen.getByText('Current');
    expect(activeItem).toHaveClass('text-foreground', 'font-medium');
  });

  it('applies custom className', () => {
    const items = [{ label: 'Test', href: '/' }];
    
    const { container } = render(
      <SimpleBreadcrumb items={items} className="custom-simple-breadcrumb" />
    );
    
    expect(container.firstChild).toHaveClass('custom-simple-breadcrumb');
  });

  it('shows chevron separators between items', () => {
    const items = [
      { label: 'First', href: '/' },
      { label: 'Second', href: '/second' },
      { label: 'Third', isActive: true },
    ];
    
    const { container } = render(<SimpleBreadcrumb items={items} />);
    
    // Should have 2 chevron separators for 3 items
    const chevrons = container.querySelectorAll('.lucide-chevron-right');
    expect(chevrons).toHaveLength(2);
  });
});