import { describe, it, expect } from 'vitest';
import {
  validateRecipe,
  validateIngredient,
  validateFolder,
  validateTag,
  throwIfInvalid,
  sanitizeString,
  sanitizeRecipeInput,
} from '../validation';
import {
  CreateRecipeInput,
  CreateIngredientInput,
  CreateFolderInput,
  CreateTagInput,
  RecipeValidationError,
} from '../types';

describe('validateRecipe', () => {
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

  it('should validate a valid recipe', () => {
    const result = validateRecipe(validRecipeInput);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should require a title', () => {
    const input = { ...validRecipeInput, title: '' };
    const result = validateRecipe(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'title',
      message: 'Recipe title is required',
      code: 'TITLE_REQUIRED',
    });
  });

  it('should reject title that is too long', () => {
    const input = { ...validRecipeInput, title: 'a'.repeat(201) };
    const result = validateRecipe(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'title',
      message: 'Recipe title must be 200 characters or less',
      code: 'TITLE_TOO_LONG',
    });
  });

  it('should reject description that is too long', () => {
    const input = { ...validRecipeInput, description: 'a'.repeat(1001) };
    const result = validateRecipe(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'description',
      message: 'Description must be 1000 characters or less',
      code: 'DESCRIPTION_TOO_LONG',
    });
  });

  it('should require at least one ingredient', () => {
    const input = { ...validRecipeInput, ingredients: [] };
    const result = validateRecipe(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'ingredients',
      message: 'At least one ingredient is required',
      code: 'INGREDIENTS_REQUIRED',
    });
  });

  it('should validate individual ingredients', () => {
    const input = {
      ...validRecipeInput,
      ingredients: [{ name: '', amount: '1', unit: 'cup' }],
    };
    const result = validateRecipe(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'ingredients[0].name',
      message: 'Ingredient name is required',
      code: 'NAME_REQUIRED',
    });
  });

  it('should require at least one instruction', () => {
    const input = { ...validRecipeInput, instructions: [] };
    const result = validateRecipe(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'instructions',
      message: 'At least one instruction is required',
      code: 'INSTRUCTIONS_REQUIRED',
    });
  });

  it('should reject empty instructions', () => {
    const input = { ...validRecipeInput, instructions: ['Mix ingredients', ''] };
    const result = validateRecipe(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'instructions[1]',
      message: 'Instruction cannot be empty',
      code: 'INSTRUCTION_EMPTY',
    });
  });

  it('should validate prep time range', () => {
    const input = { ...validRecipeInput, prepTime: -1 };
    const result = validateRecipe(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'prepTime',
      message: 'Prep time must be between 0 and 1440 minutes',
      code: 'PREP_TIME_INVALID',
    });
  });

  it('should validate cook time range', () => {
    const input = { ...validRecipeInput, cookTime: 1441 };
    const result = validateRecipe(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'cookTime',
      message: 'Cook time must be between 0 and 1440 minutes',
      code: 'COOK_TIME_INVALID',
    });
  });

  it('should validate servings range', () => {
    const input = { ...validRecipeInput, servings: 0 };
    const result = validateRecipe(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'servings',
      message: 'Servings must be between 1 and 100',
      code: 'SERVINGS_INVALID',
    });
  });

  it('should validate difficulty values', () => {
    const input = { ...validRecipeInput, difficulty: 'Invalid' as any };
    const result = validateRecipe(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'difficulty',
      message: 'Difficulty must be Easy, Medium, or Hard',
      code: 'DIFFICULTY_INVALID',
    });
  });

  it('should reject empty tags', () => {
    const input = { ...validRecipeInput, tags: ['dessert', ''] };
    const result = validateRecipe(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'tags[1]',
      message: 'Tag cannot be empty',
      code: 'TAG_EMPTY',
    });
  });

  it('should reject tags that are too long', () => {
    const input = { ...validRecipeInput, tags: ['a'.repeat(51)] };
    const result = validateRecipe(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'tags[0]',
      message: 'Tag must be 50 characters or less',
      code: 'TAG_TOO_LONG',
    });
  });
});

describe('validateIngredient', () => {
  const validIngredient: CreateIngredientInput = {
    name: 'Flour',
    amount: '2',
    unit: 'cups',
  };

  it('should validate a valid ingredient', () => {
    const result = validateIngredient(validIngredient);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should require a name', () => {
    const input = { ...validIngredient, name: '' };
    const result = validateIngredient(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'name',
      message: 'Ingredient name is required',
      code: 'NAME_REQUIRED',
    });
  });

  it('should require an amount', () => {
    const input = { ...validIngredient, amount: '' };
    const result = validateIngredient(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'amount',
      message: 'Ingredient amount is required',
      code: 'AMOUNT_REQUIRED',
    });
  });

  it('should validate name length', () => {
    const input = { ...validIngredient, name: 'a'.repeat(101) };
    const result = validateIngredient(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'name',
      message: 'Ingredient name must be 100 characters or less',
      code: 'NAME_TOO_LONG',
    });
  });

  it('should validate amount length', () => {
    const input = { ...validIngredient, amount: 'a'.repeat(51) };
    const result = validateIngredient(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'amount',
      message: 'Ingredient amount must be 50 characters or less',
      code: 'AMOUNT_TOO_LONG',
    });
  });

  it('should validate unit length', () => {
    const input = { ...validIngredient, unit: 'a'.repeat(21) };
    const result = validateIngredient(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'unit',
      message: 'Ingredient unit must be 20 characters or less',
      code: 'UNIT_TOO_LONG',
    });
  });

  it('should allow undefined unit', () => {
    const input = { ...validIngredient, unit: undefined };
    const result = validateIngredient(input);
    expect(result.isValid).toBe(true);
  });
});

describe('validateFolder', () => {
  const validFolder: CreateFolderInput = {
    name: 'Test Folder',
    parentId: 'parent-id',
  };

  it('should validate a valid folder', () => {
    const result = validateFolder(validFolder);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should require a name', () => {
    const input = { ...validFolder, name: '' };
    const result = validateFolder(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'name',
      message: 'Folder name is required',
      code: 'NAME_REQUIRED',
    });
  });

  it('should validate name length', () => {
    const input = { ...validFolder, name: 'a'.repeat(101) };
    const result = validateFolder(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'name',
      message: 'Folder name must be 100 characters or less',
      code: 'NAME_TOO_LONG',
    });
  });
});

describe('validateTag', () => {
  const validTag: CreateTagInput = {
    name: 'dessert',
    color: '#FF0000',
  };

  it('should validate a valid tag', () => {
    const result = validateTag(validTag);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should require a name', () => {
    const input = { ...validTag, name: '' };
    const result = validateTag(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'name',
      message: 'Tag name is required',
      code: 'NAME_REQUIRED',
    });
  });

  it('should validate name length', () => {
    const input = { ...validTag, name: 'a'.repeat(51) };
    const result = validateTag(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'name',
      message: 'Tag name must be 50 characters or less',
      code: 'NAME_TOO_LONG',
    });
  });

  it('should validate color format', () => {
    const input = { ...validTag, color: 'invalid-color' };
    const result = validateTag(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'color',
      message: 'Tag color must be a valid hex color code',
      code: 'COLOR_INVALID',
    });
  });

  it('should allow undefined color', () => {
    const input = { ...validTag, color: undefined };
    const result = validateTag(input);
    expect(result.isValid).toBe(true);
  });
});

describe('throwIfInvalid', () => {
  it('should not throw for valid result', () => {
    const result = { isValid: true, errors: [] };
    expect(() => throwIfInvalid(result)).not.toThrow();
  });

  it('should throw for invalid result', () => {
    const result = {
      isValid: false,
      errors: [{ field: 'title', message: 'Title is required', code: 'TITLE_REQUIRED' }],
    };
    expect(() => throwIfInvalid(result)).toThrow(RecipeValidationError);
    expect(() => throwIfInvalid(result)).toThrow('Title is required');
  });
});

describe('sanitizeString', () => {
  it('should trim whitespace', () => {
    expect(sanitizeString('  hello world  ')).toBe('hello world');
  });

  it('should replace multiple spaces with single space', () => {
    expect(sanitizeString('hello    world')).toBe('hello world');
  });

  it('should handle mixed whitespace', () => {
    expect(sanitizeString('  hello   world  ')).toBe('hello world');
  });
});

describe('sanitizeRecipeInput', () => {
  it('should sanitize all string fields', () => {
    const input: CreateRecipeInput = {
      title: '  Test Recipe  ',
      description: '  A test recipe  ',
      ingredients: [
        { name: '  Flour  ', amount: '  2  ', unit: '  cups  ' },
      ],
      instructions: ['  Mix ingredients  ', '  Bake  '],
      tags: ['  dessert  ', '  easy  '],
      notes: '  Some notes  ',
    };

    const result = sanitizeRecipeInput(input);

    expect(result.title).toBe('Test Recipe');
    expect(result.description).toBe('A test recipe');
    expect(result.ingredients[0].name).toBe('Flour');
    expect(result.ingredients[0].amount).toBe('2');
    expect(result.ingredients[0].unit).toBe('cups');
    expect(result.instructions[0]).toBe('Mix ingredients');
    expect(result.instructions[1]).toBe('Bake');
    expect(result.tags[0]).toBe('dessert');
    expect(result.tags[1]).toBe('easy');
    expect(result.notes).toBe('Some notes');
  });

  it('should handle undefined optional fields', () => {
    const input: CreateRecipeInput = {
      title: 'Test Recipe',
      ingredients: [{ name: 'Flour', amount: '2' }],
      instructions: ['Mix'],
      tags: [],
    };

    const result = sanitizeRecipeInput(input);

    expect(result.description).toBeUndefined();
    expect(result.notes).toBeUndefined();
    expect(result.ingredients[0].unit).toBeUndefined();
  });
});