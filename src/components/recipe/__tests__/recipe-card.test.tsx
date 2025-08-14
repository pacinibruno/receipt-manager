import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { RecipeCard } from '../recipe-card';
import { Recipe } from '@/lib/types';
import { vi } from 'vitest';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

const mockPush = vi.fn();
(useRouter as any).mockReturnValue({
  push: mockPush,
});

const mockRecipe: Recipe = {
  id: '1',
  title: 'Test Recipe',
  description: 'A delicious test recipe',
  ingredients: [
    { id: '1', name: 'Flour', amount: '2', unit: 'cups' },
    { id: '2', name: 'Sugar', amount: '1', unit: 'cup' },
    { id: '3', name: 'Eggs', amount: '3', unit: '' },
  ],
  instructions: ['Mix ingredients', 'Bake for 30 minutes'],
  tags: ['dessert', 'easy', 'quick', 'family-friendly'],
  prepTime: 15,
  cookTime: 30,
  servings: 8,
  difficulty: 'Easy',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('RecipeCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders recipe information correctly', () => {
    render(<RecipeCard recipe={mockRecipe} />);
    
    expect(screen.getByText('Test Recipe')).toBeInTheDocument();
    expect(screen.getByText('A delicious test recipe')).toBeInTheDocument();
    expect(screen.getByText('15m')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('Easy')).toBeInTheDocument();
  });

  it('displays tags correctly with overflow handling', () => {
    render(<RecipeCard recipe={mockRecipe} />);
    
    // Should show first 3 tags
    expect(screen.getByText('dessert')).toBeInTheDocument();
    expect(screen.getByText('easy')).toBeInTheDocument();
    expect(screen.getByText('quick')).toBeInTheDocument();
    
    // Should show +1 for the remaining tag
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('displays ingredients preview', () => {
    render(<RecipeCard recipe={mockRecipe} />);
    
    expect(screen.getByText(/3 ingredients/)).toBeInTheDocument();
    expect(screen.getByText(/Flour, Sugar/)).toBeInTheDocument();
  });

  it('navigates to recipe page when card is clicked', () => {
    render(<RecipeCard recipe={mockRecipe} />);
    
    fireEvent.click(screen.getByText('Test Recipe'));
    
    expect(mockPush).toHaveBeenCalledWith('/recipe/1');
  });

  it('shows dropdown menu on hover and handles actions', async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    
    render(
      <RecipeCard 
        recipe={mockRecipe} 
        onEdit={onEdit} 
        onDelete={onDelete} 
      />
    );
    
    // Find and click the dropdown trigger
    const dropdownTrigger = screen.getByRole('button', { name: /recipe actions/i });
    fireEvent.click(dropdownTrigger);
    
    await waitFor(() => {
      expect(screen.getByText('View')).toBeInTheDocument();
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });
  });

  it('calls onEdit when edit is clicked', async () => {
    const onEdit = vi.fn();
    
    render(<RecipeCard recipe={mockRecipe} onEdit={onEdit} />);
    
    const dropdownTrigger = screen.getByRole('button', { name: /recipe actions/i });
    fireEvent.click(dropdownTrigger);
    
    await waitFor(() => {
      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);
    });
    
    expect(onEdit).toHaveBeenCalledWith(mockRecipe);
  });

  it('calls onDelete when delete is clicked', async () => {
    const onDelete = vi.fn();
    
    render(<RecipeCard recipe={mockRecipe} onDelete={onDelete} />);
    
    const dropdownTrigger = screen.getByRole('button', { name: /recipe actions/i });
    fireEvent.click(dropdownTrigger);
    
    await waitFor(() => {
      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);
    });
    
    expect(onDelete).toHaveBeenCalledWith('1');
  });

  it('handles recipe without optional fields', () => {
    const minimalRecipe: Recipe = {
      id: '2',
      title: 'Minimal Recipe',
      ingredients: [],
      instructions: [],
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    render(<RecipeCard recipe={minimalRecipe} />);
    
    expect(screen.getByText('Minimal Recipe')).toBeInTheDocument();
    expect(screen.getByText(/0 ingredients/)).toBeInTheDocument();
  });

  it('formats time correctly for different durations', () => {
    const recipeWithLongTime: Recipe = {
      ...mockRecipe,
      prepTime: 90, // 1h 30m
    };
    
    render(<RecipeCard recipe={recipeWithLongTime} />);
    
    expect(screen.getByText('1h 30m')).toBeInTheDocument();
  });

  it('applies correct difficulty colors', () => {
    const hardRecipe: Recipe = {
      ...mockRecipe,
      difficulty: 'Hard',
    };
    
    render(<RecipeCard recipe={hardRecipe} />);
    
    const difficultyBadge = screen.getByText('Hard');
    expect(difficultyBadge).toHaveClass('bg-red-100', 'text-red-800');
  });

  it('prevents event propagation on dropdown actions', async () => {
    const onEdit = vi.fn();
    
    render(<RecipeCard recipe={mockRecipe} onEdit={onEdit} />);
    
    const dropdownTrigger = screen.getByRole('button', { name: /recipe actions/i });
    fireEvent.click(dropdownTrigger);
    
    // Should not navigate when clicking dropdown trigger
    expect(mockPush).not.toHaveBeenCalled();
    
    await waitFor(() => {
      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);
    });
    
    // Should not navigate when clicking edit
    expect(mockPush).not.toHaveBeenCalled();
    expect(onEdit).toHaveBeenCalled();
  });
});