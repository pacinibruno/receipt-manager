'use client';

import React, { useState } from 'react';
import { Folder } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ChevronRight,
  ChevronDown,
  Folder as FolderIcon,
  FolderOpen,
  MoreHorizontal,
  Plus,
  Edit,
  Trash2,
  Move,
  Home,
  Check,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FolderItemProps {
  folder: Folder | null; // null for "All Recipes" option
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
}

export function FolderItem({
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
}: FolderItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      onToggle();
    }
  };

  const handleSelect = () => {
    onSelect();
  };

  const handleCreateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNewFolderName('');
    setShowCreateDialog(true);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (folder) {
      setEditName(folder.name);
      setIsEditing(true);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleMoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedParentId(folder?.parentId);
    setShowMoveDialog(true);
  };

  const handleCreateSubmit = async () => {
    if (!newFolderName.trim() || !onCreate) return;
    
    try {
      setIsLoading(true);
      await onCreate(newFolderName.trim(), folder?.id);
      setShowCreateDialog(false);
      setNewFolderName('');
    } catch (error) {
      console.error('Failed to create folder:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!editName.trim() || !folder || !onEdit) return;
    
    try {
      setIsLoading(true);
      await onEdit(folder.id, editName.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to edit folder:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditName('');
  };

  const handleDeleteConfirm = async () => {
    if (!folder || !onDelete) return;
    
    try {
      setIsLoading(true);
      await onDelete(folder.id);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Failed to delete folder:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoveConfirm = async () => {
    if (!folder || !onMove) return;
    
    try {
      setIsLoading(true);
      await onMove(folder.id, selectedParentId);
      setShowMoveDialog(false);
    } catch (error) {
      console.error('Failed to move folder:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditSubmit();
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  const handleCreateKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateSubmit();
    }
  };

  // Get available parent folders (excluding self and descendants)
  const getAvailableParents = () => {
    if (!folder) return availableFolders;
    
    const isDescendant = (folderId: string, ancestorId: string): boolean => {
      const targetFolder = availableFolders.find(f => f.id === folderId);
      if (!targetFolder) return false;
      if (targetFolder.parentId === ancestorId) return true;
      if (targetFolder.parentId) return isDescendant(targetFolder.parentId, ancestorId);
      return false;
    };

    return availableFolders.filter(f => 
      f.id !== folder.id && !isDescendant(f.id, folder.id)
    );
  };

  // Special handling for "All Recipes" option
  if (showAllRecipes) {
    return (
      <>
        <div
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors",
            "hover:bg-accent hover:text-accent-foreground",
            isSelected && "bg-accent text-accent-foreground font-medium"
          )}
          onClick={handleSelect}
        >
          <div className="flex items-center gap-1">
            <Home className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">All Recipes</span>
          </div>
          
          {onCreate && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-3 w-3" />
                  <span className="sr-only">Folder actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleCreateClick}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Folder
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Create Folder Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
              <DialogDescription>
                Enter a name for the new folder.
              </DialogDescription>
            </DialogHeader>
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={handleCreateKeyDown}
              placeholder="Folder name"
              autoFocus
            />
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateSubmit}
                disabled={!newFolderName.trim() || isLoading}
              >
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (!folder) return null;

  const paddingLeft = level * 16; // 16px per level

  return (
    <>
      <div
        className={cn(
          "group flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          isSelected && "bg-accent text-accent-foreground font-medium"
        )}
        style={{ paddingLeft: `${paddingLeft + 8}px` }}
        onClick={handleSelect}
      >
        {/* Expand/Collapse button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-4 w-4 p-0 hover:bg-transparent"
          onClick={handleToggle}
          disabled={!hasChildren}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )
          ) : (
            <div className="h-3 w-3" />
          )}
        </Button>

        {/* Folder icon */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isExpanded ? (
            <FolderOpen className="h-4 w-4 text-blue-500 flex-shrink-0" />
          ) : (
            <FolderIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
          )}
          
          {/* Inline editing */}
          {isEditing ? (
            <div className="flex items-center gap-1 flex-1">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={handleEditKeyDown}
                className="h-6 text-sm"
                autoFocus
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={handleEditSubmit}
                disabled={!editName.trim() || isLoading}
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={handleEditCancel}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <>
              <span className="text-sm truncate">{folder.name}</span>
              
              {/* Recipe count */}
              {folder.recipes.length > 0 && (
                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                  {folder.recipes.length}
                </span>
              )}
            </>
          )}
        </div>

        {/* Actions dropdown */}
        {!isEditing && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3 w-3" />
                <span className="sr-only">Folder actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onCreate && (
                <DropdownMenuItem onClick={handleCreateClick}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Subfolder
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={handleEditClick}>
                  <Edit className="mr-2 h-4 w-4" />
                  Rename
                </DropdownMenuItem>
              )}
              {onMove && (
                <DropdownMenuItem onClick={handleMoveClick}>
                  <Move className="mr-2 h-4 w-4" />
                  Move
                </DropdownMenuItem>
              )}
              {(onCreate || onEdit || onMove) && onDelete && (
                <DropdownMenuSeparator />
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={handleDeleteClick}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Create Subfolder Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Subfolder</DialogTitle>
            <DialogDescription>
              Enter a name for the new subfolder in "{folder.name}".
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={handleCreateKeyDown}
            placeholder="Subfolder name"
            autoFocus
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateSubmit}
              disabled={!newFolderName.trim() || isLoading}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Folder Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Folder</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{folder.name}"? This action cannot be undone.
              {folder.children.length > 0 && (
                <span className="block mt-2 text-amber-600">
                  This folder contains {folder.children.length} subfolder(s) that will be moved to the parent folder.
                </span>
              )}
              {folder.recipes.length > 0 && (
                <span className="block mt-2 text-amber-600">
                  This folder contains {folder.recipes.length} recipe(s) that will be moved to the parent folder.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isLoading}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Folder Dialog */}
      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Folder</DialogTitle>
            <DialogDescription>
              Select a new parent folder for "{folder.name}".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="root"
                name="parent"
                checked={selectedParentId === undefined}
                onChange={() => setSelectedParentId(undefined)}
              />
              <label htmlFor="root" className="text-sm">
                Root (No parent)
              </label>
            </div>
            {getAvailableParents().map((parentFolder) => (
              <div key={parentFolder.id} className="flex items-center space-x-2">
                <input
                  type="radio"
                  id={parentFolder.id}
                  name="parent"
                  checked={selectedParentId === parentFolder.id}
                  onChange={() => setSelectedParentId(parentFolder.id)}
                />
                <label htmlFor={parentFolder.id} className="text-sm">
                  {parentFolder.name}
                </label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowMoveDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMoveConfirm}
              disabled={isLoading}
            >
              Move
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}