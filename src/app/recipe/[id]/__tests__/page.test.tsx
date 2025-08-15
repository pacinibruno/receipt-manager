import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useRouter } from 'next/navigation';
import RecipePage from '../page';
import { useRecipes } from '@/hooks/use-recipes';

// Mock the hooks and dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@/hooks/use-recipes');

// Mock the components
vi.mock('@/components/recipe/recipe-form', () => ({
  RecipeForm: ({ onSubmit, onCancel, recipe }: any) => (
    <div data-testid="recipe-form">
      <h3>{recipe ? 'Edit Recipe' : 'Add Recipe'}</h3>
      <button onClick={() => onSubmit({ title: 'Updated Recipe', ingredients: [], instructions: [], tags: [] })}>
        Submit
      </button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

const mockUseRecipes = vi.mocked(useRecipes);
const mockUseRouter = vi.mocked(useRouter);

describe('Recipe Detail Page', () => {
  const mockRecipe = {
    id: '1',
    title: 'Test Recipe',
    description: 'A delicious test recipe',
    ingredients: [
      { id: '1', name: 'Test ingredient', amount: '1 cup', unit: 'cup' },
      { id: '2', name: 'Another ingredient', amount: '2 tbsp', unit: 'tbsp' }
    ],
    instructions: [
      'First instruction step',
      'Second instruction step',
      'Third instruction step'
    ],
    tags: ['test', 'easy', 'quick'],
    prepTime: 15,
    cookTime: 30,
    servings: 4,
    difficulty: 'Easy' as const,
    imageUrl: 'https://example.com/recipe-image.jpg',
    notes: 'Some helpful notes about this recipe',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-02'),
  };

  const defaultRecipesHook = {
    recipes: [],
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

  const mockPush = vi.fn();

  beforeEach(() => {
    mockUseRecipes.mockReturnValue(defaultRecipesHook);
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    } as any);

    // Mock window.confirm
    window.confirm = vi.fn(() => true);
    
    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(),
      },
    });

    // Mock window.print
    window.print = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderWithParams = (id: string = '1') => {
    const params = Promise.resolve({ id });
    return render(<RecipePage params={params} />);
  };

  it('displays loading state initially', () => {
    mockUseRecipes.mockReturnValue({
      ...defaultRecipesHook,
      loading: true,
    });

    renderWithParams();

    expect(screen.getByText('Loading recipe...')).toBeInTheDocument();
  });

  it('displays error state when recipe not found', async () => {
    const mockFetchRecipe = vi.fn().mockResolvedValue(null);
    mockUseRecipes.mockReturnValue({
      ...defaultRecipesHook,
      fetchRecipe: mockFetchRecipe,
    });

    renderWithParams();

    await waitFor(() => {
      expect(screen.getByText('Recipe not found')).toBeInTheDocument();
    });

    expect(screen.getByText('Back to Recipes')).toBeInTheDocument();
  });

  it('displays error state when there is an error', () => {
    mockUseRecipes.mockReturnValue({
      ...defaultRecipesHook,
      error: 'Failed to load recipe',
    });

    renderWithParams();

    expect(screen.getByText('Failed to load recipe')).toBeInTheDocument();
  });

  it('fetches and displays recipe details', async () => {
    const mockFetchRecipe = vi.fn().mockResolvedValue(mockRecipe);
    mockUseRecipes.mockReturnValue({
      ...defaultRecipesHook,
      fetchRecipe: mockFetchRecipe,
    });

    renderWithParams();

    await waitFor(() => {
      expect(mockFetchRecipe).toHaveBeenCalledWith('1');
    });

    await waitFor(() => {
      expect(screen.getAllByText('Test Recipe')).toHaveLength(2); // Header and print header
    });

    expect(screen.getAllByText('A delicious test recipe')).toHaveLength(2);
    expect(screen.getByText('Prep:')).toBeInTheDocument();
    expect(screen.getByText('15m')).toBeInTheDocument();
    expect(screen.getByText('Cook:')).toBeInTheDocument();
    expect(screen.getByText('30m')).toBeInTheDocument();
    expect(screen.getByText('Serves:')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('Easy')).toBeInTheDocument();
  });

  it('displays ingredients correctly', async () => {
    const mockFetchRecipe = vi.fn().mockResolvedValue(mockRecipe);
    mockUseRecipes.mockReturnValue({
      ...defaultRecipesHook,
      fetchRecipe: mockFetchRecipe,
    });

    renderWithParams();

    await waitFor(() => {
      expect(screen.getByText('Ingredients')).toBeInTheDocument();
    });

    expect(screen.getByText('1 cup')).toBeInTheDocument();
    expect(screen.getByText('Test ingredient')).toBeInTheDocument();
    expect(screen.getByText('2 tbsp')).toBeInTheDocument();
    expect(screen.getByText('Another ingredient')).toBeInTheDocument();
  });

  it('displays instructions correctly', async () => {
    const mockFetchRecipe = vi.fn().mockResolvedValue(mockRecipe);
    mockUseRecipes.mockReturnValue({
      ...defaultRecipesHook,
      fetchRecipe: mockFetchRecipe,
    });

    renderWithParams();

    await waitFor(() => {
      expect(screen.getByText('Instructions')).toBeInTheDocument();
    });

    expect(screen.getByText('First instruction step')).toBeInTheDocument();
    expect(screen.getByText('Second instruction step')).toBeInTheDocument();
    expect(screen.getByText('Third instruction step')).toBeInTheDocument();
  });

  it('displays tags correctly', async () => {
    const mockFetchRecipe = vi.fn().mockResolvedValue(mockRecipe);
    mockUseRecipes.mockReturnValue({
      ...defaultRecipesHook,
      fetchRecipe: mockFetchRecipe,
    });

    renderWithParams();

    await waitFor(() => {
      expect(screen.getByText('Tags:')).toBeInTheDocument();
    });

    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('easy')).toBeInTheDocument();
    expect(screen.getByText('quick')).toBeInTheDocument();
  });

  it('displays notes when present', async () => {
    const mockFetchRecipe = vi.fn().mockResolvedValue(mockRecipe);
    mockUseRecipes.mockReturnValue({
      ...defaultRecipesHook,
      fetchRecipe: mockFetchRecipe,
    });

    renderWithParams();

    await waitFor(() => {
      expect(screen.getByText('Notes')).toBeInTheDocument();
    });

    expect(screen.getByText('Some helpful notes about this recipe')).toBeInTheDocument();
  });

  it('handles back navigation', async () => {
    const mockFetchRecipe = vi.fn().mockResolvedValue(mockRecipe);
    mockUseRecipes.mockReturnValue({
      ...defaultRecipesHook,
      fetchRecipe: mockFetchRecipe,
    });

    renderWithParams();

    await waitFor(() => {
      expect(screen.getAllByText('Test Recipe')).toHaveLength(2);
    });

    fireEvent.click(screen.getByText('Back to Recipes'));

    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('handles recipe editing', async () => {
    const mockFetchRecipe = vi.fn().mockResolvedValue(mockRecipe);
    const mockEditRecipe = vi.fn().mockResolvedValue({});
    mockUseRecipes.mockReturnValue({
      ...defaultRecipesHook,
      fetchRecipe: mockFetchRecipe,
      editRecipe: mockEditRecipe,
    });

    renderWithParams();

    await waitFor(() => {
      expect(screen.getAllByText('Test Recipe')).toHaveLength(2);
    });

    // Click edit button
    fireEvent.click(screen.getByText('Edit'));

    expect(screen.getByTestId('recipe-form')).toBeInTheDocument();

    // Submit the form
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(mockEditRecipe).toHaveBeenCalledWith('1', {
        title: 'Updated Recipe',
        ingredients: [],
        instructions: [],
        tags: [],
      });
    });
  });

  it('handles recipe deletion', async () => {
    const mockFetchRecipe = vi.fn().mockResolvedValue(mockRecipe);
    const mockRemoveRecipe = vi.fn().mockResolvedValue(true);
    mockUseRecipes.mockReturnValue({
      ...defaultRecipesHook,
      fetchRecipe: mockFetchRecipe,
      removeRecipe: mockRemoveRecipe,
    });

    renderWithParams();

    await waitFor(() => {
      expect(screen.getAllByText('Test Recipe')).toHaveLength(2);
    });

    // Click delete button
    fireEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(mockRemoveRecipe).toHaveBeenCalledWith('1');
    });

    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('handles print functionality', async () => {
    const mockFetchRecipe = vi.fn().mockResolvedValue(mockRecipe);
    mockUseRecipes.mockReturnValue({
      ...defaultRecipesHook,
      fetchRecipe: mockFetchRecipe,
    });

    renderWithParams();

    await waitFor(() => {
      expect(screen.getAllByText('Test Recipe')).toHaveLength(2);
    });

    // Click print button
    fireEvent.click(screen.getByText('Print'));

    // Wait for print to be called
    await waitFor(() => {
      expect(window.print).toHaveBeenCalled();
    });
  });

  it('handles share functionality', async () => {
    const mockFetchRecipe = vi.fn().mockResolvedValue(mockRecipe);
    mockUseRecipes.mockReturnValue({
      ...defaultRecipesHook,
      fetchRecipe: mockFetchRecipe,
    });

    renderWithParams();

    await waitFor(() => {
      expect(screen.getAllByText('Test Recipe')).toHaveLength(2);
    });

    // Click share button
    fireEvent.click(screen.getByText('Share'));

    // Should copy to clipboard as fallback
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });
  });

  it('handles edit form cancellation', async () => {
    const mockFetchRecipe = vi.fn().mockResolvedValue(mockRecipe);
    mockUseRecipes.mockReturnValue({
      ...defaultRecipesHook,
      fetchRecipe: mockFetchRecipe,
    });

    renderWithParams();

    await waitFor(() => {
      expect(screen.getAllByText('Test Recipe')).toHaveLength(2);
    });

    // Click edit button
    fireEvent.click(screen.getByText('Edit'));
    expect(screen.getByTestId('recipe-form')).toBeInTheDocument();

    // Cancel the form
    fireEvent.click(screen.getByText('Cancel'));

    // Dialog should be closed
    expect(screen.queryByTestId('recipe-form')).not.toBeInTheDocument();
  });

  it('displays recipe without optional fields', async () => {
    const minimalRecipe = {
      id: '1',
      title: 'Minimal Recipe',
      ingredients: [{ id: '1', name: 'Ingredient', amount: '1', unit: '' }],
      instructions: ['Do something'],
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockFetchRecipe = vi.fn().mockResolvedValue(minimalRecipe);
    mockUseRecipes.mockReturnValue({
      ...defaultRecipesHook,
      fetchRecipe: mockFetchRecipe,
    });

    renderWithParams();

    await waitFor(() => {
      expect(screen.getAllByText('Minimal Recipe')).toHaveLength(2);
    });

    // Should not display optional metadata
    expect(screen.queryByText('Prep:')).not.toBeInTheDocument();
    expect(screen.queryByText('Cook:')).not.toBeInTheDocument();
    expect(screen.queryByText('Serves:')).not.toBeInTheDocument();
    expect(screen.queryByText('Tags:')).not.toBeInTheDocument();
    expect(screen.queryByText('Notes')).not.toBeInTheDocument();
  });

  it('formats time correctly', async () => {
    const recipeWithLongTime = {
      ...mockRecipe,
      prepTime: 90, // 1h 30m
      cookTime: 120, // 2h
    };

    const mockFetchRecipe = vi.fn().mockResolvedValue(recipeWithLongTime);
    mockUseRecipes.mockReturnValue({
      ...defaultRecipesHook,
      fetchRecipe: mockFetchRecipe,
    });

    renderWithParams();

    await waitFor(() => {
      expect(screen.getByText('1h 30m')).toBeInTheDocument();
    });

    expect(screen.getByText('2h')).toBeInTheDocument();
  });
});