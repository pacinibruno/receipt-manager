'use client';

import React, { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Folder, Recipe } from '@/lib/types';
import { FolderTree } from './folder-tree';
import { DraggableFolderItem } from './draggable-folder-item';
import { useFolders } from '@/hooks/use-folders';

interface DraggableFolderTreeProps {
  folders?: Folder[];
  selectedFolderId?: string;
  onFolderSelect?: (folderId: string | undefined) => void;
  onRecipeMove?: (recipeId: string, newFolderId?: string) => void;
  className?: string;
  showManagement?: boolean;
}

export function DraggableFolderTree({
  folders: propFolders,
  selectedFolderId,
  onFolderSelect,
  onRecipeMove,
  className,
  showManagement = true,
}: DraggableFolderTreeProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<{ type: 'folder' | 'recipe'; data: any } | null>(null);

  const {
    folders: hookFolders,
    moveFolder,
  } = useFolders();

  // Use prop folders if provided, otherwise use hook folders
  const folders = propFolders || hookFolders;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);

    // Determine what's being dragged
    const draggedId = active.id as string;
    
    if (draggedId.startsWith('folder-')) {
      const folderId = draggedId.replace('folder-', '');
      const folder = folders.find(f => f.id === folderId);
      if (folder) {
        setDraggedItem({ type: 'folder', data: folder });
      }
    } else if (draggedId.startsWith('recipe-')) {
      const recipeId = draggedId.replace('recipe-', '');
      // For now, we'll handle recipe dragging in a future implementation
      setDraggedItem({ type: 'recipe', data: { id: recipeId } });
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Handle drag over logic if needed
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    setDraggedItem(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Handle folder dragging
    if (activeId.startsWith('folder-') && overId.startsWith('folder-')) {
      const draggedFolderId = activeId.replace('folder-', '');
      const targetFolderId = overId.replace('folder-', '');

      if (draggedFolderId !== targetFolderId) {
        try {
          // Move folder to be a child of the target folder
          await moveFolder(draggedFolderId, targetFolderId);
        } catch (error) {
          console.error('Failed to move folder:', error);
        }
      }
    }
    
    // Handle folder dragging to root
    if (activeId.startsWith('folder-') && overId === 'root') {
      const draggedFolderId = activeId.replace('folder-', '');
      
      try {
        // Move folder to root level
        await moveFolder(draggedFolderId, undefined);
      } catch (error) {
        console.error('Failed to move folder to root:', error);
      }
    }

    // Handle recipe dragging to folders
    if (activeId.startsWith('recipe-') && overId.startsWith('folder-')) {
      const recipeId = activeId.replace('recipe-', '');
      const targetFolderId = overId.replace('folder-', '');

      if (onRecipeMove) {
        try {
          await onRecipeMove(recipeId, targetFolderId);
        } catch (error) {
          console.error('Failed to move recipe:', error);
        }
      }
    }

    // Handle recipe dragging to root
    if (activeId.startsWith('recipe-') && overId === 'root') {
      const recipeId = activeId.replace('recipe-', '');

      if (onRecipeMove) {
        try {
          await onRecipeMove(recipeId, undefined);
        } catch (error) {
          console.error('Failed to move recipe to root:', error);
        }
      }
    }
  };

  // Get all folder IDs for sortable context
  const folderIds = folders.map(folder => `folder-${folder.id}`);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={folderIds} strategy={verticalListSortingStrategy}>
        <div className={className}>
          {/* Drop zone for root level */}
          <div
            id="root"
            className="min-h-2 w-full"
            style={{ 
              backgroundColor: activeId && draggedItem ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              borderRadius: '4px',
              marginBottom: '4px'
            }}
          />
          
          <FolderTree
            folders={folders}
            selectedFolderId={selectedFolderId}
            onFolderSelect={onFolderSelect}
            showManagement={showManagement}
          />
        </div>
      </SortableContext>

      <DragOverlay>
        {activeId && draggedItem ? (
          <div className="bg-background border border-border rounded-md p-2 shadow-lg">
            {draggedItem.type === 'folder' ? (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">📁 {draggedItem.data.name}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">📄 Recipe</span>
              </div>
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}