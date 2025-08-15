'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, X, ChefHat } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import { CreateRecipeInput, CreateIngredientInput, Recipe, Tag, DifficultyLevel } from '@/lib/types';
import { validateRecipe, sanitizeRecipeInput } from '@/lib/validation';
import { getAllTags } from '@/lib/storage';
import { EnhancedTagInput } from '@/components/tag/enhanced-tag-input';

// Form validation schema using Zod
const ingredientSchema = z.object({
  name: z.string().min(1, 'Ingredient name is required').max(100, 'Name must be 100 characters or less'),
  amount: z.string().min(1, 'Amount is required').max(50, 'Amount must be 50 characters or less'),
  unit: z.string().max(20, 'Unit must be 20 characters or less').optional(),
});

const recipeFormSchema = z.object({
  title: z.string().min(1, 'Recipe title is required').max(200, 'Title must be 200 characters or less'),
  description: z.string().max(1000, 'Description must be 1000 characters or less').optional(),
  ingredients: z.array(ingredientSchema).min(1, 'At least one ingredient is required'),
  instructions: z.array(z.string().min(1, 'Instruction cannot be empty')).min(1, 'At least one instruction is required'),
  tags: z.array(z.string()),
  folderId: z.string().optional(),
  prepTime: z.number().min(0, 'Prep time must be 0 or greater').max(1440, 'Prep time must be 1440 minutes or less').optional(),
  cookTime: z.number().min(0, 'Cook time must be 0 or greater').max(1440, 'Cook time must be 1440 minutes or less').optional(),
  servings: z.number().min(1, 'Servings must be 1 or greater').max(100, 'Servings must be 100 or less').optional(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(),
  imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  notes: z.string().optional(),
});

type RecipeFormData = z.infer<typeof recipeFormSchema>;

interface RecipeFormProps {
  recipe?: Recipe;
  onSubmit: (data: CreateRecipeInput) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function RecipeForm({ recipe, onSubmit, onCancel, isLoading = false }: RecipeFormProps) {

  const form = useForm<RecipeFormData>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: {
      title: recipe?.title || '',
      description: recipe?.description || '',
      ingredients: recipe?.ingredients || [{ name: '', amount: '', unit: '' }],
      instructions: recipe?.instructions || [''],
      tags: recipe?.tags || [],
      folderId: recipe?.folderId || '',
      prepTime: recipe?.prepTime || undefined,
      cookTime: recipe?.cookTime || undefined,
      servings: recipe?.servings || undefined,
      difficulty: recipe?.difficulty || undefined,
      imageUrl: recipe?.imageUrl || '',
      notes: recipe?.notes || '',
    },
  });

  const {
    fields: ingredientFields,
    append: appendIngredient,
    remove: removeIngredient,
  } = useFieldArray({
    control: form.control,
    name: 'ingredients',
  });

  const {
    fields: instructionFields,
    append: appendInstruction,
    remove: removeInstruction,
  } = useFieldArray({
    control: form.control,
    name: 'instructions',
  });



  const handleSubmit = async (data: RecipeFormData) => {
    try {
      // Convert form data to CreateRecipeInput
      const recipeInput: CreateRecipeInput = {
        ...data,
        ingredients: data.ingredients.map(ing => ({
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit || undefined,
        })),
        imageUrl: data.imageUrl || undefined,
      };

      // Sanitize and validate the input
      const sanitizedInput = sanitizeRecipeInput(recipeInput);
      const validationResult = validateRecipe(sanitizedInput);

      if (!validationResult.isValid) {
        // Set form errors based on validation results
        validationResult.errors.forEach(error => {
          form.setError(error.field as any, {
            type: 'manual',
            message: error.message,
          });
        });
        return;
      }

      await onSubmit(sanitizedInput);
    } catch (error) {
      console.error('Form submission error:', error);
      form.setError('root', {
        type: 'manual',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    }
  };



  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ChefHat className="h-5 w-5" />
          {recipe ? 'Edit Recipe' : 'Add New Recipe'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipe Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter recipe title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description of the recipe"
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional description to help identify this recipe
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="prepTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prep Time (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="30"
                          {...field}
                          onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cookTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cook Time (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="45"
                          {...field}
                          onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="servings"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Servings</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="4"
                          {...field}
                          onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficulty</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select difficulty level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Easy">Easy</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Ingredients Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Ingredients *</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendIngredient({ name: '', amount: '', unit: '' })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Ingredient
                </Button>
              </div>

              <div className="space-y-3">
                {ingredientFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-start">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                      <FormField
                        control={form.control}
                        name={`ingredients.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            {index === 0 && <FormLabel>Name</FormLabel>}
                            <FormControl>
                              <Input placeholder="Ingredient name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`ingredients.${index}.amount`}
                        render={({ field }) => (
                          <FormItem>
                            {index === 0 && <FormLabel>Amount</FormLabel>}
                            <FormControl>
                              <Input placeholder="1 cup" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`ingredients.${index}.unit`}
                        render={({ field }) => (
                          <FormItem>
                            {index === 0 && <FormLabel>Unit (optional)</FormLabel>}
                            <FormControl>
                              <Input placeholder="cups, tsp, etc." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {ingredientFields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-6 text-destructive hover:text-destructive"
                        onClick={() => removeIngredient(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Instructions Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Instructions *</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendInstruction('')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Step
                </Button>
              </div>

              <div className="space-y-3">
                {instructionFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium mt-1">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <FormField
                        control={form.control}
                        name={`instructions.${index}`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                placeholder={`Step ${index + 1} instructions...`}
                                className="resize-none"
                                rows={2}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    {instructionFields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeInstruction(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Tags Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Tags</h3>
              
              <EnhancedTagInput
                selectedTags={form.watch('tags')}
                onTagsChange={(tags) => form.setValue('tags', tags)}
                placeholder="Type to add tags..."
                disabled={isLoading}
                maxTags={20}
                allowCustomTags={true}
                showPopularTags={true}
              />
            </div>

            <Separator />

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Additional Information</h3>
              
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/recipe-image.jpg" {...field} />
                    </FormControl>
                    <FormDescription>
                      Optional URL to an image of the finished recipe
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional notes, tips, or variations..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Any additional information about this recipe
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-6">
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : recipe ? 'Update Recipe' : 'Create Recipe'}
              </Button>
            </div>

            {form.formState.errors.root && (
              <div className="text-destructive text-sm mt-2">
                {form.formState.errors.root.message}
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}