import {
  Recipe,
  Ingredient,
  Folder,
  Tag,
  CreateRecipeInput,
  CreateIngredientInput,
  CreateFolderInput,
  CreateTagInput,
  ValidationResult,
  ValidationError,
  RecipeValidationError,
  FolderValidationError,
} from './types';

// Recipe validation
export function validateRecipe(input: CreateRecipeInput): ValidationResult {
  const errors: ValidationError[] = [];

  // Title validation
  if (!input.title || input.title.trim().length === 0) {
    errors.push({
      field: 'title',
      message: 'Recipe title is required',
      code: 'TITLE_REQUIRED',
    });
  } else if (input.title.trim().length > 200) {
    errors.push({
      field: 'title',
      message: 'Recipe title must be 200 characters or less',
      code: 'TITLE_TOO_LONG',
    });
  }

  // Description validation
  if (input.description && input.description.length > 1000) {
    errors.push({
      field: 'description',
      message: 'Description must be 1000 characters or less',
      code: 'DESCRIPTION_TOO_LONG',
    });
  }

  // Ingredients validation
  if (!input.ingredients || input.ingredients.length === 0) {
    errors.push({
      field: 'ingredients',
      message: 'At least one ingredient is required',
      code: 'INGREDIENTS_REQUIRED',
    });
  } else {
    input.ingredients.forEach((ingredient, index) => {
      const ingredientErrors = validateIngredient(ingredient);
      if (!ingredientErrors.isValid) {
        ingredientErrors.errors.forEach((error) => {
          errors.push({
            field: `ingredients[${index}].${error.field}`,
            message: error.message,
            code: error.code,
          });
        });
      }
    });
  }

  // Instructions validation
  if (!input.instructions || input.instructions.length === 0) {
    errors.push({
      field: 'instructions',
      message: 'At least one instruction is required',
      code: 'INSTRUCTIONS_REQUIRED',
    });
  } else {
    input.instructions.forEach((instruction, index) => {
      if (!instruction || instruction.trim().length === 0) {
        errors.push({
          field: `instructions[${index}]`,
          message: 'Instruction cannot be empty',
          code: 'INSTRUCTION_EMPTY',
        });
      }
    });
  }

  // Tags validation
  if (input.tags) {
    input.tags.forEach((tag, index) => {
      if (!tag || tag.trim().length === 0) {
        errors.push({
          field: `tags[${index}]`,
          message: 'Tag cannot be empty',
          code: 'TAG_EMPTY',
        });
      } else if (tag.length > 50) {
        errors.push({
          field: `tags[${index}]`,
          message: 'Tag must be 50 characters or less',
          code: 'TAG_TOO_LONG',
        });
      }
    });
  }

  // Time validation
  if (input.prepTime !== undefined && (input.prepTime < 0 || input.prepTime > 1440)) {
    errors.push({
      field: 'prepTime',
      message: 'Prep time must be between 0 and 1440 minutes',
      code: 'PREP_TIME_INVALID',
    });
  }

  if (input.cookTime !== undefined && (input.cookTime < 0 || input.cookTime > 1440)) {
    errors.push({
      field: 'cookTime',
      message: 'Cook time must be between 0 and 1440 minutes',
      code: 'COOK_TIME_INVALID',
    });
  }

  // Servings validation
  if (input.servings !== undefined && (input.servings < 1 || input.servings > 100)) {
    errors.push({
      field: 'servings',
      message: 'Servings must be between 1 and 100',
      code: 'SERVINGS_INVALID',
    });
  }

  // Difficulty validation
  if (input.difficulty && !['Easy', 'Medium', 'Hard'].includes(input.difficulty)) {
    errors.push({
      field: 'difficulty',
      message: 'Difficulty must be Easy, Medium, or Hard',
      code: 'DIFFICULTY_INVALID',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Ingredient validation
export function validateIngredient(input: CreateIngredientInput): ValidationResult {
  const errors: ValidationError[] = [];

  if (!input.name || input.name.trim().length === 0) {
    errors.push({
      field: 'name',
      message: 'Ingredient name is required',
      code: 'NAME_REQUIRED',
    });
  } else if (input.name.length > 100) {
    errors.push({
      field: 'name',
      message: 'Ingredient name must be 100 characters or less',
      code: 'NAME_TOO_LONG',
    });
  }

  if (!input.amount || input.amount.trim().length === 0) {
    errors.push({
      field: 'amount',
      message: 'Ingredient amount is required',
      code: 'AMOUNT_REQUIRED',
    });
  } else if (input.amount.length > 50) {
    errors.push({
      field: 'amount',
      message: 'Ingredient amount must be 50 characters or less',
      code: 'AMOUNT_TOO_LONG',
    });
  }

  if (input.unit && input.unit.length > 20) {
    errors.push({
      field: 'unit',
      message: 'Ingredient unit must be 20 characters or less',
      code: 'UNIT_TOO_LONG',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Folder validation
export function validateFolder(input: CreateFolderInput): ValidationResult {
  const errors: ValidationError[] = [];

  if (!input.name || input.name.trim().length === 0) {
    errors.push({
      field: 'name',
      message: 'Folder name is required',
      code: 'NAME_REQUIRED',
    });
  } else if (input.name.length > 100) {
    errors.push({
      field: 'name',
      message: 'Folder name must be 100 characters or less',
      code: 'NAME_TOO_LONG',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Tag validation
export function validateTag(input: CreateTagInput): ValidationResult {
  const errors: ValidationError[] = [];

  if (!input.name || input.name.trim().length === 0) {
    errors.push({
      field: 'name',
      message: 'Tag name is required',
      code: 'NAME_REQUIRED',
    });
  } else if (input.name.length > 50) {
    errors.push({
      field: 'name',
      message: 'Tag name must be 50 characters or less',
      code: 'NAME_TOO_LONG',
    });
  }

  if (input.color && !/^#[0-9A-F]{6}$/i.test(input.color)) {
    errors.push({
      field: 'color',
      message: 'Tag color must be a valid hex color code',
      code: 'COLOR_INVALID',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Validation helper functions
export function throwIfInvalid(result: ValidationResult, ErrorClass: typeof RecipeValidationError | typeof FolderValidationError = RecipeValidationError): void {
  if (!result.isValid) {
    const firstError = result.errors[0];
    throw new ErrorClass(firstError.message, firstError.field, firstError.code);
  }
}

export function sanitizeString(input: string): string {
  return input.trim().replace(/\s+/g, ' ');
}

export function sanitizeRecipeInput(input: CreateRecipeInput): CreateRecipeInput {
  return {
    ...input,
    title: sanitizeString(input.title),
    description: input.description ? sanitizeString(input.description) : undefined,
    instructions: input.instructions ? input.instructions.map(sanitizeString) : [],
    tags: input.tags ? input.tags.map(sanitizeString) : [],
    notes: input.notes ? sanitizeString(input.notes) : undefined,
    ingredients: input.ingredients ? input.ingredients.map(ingredient => ({
      ...ingredient,
      name: sanitizeString(ingredient.name),
      amount: sanitizeString(ingredient.amount),
      unit: ingredient.unit ? sanitizeString(ingredient.unit) : undefined,
    })) : [],
  };
}