import { describe, it, expect } from 'vitest';
import {
  Recipe,
  Ingredient,
  Folder,
  Tag,
  CreateRecipeInput,
  CreateIngredientInput,
  CreateFolderInput,
  CreateTagInput,
  UpdateRecipeInput,
  UpdateFolderInput,
  ValidationResult,
  ValidationError,
  SearchFilters,
  SearchResult,
  DifficultyLevel,
  SortOrder,
  SortField,
  RecipeValidationError,
  FolderValidationError,
} from '../types';

describe('Type definitions', () => {
  it('should define Recipe interface correctly', () => {
    const recipe: Recipe = {
      id: 'recipe-1',
      title: 'Test Recipe',
      description: 'A test recipe',
      ingredients: [],
      instructions: ['Step 1'],
      tags: ['tag1'],
      folderId: 'folder-1',
      prepTime: 15,
      cookTime: 30,
      servings: 4,
      difficulty: 'Easy',
      imageUrl: 'https://example.com/image.jpg',
      notes: 'Some notes',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(recipe.id).toBe('recipe-1');
    expect(recipe.title).toBe('Test Recipe');
    expect(recipe.difficulty).toBe('Easy');
  });

  it('should define Ingredient interface correctly', () => {
    const ingredient: Ingredient = {
      id: 'ingredient-1',
      name: 'Flour',
      amount: '2',
      unit: 'cups',
    };

    expect(ingredient.id).toBe('ingredient-1');
    expect(ingredient.name).toBe('Flour');
    expect(ingredient.unit).toBe('cups');
  });

  it('should define Folder interface correctly', () => {
    const folder: Folder = {
      id: 'folder-1',
      name: 'Desserts',
      parentId: 'parent-folder',
      children: ['child-folder'],
      recipes: ['recipe-1'],
      createdAt: new Date(),
    };

    expect(folder.id).toBe('folder-1');
    expect(folder.name).toBe('Desserts');
    expect(folder.children).toEqual(['child-folder']);
  });

  it('should define Tag interface correctly', () => {
    const tag: Tag = {
      id: 'tag-1',
      name: 'dessert',
      color: '#FF0000',
      count: 5,
    };

    expect(tag.id).toBe('tag-1');
    expect(tag.name).toBe('dessert');
    expect(tag.count).toBe(5);
  });

  it('should define CreateRecipeInput interface correctly', () => {
    const input: CreateRecipeInput = {
      title: 'New Recipe',
      description: 'A new recipe',
      ingredients: [{ name: 'Flour', amount: '2', unit: 'cups' }],
      instructions: ['Mix ingredients'],
      tags: ['dessert'],
      folderId: 'folder-1',
      prepTime: 15,
      cookTime: 30,
      servings: 4,
      difficulty: 'Easy',
      imageUrl: 'https://example.com/image.jpg',
      notes: 'Some notes',
    };

    expect(input.title).toBe('New Recipe');
    expect(input.ingredients).toHaveLength(1);
  });

  it('should define UpdateRecipeInput interface correctly', () => {
    const input: UpdateRecipeInput = {
      id: 'recipe-1',
      title: 'Updated Recipe',
      description: 'Updated description',
    };

    expect(input.id).toBe('recipe-1');
    expect(input.title).toBe('Updated Recipe');
  });

  it('should define ValidationResult interface correctly', () => {
    const result: ValidationResult = {
      isValid: false,
      errors: [
        {
          field: 'title',
          message: 'Title is required',
          code: 'TITLE_REQUIRED',
        },
      ],
    };

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe('title');
  });

  it('should define SearchFilters interface correctly', () => {
    const filters: SearchFilters = {
      query: 'chocolate',
      tags: ['dessert', 'easy'],
      difficulty: ['Easy', 'Medium'],
      prepTimeMax: 30,
      cookTimeMax: 60,
      folderId: 'folder-1',
    };

    expect(filters.query).toBe('chocolate');
    expect(filters.tags).toEqual(['dessert', 'easy']);
    expect(filters.difficulty).toEqual(['Easy', 'Medium']);
  });

  it('should define SearchResult interface correctly', () => {
    const result: SearchResult = {
      recipes: [],
      totalCount: 0,
      hasMore: false,
    };

    expect(result.recipes).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.hasMore).toBe(false);
  });

  it('should define DifficultyLevel type correctly', () => {
    const easy: DifficultyLevel = 'Easy';
    const medium: DifficultyLevel = 'Medium';
    const hard: DifficultyLevel = 'Hard';

    expect(easy).toBe('Easy');
    expect(medium).toBe('Medium');
    expect(hard).toBe('Hard');
  });

  it('should define SortOrder type correctly', () => {
    const asc: SortOrder = 'asc';
    const desc: SortOrder = 'desc';

    expect(asc).toBe('asc');
    expect(desc).toBe('desc');
  });

  it('should define SortField type correctly', () => {
    const title: SortField = 'title';
    const createdAt: SortField = 'createdAt';
    const updatedAt: SortField = 'updatedAt';
    const prepTime: SortField = 'prepTime';
    const cookTime: SortField = 'cookTime';

    expect(title).toBe('title');
    expect(createdAt).toBe('createdAt');
    expect(updatedAt).toBe('updatedAt');
    expect(prepTime).toBe('prepTime');
    expect(cookTime).toBe('cookTime');
  });

  it('should define RecipeValidationError class correctly', () => {
    const error = new RecipeValidationError('Title is required', 'title', 'TITLE_REQUIRED');

    expect(error.message).toBe('Title is required');
    expect(error.field).toBe('title');
    expect(error.code).toBe('TITLE_REQUIRED');
    expect(error.name).toBe('RecipeValidationError');
    expect(error).toBeInstanceOf(Error);
  });

  it('should define FolderValidationError class correctly', () => {
    const error = new FolderValidationError('Name is required', 'name', 'NAME_REQUIRED');

    expect(error.message).toBe('Name is required');
    expect(error.field).toBe('name');
    expect(error.code).toBe('NAME_REQUIRED');
    expect(error.name).toBe('FolderValidationError');
    expect(error).toBeInstanceOf(Error);
  });
});