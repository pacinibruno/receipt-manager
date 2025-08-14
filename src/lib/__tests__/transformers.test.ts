import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createRecipeFromInput,
  updateRecipeFromInput,
  createIngredientFromInput,
  createFolderFromInput,
  updateFolderFromInput,
  createTagFromInput,
  serializeRecipe,
  deserializeRecipe,
  serializeFolder,
  deserializeFolder,
  serializeTag,
  deserializeTag,
  serializeRecipes,
  deserializeRecipes,
  serializeFolders,
  deserializeFolders,
  getRecipeTotalTime,
  getRecipeTagsAsString,
  getRecipeIngredientsText,
  getRecipeSearchableText,
  getFolderPath,
  getFolderDepth,
  updateTagCounts,
  getUnusedTags,
  getMostUsedTags,
} from '../transformers';
import {
  Recipe,
  Folder,
  Tag,
  CreateRecipeInput,
  CreateIngredientInput,
  CreateFolderInput,
  CreateTagInput,
} from '../types';

// Mock the utils module
vi.mock('../utils', () => ({
  generateRecipeId: () => 'recipe_test-id',
  generateIngredientId: () => 'ingredient_test-id',
  generateFolderId: () => 'folder_test-id',
  generateTagId: () => 'tag_test-id',
  getCurrentTimestamp: () => new Date('2023-01-01T12:00:00Z'),
}));

describe('Recipe transformers', () => {
  const validRecipeInput: CreateRecipeInput = {
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
    servings: 4,
    difficulty: 'Easy',
  };

  it('should create recipe from input', () => {
    const recipe = createRecipeFromInput(validRecipeInput);

    expect(recipe.id).toBe('recipe_test-id');
    expect(recipe.title).toBe('Test Recipe');
    expect(recipe.description).toBe('A test recipe');
    expect(recipe.ingredients).toHaveLength(2);
    expect(recipe.ingredients[0].id).toBe('ingredient_test-id');
    expect(recipe.instructions).toEqual(['Mix ingredients', 'Bake for 30 minutes']);
    expect(recipe.tags).toEqual(['dessert', 'easy']);
    expect(recipe.prepTime).toBe(15);
    expect(recipe.cookTime).toBe(30);
    expect(recipe.servings).toBe(4);
    expect(recipe.difficulty).toBe('Easy');
    expect(recipe.createdAt).toEqual(new Date('2023-01-01T12:00:00Z'));
    expect(recipe.updatedAt).toEqual(new Date('2023-01-01T12:00:00Z'));
  });

  it('should update recipe from input', () => {
    const existingRecipe: Recipe = {
      id: 'existing-recipe',
      title: 'Old Title',
      ingredients: [],
      instructions: [],
      tags: [],
      createdAt: new Date('2022-01-01T12:00:00Z'),
      updatedAt: new Date('2022-01-01T12:00:00Z'),
    };

    const updateInput = {
      title: 'New Title',
      description: 'Updated description',
    };

    const updatedRecipe = updateRecipeFromInput(existingRecipe, updateInput);

    expect(updatedRecipe.id).toBe('existing-recipe');
    expect(updatedRecipe.title).toBe('New Title');
    expect(updatedRecipe.description).toBe('Updated description');
    expect(updatedRecipe.createdAt).toEqual(new Date('2022-01-01T12:00:00Z'));
    expect(updatedRecipe.updatedAt).toEqual(new Date('2023-01-01T12:00:00Z'));
  });
});

describe('Ingredient transformers', () => {
  it('should create ingredient from input', () => {
    const input: CreateIngredientInput = {
      name: 'Flour',
      amount: '2',
      unit: 'cups',
    };

    const ingredient = createIngredientFromInput(input);

    expect(ingredient.id).toBe('ingredient_test-id');
    expect(ingredient.name).toBe('Flour');
    expect(ingredient.amount).toBe('2');
    expect(ingredient.unit).toBe('cups');
  });

  it('should handle ingredient without unit', () => {
    const input: CreateIngredientInput = {
      name: 'Salt',
      amount: '1 tsp',
    };

    const ingredient = createIngredientFromInput(input);

    expect(ingredient.unit).toBeUndefined();
  });
});

describe('Folder transformers', () => {
  it('should create folder from input', () => {
    const input: CreateFolderInput = {
      name: 'Test Folder',
      parentId: 'parent-id',
    };

    const folder = createFolderFromInput(input);

    expect(folder.id).toBe('folder_test-id');
    expect(folder.name).toBe('Test Folder');
    expect(folder.parentId).toBe('parent-id');
    expect(folder.children).toEqual([]);
    expect(folder.recipes).toEqual([]);
    expect(folder.createdAt).toEqual(new Date('2023-01-01T12:00:00Z'));
  });

  it('should update folder from input', () => {
    const existingFolder: Folder = {
      id: 'existing-folder',
      name: 'Old Name',
      children: ['child1'],
      recipes: ['recipe1'],
      createdAt: new Date('2022-01-01T12:00:00Z'),
    };

    const updateInput = {
      name: 'New Name',
    };

    const updatedFolder = updateFolderFromInput(existingFolder, updateInput);

    expect(updatedFolder.id).toBe('existing-folder');
    expect(updatedFolder.name).toBe('New Name');
    expect(updatedFolder.children).toEqual(['child1']);
    expect(updatedFolder.recipes).toEqual(['recipe1']);
  });
});

describe('Tag transformers', () => {
  it('should create tag from input', () => {
    const input: CreateTagInput = {
      name: 'dessert',
      color: '#FF0000',
    };

    const tag = createTagFromInput(input);

    expect(tag.id).toBe('tag_test-id');
    expect(tag.name).toBe('dessert');
    expect(tag.color).toBe('#FF0000');
    expect(tag.count).toBe(0);
  });
});

describe('Serialization', () => {
  it('should serialize and deserialize recipe', () => {
    const recipe: Recipe = {
      id: 'recipe-1',
      title: 'Test Recipe',
      ingredients: [],
      instructions: [],
      tags: [],
      createdAt: new Date('2023-01-01T12:00:00Z'),
      updatedAt: new Date('2023-01-01T13:00:00Z'),
    };

    const serialized = serializeRecipe(recipe);
    const deserialized = deserializeRecipe(serialized);

    expect(deserialized).toEqual(recipe);
    expect(deserialized.createdAt).toBeInstanceOf(Date);
    expect(deserialized.updatedAt).toBeInstanceOf(Date);
  });

  it('should serialize and deserialize folder', () => {
    const folder: Folder = {
      id: 'folder-1',
      name: 'Test Folder',
      children: [],
      recipes: [],
      createdAt: new Date('2023-01-01T12:00:00Z'),
    };

    const serialized = serializeFolder(folder);
    const deserialized = deserializeFolder(serialized);

    expect(deserialized).toEqual(folder);
    expect(deserialized.createdAt).toBeInstanceOf(Date);
  });

  it('should serialize and deserialize tag', () => {
    const tag: Tag = {
      id: 'tag-1',
      name: 'dessert',
      count: 5,
    };

    const serialized = serializeTag(tag);
    const deserialized = deserializeTag(serialized);

    expect(deserialized).toEqual(tag);
  });

  it('should serialize and deserialize recipe arrays', () => {
    const recipes: Recipe[] = [
      {
        id: 'recipe-1',
        title: 'Recipe 1',
        ingredients: [],
        instructions: [],
        tags: [],
        createdAt: new Date('2023-01-01T12:00:00Z'),
        updatedAt: new Date('2023-01-01T13:00:00Z'),
      },
      {
        id: 'recipe-2',
        title: 'Recipe 2',
        ingredients: [],
        instructions: [],
        tags: [],
        createdAt: new Date('2023-01-02T12:00:00Z'),
        updatedAt: new Date('2023-01-02T13:00:00Z'),
      },
    ];

    const serialized = serializeRecipes(recipes);
    const deserialized = deserializeRecipes(serialized);

    expect(deserialized).toEqual(recipes);
    expect(deserialized[0].createdAt).toBeInstanceOf(Date);
    expect(deserialized[1].updatedAt).toBeInstanceOf(Date);
  });
});

describe('Recipe utility transformers', () => {
  const recipe: Recipe = {
    id: 'recipe-1',
    title: 'Test Recipe',
    description: 'A delicious test recipe',
    ingredients: [
      { id: 'ing-1', name: 'Flour', amount: '2', unit: 'cups' },
      { id: 'ing-2', name: 'Sugar', amount: '1', unit: 'cup' },
      { id: 'ing-3', name: 'Salt', amount: '1 tsp' },
    ],
    instructions: ['Mix dry ingredients', 'Add wet ingredients'],
    tags: ['dessert', 'easy', 'quick'],
    prepTime: 15,
    cookTime: 30,
    servings: 4,
    difficulty: 'Easy',
    notes: 'Great for beginners',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('should get recipe total time', () => {
    expect(getRecipeTotalTime(recipe)).toBe(45);

    const recipeWithOnlyPrep = { ...recipe, cookTime: undefined };
    expect(getRecipeTotalTime(recipeWithOnlyPrep)).toBe(15);

    const recipeWithOnlyCook = { ...recipe, prepTime: undefined };
    expect(getRecipeTotalTime(recipeWithOnlyCook)).toBe(30);

    const recipeWithNoTime = { ...recipe, prepTime: undefined, cookTime: undefined };
    expect(getRecipeTotalTime(recipeWithNoTime)).toBeUndefined();
  });

  it('should get recipe tags as string', () => {
    expect(getRecipeTagsAsString(recipe)).toBe('dessert, easy, quick');
  });

  it('should get recipe ingredients text', () => {
    const expected = '2 cups Flour, 1 cup Sugar, 1 tsp Salt';
    expect(getRecipeIngredientsText(recipe)).toBe(expected);
  });

  it('should get recipe searchable text', () => {
    const searchableText = getRecipeSearchableText(recipe);
    expect(searchableText).toContain('test recipe');
    expect(searchableText).toContain('delicious');
    expect(searchableText).toContain('dessert easy quick');
    expect(searchableText).toContain('flour');
    expect(searchableText).toContain('mix dry ingredients');
    expect(searchableText).toContain('great for beginners');
  });
});

describe('Folder utility transformers', () => {
  const folders: Folder[] = [
    {
      id: 'root',
      name: 'Root',
      children: ['desserts'],
      recipes: [],
      createdAt: new Date(),
    },
    {
      id: 'desserts',
      name: 'Desserts',
      parentId: 'root',
      children: ['cakes'],
      recipes: [],
      createdAt: new Date(),
    },
    {
      id: 'cakes',
      name: 'Cakes',
      parentId: 'desserts',
      children: [],
      recipes: [],
      createdAt: new Date(),
    },
  ];

  it('should get folder path', () => {
    const cakesFolder = folders.find(f => f.id === 'cakes')!;
    const path = getFolderPath(cakesFolder, folders);
    expect(path).toEqual(['Root', 'Desserts', 'Cakes']);
  });

  it('should get folder depth', () => {
    const rootFolder = folders.find(f => f.id === 'root')!;
    const dessertsFolder = folders.find(f => f.id === 'desserts')!;
    const cakesFolder = folders.find(f => f.id === 'cakes')!;

    expect(getFolderDepth(rootFolder, folders)).toBe(0);
    expect(getFolderDepth(dessertsFolder, folders)).toBe(1);
    expect(getFolderDepth(cakesFolder, folders)).toBe(2);
  });
});

describe('Tag utility transformers', () => {
  const tags: Tag[] = [
    { id: 'tag-1', name: 'dessert', count: 0 },
    { id: 'tag-2', name: 'easy', count: 0 },
    { id: 'tag-3', name: 'quick', count: 0 },
    { id: 'tag-4', name: 'unused', count: 0 },
  ];

  const recipes: Recipe[] = [
    {
      id: 'recipe-1',
      title: 'Recipe 1',
      ingredients: [],
      instructions: [],
      tags: ['dessert', 'easy'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'recipe-2',
      title: 'Recipe 2',
      ingredients: [],
      instructions: [],
      tags: ['dessert', 'quick'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'recipe-3',
      title: 'Recipe 3',
      ingredients: [],
      instructions: [],
      tags: ['easy', 'quick'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  it('should update tag counts', () => {
    const updatedTags = updateTagCounts(tags, recipes);

    expect(updatedTags.find(t => t.name === 'dessert')?.count).toBe(2);
    expect(updatedTags.find(t => t.name === 'easy')?.count).toBe(2);
    expect(updatedTags.find(t => t.name === 'quick')?.count).toBe(2);
    expect(updatedTags.find(t => t.name === 'unused')?.count).toBe(0);
  });

  it('should get unused tags', () => {
    const updatedTags = updateTagCounts(tags, recipes);
    const unusedTags = getUnusedTags(updatedTags);

    expect(unusedTags).toHaveLength(1);
    expect(unusedTags[0].name).toBe('unused');
  });

  it('should get most used tags', () => {
    const tagsWithCounts = [
      { id: 'tag-1', name: 'dessert', count: 5 },
      { id: 'tag-2', name: 'easy', count: 3 },
      { id: 'tag-3', name: 'quick', count: 7 },
      { id: 'tag-4', name: 'unused', count: 0 },
    ];

    const mostUsed = getMostUsedTags(tagsWithCounts, 2);

    expect(mostUsed).toHaveLength(2);
    expect(mostUsed[0].name).toBe('quick');
    expect(mostUsed[1].name).toBe('dessert');
  });
});