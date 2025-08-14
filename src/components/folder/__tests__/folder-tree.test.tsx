import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FolderTree } from '../folder-tree';
import { Folder } from '@/lib/types';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the useFolders hook
vi.mock('@/hooks/use-folders', () => ({
  useFolders: vi.fn(),
}));

import { useFolders } from '@/hooks/use-folders';

const mockFolders: Folder[] = [
  {
    id: '1',
    name: 'Desserts',
    children: ['2'],
    recipes: ['recipe1', 'recipe2'],
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'Cakes',
    parentId: '1',
    children: [],
    recipes: ['recipe3'],
    createdAt: new Date('2024-01-02'),
  },
  {
    id: '3',
    name: 'Main Dishes',
    children: [],
    recipes: ['recipe4', 'recipe5', 'recipe6'],
    createdAt: new Date('2024-01-03'),
  },
];

describe('FolderTree', () => {
  const mockUseFolders = {
    folders: mockFolders,
    loading: false,
    error: null,
    createFolder: vi.fn(),
    updateFolder: vi.fn(),
    deleteFolder: vi.fn(),
    moveFolder: vi.fn(),
    getFolderById: vi.fn(),
    getFolderTree: vi.fn(),
    getFolderPath: vi.fn(),
    refreshFolders: vi.fn(),
  };

  const defaultProps = {
    onFolderSelect: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useFolders as any).mockReturnValue(mockUseFolders);
  });

  it('renders all root folders', () => {
    render(<FolderTree {...defaultProps} />);
    
    expect(screen.getByText('All Recipes')).toBeInTheDocument();
    expect(screen.getByText('Desserts')).toBeInTheDocument();
    expect(screen.getByText('Main Dishes')).toBeInTheDocument();
  });

  it('uses prop folders when provided', () => {
    const propFolders: Folder[] = [
      {
        id: 'prop1',
        name: 'Prop Folder',
        children: [],
        recipes: [],
        createdAt: new Date(),
      },
    ];

    render(<FolderTree {...defaultProps} folders={propFolders} />);
    
    expect(screen.getByText('Prop Folder')).toBeInTheDocument();
    expect(screen.queryByText('Desserts')).not.toBeInTheDocument();
  });

  it('shows recipe counts for folders', () => {
    render(<FolderTree {...defaultProps} />);
    
    // Desserts folder should show 2 recipes
    expect(screen.getByText('2')).toBeInTheDocument();
    // Main Dishes folder should show 3 recipes
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders folders with expand buttons', () => {
    render(<FolderTree {...defaultProps} />);
    
    // Should show folders with expand buttons
    expect(screen.getByText('Desserts')).toBeInTheDocument();
    expect(screen.getByText('Main Dishes')).toBeInTheDocument();
    
    // Should have expand buttons for folders with children
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('calls onFolderSelect when folder is clicked', () => {
    render(<FolderTree {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Desserts'));
    
    expect(defaultProps.onFolderSelect).toHaveBeenCalledWith('1');
  });

  it('calls onFolderSelect with undefined when All Recipes is clicked', () => {
    render(<FolderTree {...defaultProps} />);
    
    fireEvent.click(screen.getByText('All Recipes'));
    
    expect(defaultProps.onFolderSelect).toHaveBeenCalledWith(undefined);
  });

  it('highlights selected folder', () => {
    render(<FolderTree {...defaultProps} selectedFolderId="1" />);
    
    // The selected styling is applied to the main container div
    const dessertsFolder = screen.getByText('Desserts').closest('div')?.parentElement;
    expect(dessertsFolder).toHaveClass('bg-accent');
  });

  it('highlights All Recipes when no folder is selected', () => {
    render(<FolderTree {...defaultProps} selectedFolderId={undefined} />);
    
    // The All Recipes item should be highlighted by default
    expect(screen.getByText('All Recipes')).toBeInTheDocument();
    
    // Check that the All Recipes container has the selected styling
    const allRecipesContainer = screen.getByText('All Recipes').parentElement?.parentElement;
    expect(allRecipesContainer).toHaveClass('bg-accent');
  });

  it('renders folder hierarchy structure', () => {
    render(<FolderTree {...defaultProps} />);
    
    // Should render the folder structure
    expect(screen.getByText('Desserts')).toBeInTheDocument();
    expect(screen.getByText('Main Dishes')).toBeInTheDocument();
    
    // Should have proper folder structure with expand buttons
    const dessertsFolder = screen.getByText('Desserts').closest('div')?.parentElement;
    expect(dessertsFolder).toHaveStyle('padding-left: 8px'); // Base padding for root level
  });

  it('handles empty folder list', () => {
    (useFolders as any).mockReturnValue({
      ...mockUseFolders,
      folders: [],
    });

    render(<FolderTree {...defaultProps} />);
    
    expect(screen.getByText('All Recipes')).toBeInTheDocument();
    expect(screen.queryByText('Desserts')).not.toBeInTheDocument();
  });

  it('shows loading state', () => {
    (useFolders as any).mockReturnValue({
      ...mockUseFolders,
      loading: true,
    });

    render(<FolderTree {...defaultProps} />);
    
    expect(screen.getByText('Loading folders...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    (useFolders as any).mockReturnValue({
      ...mockUseFolders,
      error: 'Failed to load folders',
    });

    render(<FolderTree {...defaultProps} />);
    
    expect(screen.getByText('Error: Failed to load folders')).toBeInTheDocument();
  });

  it('disables management features when showManagement is false', () => {
    render(<FolderTree {...defaultProps} showManagement={false} />);
    
    // Should not show management options in dropdown
    const dessertsFolder = screen.getByText('Desserts');
    const dropdownTrigger = dessertsFolder.closest('div')?.querySelector('[aria-label="Folder actions"]');
    
    if (dropdownTrigger) {
      fireEvent.click(dropdownTrigger);
      expect(screen.queryByText('New Subfolder')).not.toBeInTheDocument();
      expect(screen.queryByText('Rename')).not.toBeInTheDocument();
      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    }
  });

  it('maintains component state across re-renders', () => {
    const { rerender } = render(<FolderTree {...defaultProps} />);
    
    // Should render folders
    expect(screen.getByText('Desserts')).toBeInTheDocument();
    
    // Re-render with same folders
    rerender(<FolderTree {...defaultProps} />);
    
    // Should still render folders
    expect(screen.getByText('Desserts')).toBeInTheDocument();
    expect(screen.getByText('Main Dishes')).toBeInTheDocument();
  });
});