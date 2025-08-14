import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import { useRecipes } from '../use-recipes';
import { Recipe, CreateRecipeInput } from '@/lib/types';
import * as storage from '@/lib/storage';

// Mock the storage module
vi.mock('@/lib/storage', () => ({
  getAllRecipes: vi.fn(),
  getRecipeById: vi.fn(),
  createRecipe: vi.fn(),
  updateRecipe: vi.fn(),
  deleteRecipe: vi.fn(),
  searchRecipes: vi.fn(),
}));

const mockStorage = vi.mocked(storage);

describe('useRecipes', () => {
  const mockRecipe: Recipe = {
    id: 'recipe-1',
    title: 'Test Recipe',
    description: 'A test recipe',
    ingredients: [
      { id: 'ing-1', name: 'Flour', amount: '2', unit: 'cups' },
    ],
    instructions: ['Mix ingredients'],
    tags: ['test'],
    folderId: 'folder-1',
    prepTime: 15,
    cookTime: 30,
    servings: 4,
    difficulty: 'Medium',
    imageUrl: 'https://example.com/image.jpg',
    notes: 'Test notes',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockCreateInput: CreateRecipeInput = {
    title: 'New Recipe',
    description: 'A new recipe',
    ingredients: [{ name: 'Sugar', amount: '1', unit: 'cup' }],
    instructions: ['Mix well'],
    tags: ['new'],
    prepTime: 10,
    cookTime: 20,
    servings: 2,
    difficulty: 'Easy',
  };

  beforeEach(() => {
    mockStorage.getAllRecipes.mockReturnValue([mockRecipe]);
    mockStorage.getRecipeById.mockReturnValue(mockRecipe);
    mockStorage.createRecipe.mockReturnValue({ ...mockRecipe, id: 'recipe-2', ...mockCreateInput });
    mockStorage.updateRecipe.mockReturnValue({ ...mockRecipe, title: 'Updated Recipe' });
    mockStorage.deleteRecipe.mockReturnValue(true);
    mockStorage.searchRecipes.mockReturnValue({
      recipes: [mockRecipe],
      totalCount: 1,
      hasMore: false,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('initializes with correct default state', async () => {
      const { result } = renderHook(() => useRecipes());

      // Wait for initial fetch to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.recipes).toEqual([mockRecipe]);
      expect(result.current.error).toBe(null);
      expect(result.current.searchResults).toBe(null);
      expect(mockStorage.getAllRecipes).toHaveBeenCalledTimes(1);
    });

    it('handles fetch error on initialization', async () => {
      const error = new Error('Fetch failed');
      mockStorage.getAllRecipes.mockImplementation(() => {
        throw error;
      });

      const { result } = renderHook(() => useRecipes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Fetch failed');
      expect(result.current.recipes).toEqual([]);
    });
  });

  describe('CRUD Operations', () => {
    describe('addRecipe', () => {
      it('adds a new recipe successfully', async () => {
        const { result } = renderHook(() => useRecipes());

        // Wait for initial load
        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        const newRecipe = { ...mockRecipe, id: 'recipe-2', ...mockCreateInput };
        mockStorage.createRecipe.mockReturnValue(newRecipe);

        let addedRecipe: Recipe;
        await act(async () => {
          addedRecipe = await result.current.addRecipe(mockCreateInput);
        });

        expect(addedRecipe!).toEqual(newRecipe);
        expect(result.current.recipes).toHaveLength(2);
        expect(result.current.recipes[1]).toEqual(newRecipe);
        expect(mockStorage.createRecipe).toHaveBeenCalledWith(mockCreateInput);
      });

      it('handles add recipe error with rollback', async () => {
        const { result } = renderHook(() => useRecipes());

        // Wait for initial load
        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        const error = new Error('Create failed');
        mockStorage.createRecipe.mockImplementation(() => {
          throw error;
        });

        await act(async () => {
          try {
            await result.current.addRecipe(mockCreateInput);
          } catch (e) {
            expect(e).toBe(error);
          }
        });

        expect(result.current.error).toBe('Create failed');
        expect(result.current.recipes).toEqual([mockRecipe]); // Should be reverted
      });
    });

    describe('editRecipe', () => {
      it('updates a recipe successfully', async () => {
        const { result } = renderHook(() => useRecipes());

        // Wait for initial load
        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        const updatedRecipe = { ...mockRecipe, title: 'Updated Recipe' };
        mockStorage.updateRecipe.mockReturnValue(updatedRecipe);

        let editedRecipe: Recipe;
        await act(async () => {
          editedRecipe = await result.current.editRecipe('recipe-1', { title: 'Updated Recipe' });
        });

        expect(editedRecipe!).toEqual(updatedRecipe);
        expect(result.current.recipes[0]).toEqual(updatedRecipe);
        expect(mockStorage.updateRecipe).toHaveBeenCalledWith('recipe-1', { title: 'Updated Recipe' });
      });

      it('handles edit recipe error with rollback', async () => {
        const { result } = renderHook(() => useRecipes());

        // Wait for initial load
        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        const error = new Error('Update failed');
        mockStorage.updateRecipe.mockImplementation(() => {
          throw error;
        });

        await act(async () => {
          try {
            await result.current.editRecipe('recipe-1', { title: 'Updated Recipe' });
          } catch (e) {
            expect(e).toBe(error);
          }
        });

        expect(result.current.error).toBe('Update failed');
        expect(result.current.recipes[0]).toEqual(mockRecipe); // Should be reverted
      });
    });

    describe('removeRecipe', () => {
      it('removes a recipe successfully', async () => {
        const { result } = renderHook(() => useRecipes());

        // Wait for initial load
        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        let success: boolean;
        await act(async () => {
          success = await result.current.removeRecipe('recipe-1');
        });

        expect(success!).toBe(true);
        expect(result.current.recipes).toHaveLength(0);
        expect(mockStorage.deleteRecipe).toHaveBeenCalledWith('recipe-1');
      });

      it('handles remove recipe error with rollback', async () => {
        const { result } = renderHook(() => useRecipes());

        // Wait for initial load
        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        const error = new Error('Delete failed');
        mockStorage.deleteRecipe.mockImplementation(() => {
          throw error;
        });

        let success: boolean = true;
        await act(async () => {
          try {
            success = await result.current.removeRecipe('recipe-1');
          } catch (e) {
            success = false;
          }
        });

        expect(success).toBe(false);
        expect(result.current.error).toBe('Delete failed');
        expect(result.current.recipes).toEqual([mockRecipe]); // Should be reverted
      });

      it('handles delete failure return value', async () => {
        const { result } = renderHook(() => useRecipes());

        // Wait for initial load
        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        mockStorage.deleteRecipe.mockReturnValue(false);

        let success: boolean;
        await act(async () => {
          success = await result.current.removeRecipe('recipe-1');
        });

        expect(success!).toBe(false);
        expect(result.current.error).toBe('Failed to delete recipe');
        expect(result.current.recipes).toEqual([mockRecipe]); // Should be reverted
      });
    });

    describe('duplicateRecipe', () => {
      it('duplicates a recipe successfully', async () => {
        const { result } = renderHook(() => useRecipes());

        // Wait for initial load
        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        const duplicatedRecipe = { ...mockRecipe, id: 'recipe-2', title: 'Test Recipe (Copy)' };
        mockStorage.createRecipe.mockReturnValue(duplicatedRecipe);

        let newRecipe: Recipe;
        await act(async () => {
          newRecipe = await result.current.duplicateRecipe('recipe-1');
        });

        expect(newRecipe!).toEqual(duplicatedRecipe);
        expect(result.current.recipes).toHaveLength(2);
        expect(result.current.recipes[1].title).toBe('Test Recipe (Copy)');
        expect(mockStorage.getRecipeById).toHaveBeenCalledWith('recipe-1');
        expect(mockStorage.createRecipe).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Test Recipe (Copy)',
            description: mockRecipe.description,
            ingredients: expect.arrayContaining([
              expect.objectContaining({
                name: 'Flour',
                amount: '2',
                unit: 'cups',
              }),
            ]),
          })
        );
      });

      it('handles duplicate recipe error when original not found', async () => {
        const { result } = renderHook(() => useRecipes());

        // Wait for initial load
        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        mockStorage.getRecipeById.mockReturnValue(null);

        await act(async () => {
          try {
            await result.current.duplicateRecipe('nonexistent');
          } catch (error) {
            expect(error).toEqual(new Error('Recipe not found'));
          }
        });

        expect(result.current.error).toBe('Recipe not found');
      });
    });
  });

  describe('Data Fetching', () => {
    describe('fetchRecipe', () => {
      it('fetches a single recipe successfully', async () => {
        const { result } = renderHook(() => useRecipes());

        // Wait for initial load
        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        let recipe: Recipe | null;
        await act(async () => {
          recipe = await result.current.fetchRecipe('recipe-1');
        });

        expect(recipe!).toEqual(mockRecipe);
        expect(mockStorage.getRecipeById).toHaveBeenCalledWith('recipe-1');
      });

      it('handles fetch recipe error', async () => {
        const { result } = renderHook(() => useRecipes());

        // Wait for initial load
        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        const error = new Error('Fetch failed');
        mockStorage.getRecipeById.mockImplementation(() => {
          throw error;
        });

        let recipe: Recipe | null = mockRecipe;
        await act(async () => {
          try {
            recipe = await result.current.fetchRecipe('recipe-1');
          } catch (e) {
            recipe = null;
          }
        });

        expect(recipe).toBe(null);
        expect(result.current.error).toBe('Fetch failed');
      });
    });

    describe('searchRecipeList', () => {
      it('searches recipes successfully', async () => {
        const { result } = renderHook(() => useRecipes());

        // Wait for initial load
        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        const searchFilters = { query: 'test', tags: ['test'] };
        const searchResults = {
          recipes: [mockRecipe],
          totalCount: 1,
          hasMore: false,
        };

        let results;
        await act(async () => {
          results = await result.current.searchRecipeList(searchFilters);
        });

        expect(results).toEqual(searchResults);
        expect(result.current.searchResults).toEqual(searchResults);
        expect(mockStorage.searchRecipes).toHaveBeenCalledWith(searchFilters);
      });

      it('handles search error', async () => {
        const { result } = renderHook(() => useRecipes());

        // Wait for initial load
        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        const error = new Error('Search failed');
        mockStorage.searchRecipes.mockImplementation(() => {
          throw error;
        });

        await act(async () => {
          try {
            await result.current.searchRecipeList({ query: 'test' });
          } catch (e) {
            expect(e).toBe(error);
          }
        });

        expect(result.current.error).toBe('Search failed');
      });
    });
  });

  describe('State Management', () => {
    it('clears error state', async () => {
      const { result } = renderHook(() => useRecipes());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Trigger an error
      const error = new Error('Test error');
      mockStorage.createRecipe.mockImplementation(() => {
        throw error;
      });

      await act(async () => {
        try {
          await result.current.addRecipe(mockCreateInput);
        } catch (e) {
          // Expected
        }
      });

      expect(result.current.error).toBe('Test error');

      // Clear error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });

    it('clears search results', async () => {
      const { result } = renderHook(() => useRecipes());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Perform search
      await act(async () => {
        await result.current.searchRecipeList({ query: 'test' });
      });

      expect(result.current.searchResults).not.toBe(null);

      // Clear search results
      act(() => {
        result.current.clearSearchResults();
      });

      expect(result.current.searchResults).toBe(null);
    });
  });

  describe('Optimistic Updates', () => {
    it('performs optimistic updates for add operation', async () => {
      const { result } = renderHook(() => useRecipes());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const newRecipe = { ...mockRecipe, id: 'recipe-2', ...mockCreateInput };
      mockStorage.createRecipe.mockReturnValue(newRecipe);

      // Start add operation
      act(() => {
        result.current.addRecipe(mockCreateInput);
      });

      // Should immediately show the new recipe (optimistic update)
      await waitFor(() => {
        expect(result.current.recipes).toHaveLength(2);
      });
    });

    it('performs optimistic updates for edit operation', async () => {
      const { result } = renderHook(() => useRecipes());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const updatedRecipe = { ...mockRecipe, title: 'Updated Recipe' };
      mockStorage.updateRecipe.mockReturnValue(updatedRecipe);

      // Start edit operation
      act(() => {
        result.current.editRecipe('recipe-1', { title: 'Updated Recipe' });
      });

      // Should immediately show the updated recipe (optimistic update)
      await waitFor(() => {
        expect(result.current.recipes[0].title).toBe('Updated Recipe');
      });
    });

    it('performs optimistic updates for remove operation', async () => {
      const { result } = renderHook(() => useRecipes());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Start remove operation
      act(() => {
        result.current.removeRecipe('recipe-1');
      });

      // Should immediately remove the recipe (optimistic update)
      await waitFor(() => {
        expect(result.current.recipes).toHaveLength(0);
      });
    });
  });
});