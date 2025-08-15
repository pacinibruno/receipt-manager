'use client';

import React, { useState } from 'react';
import { Plus, Search, BarChart3, Palette, Trash2, Edit2, Tag as TagIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

import { useTags } from '@/hooks/use-tags';
import { Tag } from '@/lib/types';
import { TagForm } from './tag-form';
import { TagStatistics } from './tag-statistics';
import { TagColorPicker } from './tag-color-picker';

interface TagManagementProps {
  onTagSelect?: (tag: Tag) => void;
  selectedTags?: string[];
  showStatistics?: boolean;
}

export function TagManagement({ 
  onTagSelect, 
  selectedTags = [], 
  showStatistics = true 
}: TagManagementProps) {
  const {
    tags,
    loading,
    error,
    tagStats,
    addTag,
    editTag,
    removeTag,
    getSuggestedTags,
    getPopularTags,
    clearError,
  } = useTags();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'count' | 'recent'>('count');

  // Filter and sort tags based on search and sort criteria
  const filteredAndSortedTags = React.useMemo(() => {
    let filtered = tags;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = tags.filter(tag =>
        tag.name.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'count':
          return b.count - a.count;
        case 'recent':
          // For recent, we'll use the tag count as a proxy since we don't have last used date
          return b.count - a.count;
        default:
          return 0;
      }
    });
  }, [tags, searchQuery, sortBy]);

  const handleAddTag = async (input: { name: string; color?: string }) => {
    try {
      await addTag(input);
      setShowAddDialog(false);
    } catch (error) {
      console.error('Failed to add tag:', error);
    }
  };

  const handleEditTag = async (input: { name: string; color?: string }) => {
    if (!editingTag) return;
    
    try {
      await editTag(editingTag.id, input);
      setEditingTag(null);
      setShowEditDialog(false);
    } catch (error) {
      console.error('Failed to edit tag:', error);
    }
  };

  const handleDeleteTag = async (tag: Tag) => {
    if (window.confirm(`Are you sure you want to delete the tag "${tag.name}"? This will remove it from all recipes.`)) {
      try {
        await removeTag(tag.id);
      } catch (error) {
        console.error('Failed to delete tag:', error);
      }
    }
  };

  const handleTagClick = (tag: Tag) => {
    if (onTagSelect) {
      onTagSelect(tag);
    }
  };

  const openEditDialog = (tag: Tag) => {
    setEditingTag(tag);
    setShowEditDialog(true);
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            <p>Error loading tags: {error}</p>
            <Button onClick={clearError} className="mt-2">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TagIcon className="h-5 w-5" />
          <h2 className="text-2xl font-bold">Tag Management</h2>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Tag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Tag</DialogTitle>
            </DialogHeader>
            <TagForm onSubmit={handleAddTag} onCancel={() => setShowAddDialog(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="manage" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manage">Manage Tags</TabsTrigger>
          {showStatistics && (
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="manage" className="space-y-4">
          {/* Search and Filter Controls */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant={sortBy === 'name' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSortBy('name')}
                  >
                    Name
                  </Button>
                  <Button
                    variant={sortBy === 'count' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSortBy('count')}
                  >
                    Usage
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Popular Tags Section */}
          {!searchQuery && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Popular Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {getPopularTags(10).map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className="cursor-pointer hover:bg-accent"
                      style={{
                        backgroundColor: tag.color ? `${tag.color}20` : undefined,
                        borderColor: tag.color || undefined,
                      }}
                      onClick={() => handleTagClick(tag)}
                    >
                      {tag.name} ({tag.count})
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Tags List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                All Tags ({filteredAndSortedTags.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <p>Loading tags...</p>
                </div>
              ) : filteredAndSortedTags.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'No tags found matching your search.' : 'No tags created yet.'}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAndSortedTags.map((tag) => (
                    <div
                      key={tag.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full border"
                          style={{
                            backgroundColor: tag.color || '#6b7280',
                          }}
                        />
                        <div>
                          <span
                            className={`font-medium cursor-pointer hover:underline ${
                              selectedTags.includes(tag.name) ? 'text-primary' : ''
                            }`}
                            onClick={() => handleTagClick(tag)}
                          >
                            {tag.name}
                          </span>
                          <p className="text-sm text-muted-foreground">
                            Used in {tag.count} recipe{tag.count !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(tag)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTag(tag)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {showStatistics && (
          <TabsContent value="statistics">
            <TagStatistics tagStats={tagStats} />
          </TabsContent>
        )}
      </Tabs>

      {/* Edit Tag Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
          </DialogHeader>
          {editingTag && (
            <TagForm
              tag={editingTag}
              onSubmit={handleEditTag}
              onCancel={() => {
                setEditingTag(null);
                setShowEditDialog(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}