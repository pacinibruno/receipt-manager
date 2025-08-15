import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useRouter } from 'next/navigation';
import Home from '../page';
import { useRecipes } from '@/hooks/use-recipes';
import { useFolders } from '@/hooks/use-folders';
import { getAllTags } from '@/lib/storage';

// Mock the hooks and dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@/hooks/use-recipes');
vi.mock('@/hooks/use-folders');
vi.mock('@/lib/storage', () => ({
  getAllTags: vi.fn(),
}));

// Mock the components
vi.mock('@/components/folder/folder-tree-with-dnd', () => ({
  FolderTreeWithDnd: ({ onFolderSelect, selectedFolderId }: any) => (
    <div data-testid="folder-tree">
      <button onClick={() => onFolderSelect(undefined)}>All Recipes</button>
      <button onClick={() => onFolderSelect('folder-1')}>Test Folder</button>
      <div data-testid="selected-folder">{selectedFolderId || 'none'}</div>
    </div>
  ),
}));

vi.mock('@/components/recipe/search-and-filter', () => ({
  SearchAndFilter: ({ onFiltersChange, filters }: any) => (
    <div data-testid="search-filter">
      <input
        data-testid="search-input"
        onChange={(e) => onFiltersChange({ ...filters, query: e.target.value })}
        placeholder="Search recipes..."
      />
    </div>
  ),
}));

vi.mock('@/components/recipe/recipe-card', () => ({
  RecipeCard: ({ recipe, onEdit, onDelete }: any) => (
    <div data-testid={`recipe-card-${recipe.id}`}>
      <h3>{recipe.title}</h3>
      <button onClick={() => onEdit(recipe)}>Edit</button>
      <button onClick={() => onDelete(recipe.id)}>Delete</button>
    </div>
  ),
}));

vi.mock('@/components/recipe/recipe-form', () => ({
  RecipeForm: ({ onSubmit, onCancel, recipe }: any) => (
    <div data-testid="recipe-form">
      <h3>{recipe ? 'Edit Recipe' : 'Add Recipe'}</h3>
      <button onClick={() => onSubmit({ title: 'Test Recipe', ingredients: [], instructions: [], tags: [] })}>
        Submit
      </button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

const mockUseRecipes = vi.mocked(useRecipes);
const mockUseFolders = vi.mocked(useFolders);
const mockGetAllTags = vi.mocked(getAllTags);
const mockUseRouter = vi.mocked(useRouter);

describe('Home Page', () => {
  const mockRecipes = [
    {
      id: '1',
      title: 'Test Recipe 1',
      description: 'A test recipe',
      ingredients: [{ id: '1', name: 'Test ingredient', amount: '1 cup', unit: 'cup' }],
      instructions: ['Test instruction'],
      tags: ['test'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      title: 'Test Recipe 2',
      description: 'Another test recipe',
      ingredients: [{ id: '2', name: 'Another ingredient', amount: '2 cups', unit: 'cup' }],
      instructions: ['Another instruction'],
      tags: ['test', 'easy'],
      folderId: 'folder-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockFolders = [
    {
      id: 'folder-1',
      name: 'Test Folder',
      children: [],
      recipes: ['2'],
      createdAt: new Date(),
    },
  ];

  const defaultRecipesHook = {
    recipes: mockRecipes,
    loading: false,
    error: null,
    searchResults: null,
    addRecipe: vi.fn(),
    editRecipe: vi.fn(),
    removeRecipe: vi.fn(),
    searchRecipeList: vi.fn(),
    clearSearchResults: vi.fn(),
    duplicateRecipe: vi.fn(),
    fetchRecipes: vi.fn(),
    fetchRecipe: vi.fn(),
    clearError: vi.fn(),
  };

  const defaultFoldersHook = {
    folders: mockFolders,
    loading: false,
    error: null,
    createFolder: vi.fn(),
    updateFolder: vi.fn(),
    deleteFolder: vi.fn(),
    getFolderById: vi.fn(),
    getFolderTree: vi.fn(),
    getFolderPath: vi.fn(),
    moveFolder: vi.fn(),
    refreshFolders: vi.fn(),
  };

  beforeEach(() => {
    mockUseRecipes.mockReturnValue(defaultRecipesHook);
    mockUseFolders.mockReturnValue(defaultFoldersHook);
    mockGetAllTags.mockReturnValue([
      { id: '1', name: 'test', count: 2 },
      { id: '2', name: 'easy', count: 1 },
    ]);
    mockUseRouter.mockReturnValue({
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    } as any);

    // Mock window.confirm
    window.confirm = vi.fn(() => true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the home page with header and main content', () => {
    render(<Home />);

    expect(screen.getByText('Recipe Management')).toBeInTheDocument();
    expect(screen.getByText('Organize, categorize, and manage your recipes with ease')).toBeInTheDocument();
    expect(screen.getByText('Add Recipe')).toBeInTheDocument();
    expect(screen.getByTestId('folder-tree')).toBeInTheDocument();
    expect(screen.getByTestId('search-filter')).toBeInTheDocument();
  });

  it('displays all recipes by default', () => {
    render(<Home />);

    expect(screen.getByRole('heading', { name: 'All Recipes' })).toBeInTheDocument();
    expect(screen.getByText('2 recipes')).toBeInTheDocument();
    expect(screen.getByTestId('recipe-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('recipe-card-2')).toBeInTheDocument();
  });

  it('filters recipes by selected folder', () => {
    render(<Home />);

    // Click on test folder
    fireEvent.click(screen.getByText('Test Folder'));

    // Should show only recipes in that folder
    expect(screen.getByRole('heading', { name: 'Test Folder' })).toBeInTheDocument();
    expect(screen.getByText('1 recipe')).toBeInTheDocument();
  });

  it('opens add recipe dialog when add button is clicked', () => {
    render(<Home />);

    fireEvent.click(screen.getByRole('button', { name: /add recipe/i }));

    expect(screen.getByTestId('recipe-form')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Add New Recipe' })).toBeInTheDocument();
  });

  it('handles recipe creation', async () => {
    const mockAddRecipe = vi.fn().mockResolvedValue({});
    mockUseRecipes.mockReturnValue({
      ...defaultRecipesHook,
      addRecipe: mockAddRecipe,
    });

    render(<Home />);

    // Open add recipe dialog
    fireEvent.click(screen.getByRole('button', { name: /add recipe/i }));

    // Submit the form
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(mockAddRecipe).toHaveBeenCalledWith({
        title: 'Test Recipe',
        ingredients: [],
        instructions: [],
        tags: [],
      });
    });
  });

  it('handles recipe editing', async () => {
    const mockEditRecipe = vi.fn().mockResolvedValue({});
    mockUseRecipes.mockReturnValue({
      ...defaultRecipesHook,
      editRecipe: mockEditRecipe,
    });

    render(<Home />);

    // Click edit on first recipe
    fireEvent.click(screen.getAllByText('Edit')[0]);

    expect(screen.getByTestId('recipe-form')).toBeInTheDocument();

    // Submit the form
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(mockEditRecipe).toHaveBeenCalledWith('1', {
        title: 'Test Recipe',
        ingredients: [],
        instructions: [],
        tags: [],
      });
    });
  });

  it('handles recipe deletion', async () => {
    const mockRemoveRecipe = vi.fn().mockResolvedValue(true);
    mockUseRecipes.mockReturnValue({
      ...defaultRecipesHook,
      removeRecipe: mockRemoveRecipe,
    });

    render(<Home />);

    // Click delete on first recipe
    fireEvent.click(screen.getAllByText('Delete')[0]);

    await waitFor(() => {
      expect(mockRemoveRecipe).toHaveBeenCalledWith('1');
    });
  });

  it('handles search functionality', async () => {
    const mockSearchRecipeList = vi.fn().mockResolvedValue({
      recipes: [mockRecipes[0]],
      totalCount: 1,
      hasMore: false,
    });
    mockUseRecipes.mockReturnValue({
      ...defaultRecipesHook,
      searchRecipeList: mockSearchRecipeList,
    });

    render(<Home />);

    // Type in search input
    fireEvent.change(screen.getByTestId('search-input'), {
      target: { value: 'test query' },
    });

    await waitFor(() => {
      expect(mockSearchRecipeList).toHaveBeenCalledWith({
        query: 'test query',
      });
    });
  });

  it('displays loading state', () => {
    mockUseRecipes.mockReturnValue({
      ...defaultRecipesHook,
      loading: true,
    });

    render(<Home />);

    expect(screen.getByText('Loading recipes...')).toBeInTheDocument();
  });

  it('displays error state', () => {
    mockUseRecipes.mockReturnValue({
      ...defaultRecipesHook,
      error: 'Failed to load recipes',
    });

    render(<Home />);

    expect(screen.getByText('Error: Failed to load recipes')).toBeInTheDocument();
  });

  it('displays empty state when no recipes', () => {
    mockUseRecipes.mockReturnValue({
      ...defaultRecipesHook,
      recipes: [],
    });

    render(<Home />);

    expect(screen.getByText('No recipes yet. Add your first recipe to get started!')).toBeInTheDocument();
    expect(screen.getByText('Add Your First Recipe')).toBeInTheDocument();
  });

  it('displays empty search results', () => {
    mockUseRecipes.mockReturnValue({
      ...defaultRecipesHook,
      searchResults: {
        recipes: [],
        totalCount: 0,
        hasMore: false,
      },
    });

    render(<Home />);

    expect(screen.getByText('No recipes match your search criteria.')).toBeInTheDocument();
  });

  it('displays folder error state', () => {
    mockUseFolders.mockReturnValue({
      ...defaultFoldersHook,
      error: 'Failed to load folders',
    });

    render(<Home />);

    expect(screen.getByText('Error loading folders: Failed to load folders')).toBeInTheDocument();
  });

  it('handles recipe form cancellation', () => {
    render(<Home />);

    // Open add recipe dialog
    fireEvent.click(screen.getByText('Add Recipe'));
    expect(screen.getByTestId('recipe-form')).toBeInTheDocument();

    // Cancel the form
    fireEvent.click(screen.getByText('Cancel'));

    // Dialog should be closed
    expect(screen.queryByTestId('recipe-form')).not.toBeInTheDocument();
  });

  it('adds recipe to selected folder', async () => {
    const mockAddRecipe = vi.fn().mockResolvedValue({});
    mockUseRecipes.mockReturnValue({
      ...defaultRecipesHook,
      addRecipe: mockAddRecipe,
    });

    render(<Home />);

    // Select a folder first
    fireEvent.click(screen.getByText('Test Folder'));

    // Open add recipe dialog
    fireEvent.click(screen.getByRole('button', { name: /add recipe/i }));

    // Submit the form
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(mockAddRecipe).toHaveBeenCalledWith({
        title: 'Test Recipe',
        ingredients: [],
        instructions: [],
        tags: [],
        folderId: 'folder-1',
      });
    });
  });
});