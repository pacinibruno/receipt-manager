import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  RecipeStorageService,
  StorageError,
  DataMigrationError,
  storageService,
} from '../storage';
import {
  Recipe,
  Folder,
  Tag,
  CreateRecipeInput,
  UpdateRecipeInput,
  CreateFolderInput,
  UpdateFolderInput,
  CreateTagInput,
  SearchFilters,
} from '../types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get store() {
      return store;
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'mock-uuid-' + Math.random().toString(36).substr(2, 9)),
  },
});

describe('RecipeStorageService', () => {
  let service: RecipeStorageService;

  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    
    // Reset the singleton instance for testing
    (RecipeStorageService as any).instance = undefined;
    
    service = RecipeStorageService.getInstance();
  });

  afterEach(() => {
    localStorageMock.clear();
    // Reset the singleton instance after each test
    (RecipeStorageService as any).instance = undefined;
  });

  describe('Initialization', () => {
    it('should initialize storage on first use', () => {
      // The service is already initialized in beforeEach, so check the calls
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'recipe_management_recipes',
        '[]'
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'recipe_management_folders',
        '[]'
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'recipe_management_tags',
        '[]'
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'recipe_management_version',
        '"1.0.0"'
      );
    });

    it('should be a singleton', () => {
      const service1 = RecipeStorageService.getInstance();
      const service2 = RecipeStorageService.getInstance();
      expect(service1).toBe(service2);
    });

    it('should handle localStorage errors during initialization', () => {
      // Reset singleton and clear mocks
      (RecipeStorageService as any).instance = undefined;
      localStorageMock.clear();
      vi.clearAllMocks();
      
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage quota exceeded');
      });

      expect(() => RecipeStorageService.getInstance()).toThrow(StorageError);
    });
  });

  describe('Recipe CRUD Operations', () => {
    const mockRecipeInput: CreateRecipeInput = {
      title: 'Test Recipe',
      description: 'A test recipe',
      ingredients: [
        { name: 'Flour', amount: '2', unit: 'cups' },
        { name: 'Sugar', amount: '1', unit: 'cup' },
      ],
      instructions: ['Mix ingredients', 'Bake for 30 minutes'],
      tags: ['dessert', 'easy'],
      prepTime: 15,
      cookTime: 30,
      servings: 8,
      difficulty: 'Easy' as const,
    };

    describe('createRecipe', () => {
      it('should create a new recipe with generated ID and timestamps', () => {
        const recipe = service.createRecipe(mockRecipeInput);

        expect(recipe.id).toMatch(/^recipe_/);
        expect(recipe.title).toBe(mockRecipeInput.title);
        expect(recipe.ingredients).toHaveLength(2);
        expect(recipe.ingredients[0].id).toMatch(/^ingredient_/);
        expect(recipe.createdAt).toBeInstanceOf(Date);
        expect(recipe.updatedAt).toBeInstanceOf(Date);
      });

      it('should add recipe to folder if folderId is provided', () => {
        const folder = service.createFolder({ name: 'Test Folder' });
        const recipe = service.createRecipe({
          ...mockRecipeInput,
          folderId: folder.id,
        });

        const updatedFolder = service.getFolderById(folder.id);
        expect(updatedFolder?.recipes).toContain(recipe.id);
      });

      it('should handle storage errors', () => {
        localStorageMock.setItem.mockImplementationOnce(() => {
          throw new Error('Storage error');
        });

        expect(() => service.createRecipe(mockRecipeInput)).toThrow(StorageError);
      });
    });

    describe('getAllRecipes', () => {
      it('should return empty array when no recipes exist', () => {
        const recipes = service.getAllRecipes();
        expect(recipes).toEqual([]);
      });

      it('should return all recipes with proper date deserialization', () => {
        const recipe1 = service.createRecipe(mockRecipeInput);
        const recipe2 = service.createRecipe({
          ...mockRecipeInput,
          title: 'Second Recipe',
        });

        const recipes = service.getAllRecipes();
        expect(recipes).toHaveLength(2);
        // Check that dates are either Date objects or valid date strings
        expect(recipes[0].createdAt).toBeTruthy();
        expect(recipes[1].createdAt).toBeTruthy();
        expect(recipes[0].title).toBe(mockRecipeInput.title);
        expect(recipes[1].title).toBe('Second Recipe');
      });
    });

    describe('getRecipeById', () => {
      it('should return recipe by ID', () => {
        const createdRecipe = service.createRecipe(mockRecipeInput);
        const foundRecipe = service.getRecipeById(createdRecipe.id);

        expect(foundRecipe).toBeTruthy();
        expect(foundRecipe?.id).toBe(createdRecipe.id);
        expect(foundRecipe?.title).toBe(createdRecipe.title);
        expect(foundRecipe?.ingredients).toEqual(createdRecipe.ingredients);
      });

      it('should return null for non-existent recipe', () => {
        const recipe = service.getRecipeById('non-existent-id');
        expect(recipe).toBeNull();
      });
    });

    describe('updateRecipe', () => {
      it('should update existing recipe', async () => {
        const recipe = service.createRecipe(mockRecipeInput);
        
        // Add a small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 1));
        
        const updateInput: UpdateRecipeInput = {
          id: recipe.id,
          title: 'Updated Recipe',
          difficulty: 'Hard',
        };

        const updatedRecipe = service.updateRecipe(updateInput);

        expect(updatedRecipe.title).toBe('Updated Recipe');
        expect(updatedRecipe.difficulty).toBe('Hard');
        expect(updatedRecipe.updatedAt.getTime()).toBeGreaterThanOrEqual(
          recipe.updatedAt.getTime()
        );
      });

      it('should handle folder changes', () => {
        const folder1 = service.createFolder({ name: 'Folder 1' });
        const folder2 = service.createFolder({ name: 'Folder 2' });
        const recipe = service.createRecipe({
          ...mockRecipeInput,
          folderId: folder1.id,
        });

        service.updateRecipe({
          id: recipe.id,
          folderId: folder2.id,
        });

        const updatedFolder1 = service.getFolderById(folder1.id);
        const updatedFolder2 = service.getFolderById(folder2.id);

        expect(updatedFolder1?.recipes).not.toContain(recipe.id);
        expect(updatedFolder2?.recipes).toContain(recipe.id);
      });

      it('should throw error for non-existent recipe', () => {
        expect(() =>
          service.updateRecipe({
            id: 'non-existent-id',
            title: 'Updated',
          })
        ).toThrow(StorageError);
      });
    });

    describe('deleteRecipe', () => {
      it('should delete existing recipe', () => {
        const recipe = service.createRecipe(mockRecipeInput);
        const deleted = service.deleteRecipe(recipe.id);

        expect(deleted).toBe(true);
        expect(service.getRecipeById(recipe.id)).toBeNull();
      });

      it('should remove recipe from folder', () => {
        const folder = service.createFolder({ name: 'Test Folder' });
        const recipe = service.createRecipe({
          ...mockRecipeInput,
          folderId: folder.id,
        });

        service.deleteRecipe(recipe.id);

        const updatedFolder = service.getFolderById(folder.id);
        expect(updatedFolder?.recipes).not.toContain(recipe.id);
      });

      it('should return false for non-existent recipe', () => {
        const deleted = service.deleteRecipe('non-existent-id');
        expect(deleted).toBe(false);
      });
    });
  });

  describe('Folder CRUD Operations', () => {
    const mockFolderInput: CreateFolderInput = {
      name: 'Test Folder',
    };

    describe('createFolder', () => {
      it('should create a new folder with generated ID and timestamp', () => {
        const folder = service.createFolder(mockFolderInput);

        expect(folder.id).toMatch(/^folder_/);
        expect(folder.name).toBe(mockFolderInput.name);
        expect(folder.children).toEqual([]);
        expect(folder.recipes).toEqual([]);
        expect(folder.createdAt).toBeInstanceOf(Date);
      });

      it('should add folder to parent if parentId is provided', () => {
        const parentFolder = service.createFolder({ name: 'Parent Folder' });
        const childFolder = service.createFolder({
          name: 'Child Folder',
          parentId: parentFolder.id,
        });

        const updatedParent = service.getFolderById(parentFolder.id);
        expect(updatedParent?.children).toContain(childFolder.id);
      });
    });

    describe('getAllFolders', () => {
      it('should return empty array when no folders exist', () => {
        const folders = service.getAllFolders();
        expect(folders).toEqual([]);
      });

      it('should return all folders', () => {
        service.createFolder({ name: 'Folder 1' });
        service.createFolder({ name: 'Folder 2' });

        const folders = service.getAllFolders();
        expect(folders).toHaveLength(2);
      });
    });

    describe('getFolderById', () => {
      it('should return folder by ID', () => {
        const createdFolder = service.createFolder(mockFolderInput);
        const foundFolder = service.getFolderById(createdFolder.id);

        expect(foundFolder).toBeTruthy();
        expect(foundFolder?.id).toBe(createdFolder.id);
        expect(foundFolder?.name).toBe(createdFolder.name);
        expect(foundFolder?.children).toEqual(createdFolder.children);
        expect(foundFolder?.recipes).toEqual(createdFolder.recipes);
      });

      it('should return null for non-existent folder', () => {
        const folder = service.getFolderById('non-existent-id');
        expect(folder).toBeNull();
      });
    });

    describe('updateFolder', () => {
      it('should update existing folder', () => {
        const folder = service.createFolder(mockFolderInput);
        const updateInput: UpdateFolderInput = {
          id: folder.id,
          name: 'Updated Folder',
        };

        const updatedFolder = service.updateFolder(updateInput);
        expect(updatedFolder.name).toBe('Updated Folder');
      });

      it('should handle parent changes', () => {
        const parent1 = service.createFolder({ name: 'Parent 1' });
        const parent2 = service.createFolder({ name: 'Parent 2' });
        const child = service.createFolder({
          name: 'Child',
          parentId: parent1.id,
        });

        service.updateFolder({
          id: child.id,
          parentId: parent2.id,
        });

        const updatedParent1 = service.getFolderById(parent1.id);
        const updatedParent2 = service.getFolderById(parent2.id);

        expect(updatedParent1?.children).not.toContain(child.id);
        expect(updatedParent2?.children).toContain(child.id);
      });

      it('should throw error for non-existent folder', () => {
        expect(() =>
          service.updateFolder({
            id: 'non-existent-id',
            name: 'Updated',
          })
        ).toThrow(StorageError);
      });
    });

    describe('deleteFolder', () => {
      it('should delete existing folder and move children to parent', () => {
        const grandparent = service.createFolder({ name: 'Grandparent' });
        const parent = service.createFolder({
          name: 'Parent',
          parentId: grandparent.id,
        });
        const child = service.createFolder({
          name: 'Child',
          parentId: parent.id,
        });

        const deleted = service.deleteFolder(parent.id);

        expect(deleted).toBe(true);
        expect(service.getFolderById(parent.id)).toBeNull();

        // Check that child was moved to grandparent
        const updatedChild = service.getFolderById(child.id);
        expect(updatedChild).toBeTruthy();
        expect(updatedChild?.parentId).toBe(grandparent.id);

        // Check that grandparent now contains the child
        const updatedGrandparent = service.getFolderById(grandparent.id);
        expect(updatedGrandparent).toBeTruthy();
        expect(updatedGrandparent?.children).toContain(child.id);
      });

      it('should move recipes to parent folder', () => {
        const parent = service.createFolder({ name: 'Parent' });
        const folder = service.createFolder({
          name: 'Folder',
          parentId: parent.id,
        });
        const recipe = service.createRecipe({
          ...mockRecipeInput,
          folderId: folder.id,
        });

        service.deleteFolder(folder.id);

        const updatedRecipe = service.getRecipeById(recipe.id);
        expect(updatedRecipe?.folderId).toBe(parent.id);
      });

      it('should return false for non-existent folder', () => {
        const deleted = service.deleteFolder('non-existent-id');
        expect(deleted).toBe(false);
      });
    });
  });

  describe('Tag CRUD Operations', () => {
    const mockTagInput: CreateTagInput = {
      name: 'dessert',
      color: '#ff6b6b',
    };

    describe('createTag', () => {
      it('should create a new tag with generated ID', () => {
        const tag = service.createTag(mockTagInput);

        expect(tag.id).toMatch(/^tag_/);
        expect(tag.name).toBe(mockTagInput.name);
        expect(tag.color).toBe(mockTagInput.color);
        expect(tag.count).toBe(0);
      });

      it('should return existing tag if name already exists', () => {
        const tag1 = service.createTag(mockTagInput);
        const tag2 = service.createTag(mockTagInput);

        expect(tag1.id).toBe(tag2.id);
      });
    });

    describe('getAllTags', () => {
      it('should return empty array when no tags exist', () => {
        const tags = service.getAllTags();
        expect(tags).toEqual([]);
      });

      it('should return all tags', () => {
        service.createTag({ name: 'dessert' });
        service.createTag({ name: 'easy' });

        const tags = service.getAllTags();
        expect(tags).toHaveLength(2);
      });
    });

    describe('getTagById', () => {
      it('should return tag by ID', () => {
        const createdTag = service.createTag(mockTagInput);
        const foundTag = service.getTagById(createdTag.id);

        expect(foundTag).toEqual(createdTag);
      });

      it('should return null for non-existent tag', () => {
        const tag = service.getTagById('non-existent-id');
        expect(tag).toBeNull();
      });
    });

    describe('getTagByName', () => {
      it('should return tag by name (case insensitive)', () => {
        const createdTag = service.createTag(mockTagInput);
        const foundTag = service.getTagByName('DESSERT');

        expect(foundTag).toEqual(createdTag);
      });

      it('should return null for non-existent tag name', () => {
        const tag = service.getTagByName('non-existent');
        expect(tag).toBeNull();
      });
    });

    describe('updateTag', () => {
      it('should update existing tag', () => {
        const tag = service.createTag(mockTagInput);
        const updatedTag = service.updateTag(tag.id, {
          name: 'sweet',
          color: '#00ff00',
        });

        expect(updatedTag.name).toBe('sweet');
        expect(updatedTag.color).toBe('#00ff00');
      });

      it('should throw error for non-existent tag', () => {
        expect(() =>
          service.updateTag('non-existent-id', { name: 'updated' })
        ).toThrow(StorageError);
      });
    });

    describe('deleteTag', () => {
      it('should delete existing tag and remove from recipes', () => {
        const tag = service.createTag(mockTagInput);
        const recipe = service.createRecipe({
          ...mockRecipeInput,
          tags: [tag.name, 'other-tag'],
        });

        const deleted = service.deleteTag(tag.id);

        expect(deleted).toBe(true);
        expect(service.getTagById(tag.id)).toBeNull();

        const updatedRecipe = service.getRecipeById(recipe.id);
        expect(updatedRecipe?.tags).toEqual(['other-tag']);
      });

      it('should return false for non-existent tag', () => {
        const deleted = service.deleteTag('non-existent-id');
        expect(deleted).toBe(false);
      });
    });
  });

  describe('Search and Filter Operations', () => {
    beforeEach(() => {
      // Create test data
      const folder1 = service.createFolder({ name: 'Desserts' });
      const folder2 = service.createFolder({ name: 'Main Dishes' });

      service.createRecipe({
        title: 'Chocolate Cake',
        description: 'Rich chocolate cake',
        ingredients: [{ name: 'Chocolate', amount: '200g' }],
        instructions: ['Melt chocolate', 'Mix with flour'],
        tags: ['dessert', 'chocolate'],
        folderId: folder1.id,
        difficulty: 'Medium',
        prepTime: 30,
        cookTime: 45,
      });

      service.createRecipe({
        title: 'Vanilla Cookies',
        description: 'Simple vanilla cookies',
        ingredients: [{ name: 'Vanilla', amount: '1 tsp' }],
        instructions: ['Mix ingredients', 'Bake cookies'],
        tags: ['dessert', 'easy'],
        folderId: folder1.id,
        difficulty: 'Easy',
        prepTime: 15,
        cookTime: 20,
      });

      service.createRecipe({
        title: 'Pasta Carbonara',
        description: 'Classic Italian pasta',
        ingredients: [{ name: 'Pasta', amount: '400g' }],
        instructions: ['Cook pasta', 'Add sauce'],
        tags: ['pasta', 'italian'],
        folderId: folder2.id,
        difficulty: 'Medium',
        prepTime: 10,
        cookTime: 15,
      });
    });

    describe('searchRecipes', () => {
      it('should return all recipes when no filters applied', () => {
        const result = service.searchRecipes({});
        expect(result.recipes).toHaveLength(3);
        expect(result.totalCount).toBe(3);
      });

      it('should filter by text query', () => {
        const result = service.searchRecipes({ query: 'chocolate' });
        expect(result.recipes).toHaveLength(1);
        expect(result.recipes[0].title).toBe('Chocolate Cake');
      });

      it('should filter by tags', () => {
        const result = service.searchRecipes({ tags: ['dessert'] });
        expect(result.recipes).toHaveLength(2);
      });

      it('should filter by folder', () => {
        const folders = service.getAllFolders();
        const dessertFolder = folders.find(f => f.name === 'Desserts');
        
        const result = service.searchRecipes({ folderId: dessertFolder?.id });
        expect(result.recipes).toHaveLength(2);
      });

      it('should filter by difficulty', () => {
        const result = service.searchRecipes({ difficulty: ['Easy'] });
        expect(result.recipes).toHaveLength(1);
        expect(result.recipes[0].title).toBe('Vanilla Cookies');
      });

      it('should filter by prep time', () => {
        const result = service.searchRecipes({ prepTimeMax: 20 });
        expect(result.recipes).toHaveLength(2);
      });

      it('should filter by cook time', () => {
        const result = service.searchRecipes({ cookTimeMax: 20 });
        expect(result.recipes).toHaveLength(2);
      });

      it('should combine multiple filters', () => {
        const result = service.searchRecipes({
          query: 'vanilla',
          tags: ['dessert'],
          difficulty: ['Easy'],
        });
        expect(result.recipes).toHaveLength(1);
        expect(result.recipes[0].title).toBe('Vanilla Cookies');
      });

      it('should handle search errors', () => {
        localStorageMock.getItem.mockImplementationOnce(() => {
          throw new Error('Storage error');
        });

        expect(() => service.searchRecipes({})).toThrow(StorageError);
      });
    });
  });

  describe('Data Management', () => {
    describe('exportData', () => {
      it('should export all data', () => {
        // Clear any existing data first
        service.clearAllData();
        
        service.createRecipe(mockRecipeInput);
        service.createFolder({ name: 'Test Folder' });
        service.createTag({ name: 'test-tag' });

        const exportedData = service.exportData();

        expect(exportedData.recipes).toHaveLength(1);
        expect(exportedData.folders).toHaveLength(1);
        expect(exportedData.tags).toHaveLength(3); // 'test-tag' + 'dessert' + 'easy' from recipe
        expect(exportedData.metadata).toBeTruthy();
      });
    });

    describe('importData', () => {
      it('should import data and clear existing data', () => {
        // Create initial data
        service.createRecipe(mockRecipeInput);

        const importData = {
          recipes: [
            {
              id: 'imported-recipe',
              title: 'Imported Recipe',
              ingredients: [],
              instructions: [],
              tags: [],
              createdAt: new Date(),
              updatedAt: new Date(),
            } as Recipe,
          ],
          folders: [],
          tags: [],
        };

        service.importData(importData);

        const recipes = service.getAllRecipes();
        expect(recipes).toHaveLength(1);
        expect(recipes[0].id).toBe('imported-recipe');
      });

      it('should throw error for invalid data structure', () => {
        expect(() =>
          service.importData({
            recipes: 'invalid' as any,
            folders: [],
            tags: [],
          })
        ).toThrow(StorageError);
      });
    });

    describe('clearAllData', () => {
      it('should clear all data and reinitialize', () => {
        service.createRecipe(mockRecipeInput);
        service.createFolder({ name: 'Test Folder' });

        service.clearAllData();

        expect(service.getAllRecipes()).toHaveLength(0);
        expect(service.getAllFolders()).toHaveLength(0);
        expect(service.getAllTags()).toHaveLength(0);
      });
    });

    describe('getStorageSize', () => {
      it('should calculate storage size', () => {
        service.createRecipe(mockRecipeInput);
        const size = service.getStorageSize();
        expect(size).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage quota exceeded', () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new DOMException('QuotaExceededError');
      });

      expect(() => service.createRecipe(mockRecipeInput)).toThrow(StorageError);
    });

    it('should handle JSON parsing errors', () => {
      // Reset singleton and clear mocks
      (RecipeStorageService as any).instance = undefined;
      localStorageMock.clear();
      vi.clearAllMocks();
      
      localStorageMock.getItem.mockReturnValueOnce('invalid json');

      expect(() => RecipeStorageService.getInstance()).toThrow(StorageError);
    });
  });

  describe('Singleton Export', () => {
    it('should export singleton instance', () => {
      // Reset any previous mock implementations
      localStorageMock.getItem.mockImplementation((key: string) => {
        const store = (localStorageMock as any).store || {};
        return store[key] || null;
      });
      
      expect(storageService).toBeInstanceOf(RecipeStorageService);
    });
  });
});

// Test the mockRecipeInput constant
const mockRecipeInput: CreateRecipeInput = {
  title: 'Test Recipe',
  description: 'A test recipe',
  ingredients: [
    { name: 'Flour', amount: '2', unit: 'cups' },
    { name: 'Sugar', amount: '1', unit: 'cup' },
  ],
  instructions: ['Mix ingredients', 'Bake for 30 minutes'],
  tags: ['dessert', 'easy'],
  prepTime: 15,
  cookTime: 30,
  servings: 8,
  difficulty: 'Easy' as const,
};