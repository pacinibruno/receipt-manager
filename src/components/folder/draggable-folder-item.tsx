'use client';

import React from 'react';
import {
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { Folder } from '@/lib/types';
import { FolderItem } from './folder-item';
import { cn } from '@/lib/utils';

interface DraggableFolderItemProps {
  folder: Folder | null;
  level: number;
  isExpanded: boolean;
  isSelected: boolean;
  hasChildren: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onCreate?: (name: string, parentId?: string) => Promise<void>;
  onEdit?: (folderId: string, newName: string) => Promise<void>;
  onDelete?: (folderId: string) => Promise<void>;
  onMove?: (folderId: string, newParentId?: string) => Promise<void>;
  showAllRecipes?: boolean;
  availableFolders?: Folder[];
  children?: React.ReactNode;
}

export function DraggableFolderItem({
  folder,
  level,
  isExpanded,
  isSelected,
  hasChildren,
  onToggle,
  onSelect,
  onCreate,
  onEdit,
  onDelete,
  onMove,
  showAllRecipes = false,
  availableFolders = [],
  children,
}: DraggableFolderItemProps) {
  const folderId = folder ? `folder-${folder.id}` : 'all-recipes';
  
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: folderId,
    disabled: showAllRecipes, // Don't allow dragging "All Recipes"
  });

  const {
    setNodeRef: setDroppableRef,
    isOver,
  } = useDroppable({
    id: folderId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Combine refs
  const setNodeRef = (node: HTMLElement | null) => {
    setSortableRef(node);
    setDroppableRef(node);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative',
        isDragging && 'opacity-50',
        isOver && 'bg-blue-50 dark:bg-blue-950/20 rounded-md'
      )}
      {...attributes}
      {...listeners}
    >
      <FolderItem
        folder={folder}
        level={level}
        isExpanded={isExpanded}
        isSelected={isSelected}
        hasChildren={hasChildren}
        onToggle={onToggle}
        onSelect={onSelect}
        onCreate={onCreate}
        onEdit={onEdit}
        onDelete={onDelete}
        onMove={onMove}
        showAllRecipes={showAllRecipes}
        availableFolders={availableFolders}
      />
      
      {/* Render children (subfolders) */}
      {isExpanded && children && (
        <div className="ml-4">
          {children}
        </div>
      )}
      
      {/* Drop indicator */}
      {isOver && (
        <div className="absolute inset-0 border-2 border-blue-500 border-dashed rounded-md pointer-events-none" />
      )}
    </div>
  );
}