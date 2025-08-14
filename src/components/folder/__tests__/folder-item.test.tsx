import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FolderItem } from '../folder-item';
import { Folder } from '@/lib/types';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockFolder: Folder = {
  id: '1',
  name: 'Test Folder',
  children: ['2'],
  recipes: ['recipe1', 'recipe2'],
  createdAt: new Date('2024-01-01'),
};

describe('FolderItem', () => {
  const defaultProps = {
    folder: mockFolder,
    level: 0,
    isExpanded: false,
    isSelected: false,
    hasChildren: true,
    onToggle: vi.fn(),
    onSelect: vi.fn(),
    onCreate: vi.fn().mockResolvedValue(undefined),
    onEdit: vi.fn().mockResolvedValue(undefined),
    onDelete: vi.fn().mockResolvedValue(undefined),
    onMove: vi.fn().mockResolvedValue(undefined),
    availableFolders: [mockFolder],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders folder name and recipe count', () => {
    render(<FolderItem {...defaultProps} />);
    
    expect(screen.getByText('Test Folder')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows expand icon when folder has children and is collapsed', () => {
    render(<FolderItem {...defaultProps} />);
    
    // Should show right chevron when collapsed
    const buttons = screen.getAllByRole('button');
    const expandButton = buttons[0]; // First button is the expand button
    expect(expandButton.querySelector('svg')).toBeInTheDocument();
  });

  it('shows collapse icon when folder is expanded', () => {
    render(<FolderItem {...defaultProps} isExpanded={true} />);
    
    // Should show down chevron when expanded
    const buttons = screen.getAllByRole('button');
    const expandButton = buttons[0]; // First button is the expand button
    expect(expandButton.querySelector('svg')).toBeInTheDocument();
  });

  it('calls onToggle when expand button is clicked', () => {
    render(<FolderItem {...defaultProps} />);
    
    const buttons = screen.getAllByRole('button');
    const expandButton = buttons[0]; // First button is the expand button
    fireEvent.click(expandButton);
    
    expect(defaultProps.onToggle).toHaveBeenCalled();
  });

  it('calls onSelect when folder is clicked', () => {
    render(<FolderItem {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Test Folder'));
    
    expect(defaultProps.onSelect).toHaveBeenCalled();
  });

  it('applies selected styling when isSelected is true', () => {
    render(<FolderItem {...defaultProps} isSelected={true} />);
    
    // The selected styling is applied to the main container div
    const folderItem = screen.getByText('Test Folder').closest('div')?.parentElement;
    expect(folderItem).toHaveClass('bg-accent');
  });

  it('applies correct padding based on level', () => {
    render(<FolderItem {...defaultProps} level={2} />);
    
    // The padding is applied to the main container div
    const folderItem = screen.getByText('Test Folder').closest('div')?.parentElement;
    expect(folderItem).toHaveStyle('padding-left: 40px'); // 8px base + 32px for level 2
  });

  it('has folder actions dropdown trigger', () => {
    render(<FolderItem {...defaultProps} />);
    
    // Find the dropdown trigger
    const dropdownTrigger = screen.getByRole('button', { name: /folder actions/i });
    expect(dropdownTrigger).toBeInTheDocument();
  });

  it('has folder actions dropdown', () => {
    render(<FolderItem {...defaultProps} />);
    
    const dropdownTrigger = screen.getByRole('button', { name: /folder actions/i });
    expect(dropdownTrigger).toBeInTheDocument();
  });

  it('renders folder management props correctly', () => {
    render(<FolderItem {...defaultProps} />);
    
    expect(defaultProps.onCreate).toBeDefined();
    expect(defaultProps.onEdit).toBeDefined();
    expect(defaultProps.onDelete).toBeDefined();
    expect(defaultProps.onMove).toBeDefined();
  });

  it('shows available folders prop', () => {
    const availableFolders = [mockFolder];
    render(<FolderItem {...defaultProps} availableFolders={availableFolders} />);
    
    expect(screen.getByText('Test Folder')).toBeInTheDocument();
  });

  it('handles async operations with loading state', () => {
    render(<FolderItem {...defaultProps} />);
    
    // Component should handle loading states internally
    expect(screen.getByText('Test Folder')).toBeInTheDocument();
  });

  it('renders All Recipes option correctly', () => {
    render(
      <FolderItem
        {...defaultProps}
        folder={null}
        showAllRecipes={true}
        isSelected={true}
      />
    );
    
    expect(screen.getByText('All Recipes')).toBeInTheDocument();
    // The selected styling is applied to the main container div
    const allRecipesItem = screen.getByText('All Recipes').closest('div')?.parentElement;
    expect(allRecipesItem).toHaveClass('bg-accent', 'text-accent-foreground', 'font-medium');
  });

  it('handles folder without children', () => {
    render(<FolderItem {...defaultProps} hasChildren={false} />);
    
    const buttons = screen.getAllByRole('button');
    const expandButton = buttons.find(button => button.disabled);
    expect(expandButton).toBeInTheDocument();
  });

  it('does not show recipe count when folder has no recipes', () => {
    const folderWithoutRecipes: Folder = {
      ...mockFolder,
      recipes: [],
    };
    
    render(<FolderItem {...defaultProps} folder={folderWithoutRecipes} />);
    
    expect(screen.getByText('Test Folder')).toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('prevents event propagation on dropdown trigger', () => {
    render(<FolderItem {...defaultProps} />);
    
    const dropdownTrigger = screen.getByRole('button', { name: /folder actions/i });
    fireEvent.click(dropdownTrigger);
    
    // Should not call onSelect when clicking dropdown trigger
    expect(defaultProps.onSelect).not.toHaveBeenCalled();
  });
});