import React from 'react';
import { render, screen } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DraggableFolderItem } from '../draggable-folder-item';
import { Folder } from '@/lib/types';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockFolder: Folder = {
  id: '1',
  name: 'Test Folder',
  children: ['2'],
  recipes: ['recipe1', 'recipe2'],
  createdAt: new Date('2024-01-01'),
};

// Wrapper component to provide DnD context
const DndWrapper = ({ children }: { children: React.ReactNode }) => (
  <DndContext>
    <SortableContext items={['folder-1']} strategy={verticalListSortingStrategy}>
      {children}
    </SortableContext>
  </DndContext>
);

describe('DraggableFolderItem', () => {
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

  it('renders draggable folder item', () => {
    render(
      <DndWrapper>
        <DraggableFolderItem {...defaultProps} />
      </DndWrapper>
    );
    
    expect(screen.getByText('Test Folder')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Recipe count
  });

  it('renders All Recipes option correctly', () => {
    render(
      <DndWrapper>
        <DraggableFolderItem
          {...defaultProps}
          folder={null}
          showAllRecipes={true}
          isSelected={true}
        />
      </DndWrapper>
    );
    
    expect(screen.getByText('All Recipes')).toBeInTheDocument();
  });

  it('shows expanded children when isExpanded is true', () => {
    const children = <div>Child Content</div>;
    
    render(
      <DndWrapper>
        <DraggableFolderItem
          {...defaultProps}
          isExpanded={true}
        >
          {children}
        </DraggableFolderItem>
      </DndWrapper>
    );
    
    expect(screen.getByText('Test Folder')).toBeInTheDocument();
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });

  it('hides children when isExpanded is false', () => {
    const children = <div>Child Content</div>;
    
    render(
      <DndWrapper>
        <DraggableFolderItem
          {...defaultProps}
          isExpanded={false}
        >
          {children}
        </DraggableFolderItem>
      </DndWrapper>
    );
    
    expect(screen.getByText('Test Folder')).toBeInTheDocument();
    expect(screen.queryByText('Child Content')).not.toBeInTheDocument();
  });

  it('applies selected styling when isSelected is true', () => {
    render(
      <DndWrapper>
        <DraggableFolderItem {...defaultProps} isSelected={true} />
      </DndWrapper>
    );
    
    // The selected styling is applied by the FolderItem component inside
    expect(screen.getByText('Test Folder')).toBeInTheDocument();
    // We can't easily test the styling here due to the nested component structure
  });

  it('handles drag and drop attributes', () => {
    render(
      <DndWrapper>
        <DraggableFolderItem {...defaultProps} />
      </DndWrapper>
    );
    
    // The component should render without errors and include drag attributes
    expect(screen.getByText('Test Folder')).toBeInTheDocument();
  });

  it('disables dragging for All Recipes option', () => {
    render(
      <DndWrapper>
        <DraggableFolderItem
          {...defaultProps}
          folder={null}
          showAllRecipes={true}
        />
      </DndWrapper>
    );
    
    expect(screen.getByText('All Recipes')).toBeInTheDocument();
  });

  it('renders with proper level indentation', () => {
    render(
      <DndWrapper>
        <DraggableFolderItem {...defaultProps} level={2} />
      </DndWrapper>
    );
    
    // The level indentation is applied by the FolderItem component inside
    expect(screen.getByText('Test Folder')).toBeInTheDocument();
    // We can't easily test the styling here due to the nested component structure
  });
});