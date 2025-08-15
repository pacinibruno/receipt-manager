'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Hash } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

import { useTags } from '@/hooks/use-tags';
import { Tag } from '@/lib/types';

interface EnhancedTagInputProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  maxTags?: number;
  allowCustomTags?: boolean;
  showPopularTags?: boolean;
}

export function EnhancedTagInput({
  selectedTags,
  onTagsChange,
  placeholder = "Type to add tags...",
  disabled = false,
  maxTags,
  allowCustomTags = true,
  showPopularTags = true,
}: EnhancedTagInputProps) {
  const {
    tags,
    getSuggestedTags,
    getPopularTags,
    addTag,
  } = useTags();

  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Get popular tags for quick selection
  const popularTags = getPopularTags(8).filter(tag => !selectedTags.includes(tag.name));

  // Update suggestions based on input
  useEffect(() => {
    if (inputValue.trim()) {
      const suggested = getSuggestedTags(inputValue, selectedTags);
      setSuggestions(suggested);
      setShowSuggestions(suggested.length > 0);
      setActiveSuggestionIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
    }
  }, [inputValue, selectedTags, getSuggestedTags]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (activeSuggestionIndex >= 0 && suggestions[activeSuggestionIndex]) {
          addTagFromSuggestion(suggestions[activeSuggestionIndex]);
        } else if (inputValue.trim()) {
          addCustomTag(inputValue.trim());
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        setActiveSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setActiveSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
        break;

      case 'Escape':
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
        break;

      case 'Backspace':
        if (!inputValue && selectedTags.length > 0) {
          removeTag(selectedTags[selectedTags.length - 1]);
        }
        break;

      case 'Tab':
        if (showSuggestions && activeSuggestionIndex >= 0) {
          e.preventDefault();
          addTagFromSuggestion(suggestions[activeSuggestionIndex]);
        }
        break;
    }
  };

  // Add tag from suggestion
  const addTagFromSuggestion = (tag: Tag) => {
    if (canAddTag(tag.name)) {
      const newTags = [...selectedTags, tag.name];
      onTagsChange(newTags);
      setInputValue('');
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
    }
  };

  // Add custom tag
  const addCustomTag = async (tagName: string) => {
    if (!allowCustomTags || !canAddTag(tagName)) return;

    try {
      // Create the tag if it doesn't exist
      const existingTag = tags.find(t => t.name.toLowerCase() === tagName.toLowerCase());
      if (!existingTag) {
        await addTag({ name: tagName });
      }

      const newTags = [...selectedTags, tagName];
      onTagsChange(newTags);
      setInputValue('');
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
    } catch (error) {
      console.error('Failed to add custom tag:', error);
    }
  };

  // Check if tag can be added
  const canAddTag = (tagName: string): boolean => {
    if (!tagName.trim()) return false;
    if (selectedTags.includes(tagName)) return false;
    if (maxTags && selectedTags.length >= maxTags) return false;
    return true;
  };

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    if (disabled) return;
    const newTags = selectedTags.filter(tag => tag !== tagToRemove);
    onTagsChange(newTags);
  };

  // Handle suggestion click
  const handleSuggestionClick = (tag: Tag) => {
    addTagFromSuggestion(tag);
  };

  // Handle popular tag click
  const handlePopularTagClick = (tag: Tag) => {
    if (canAddTag(tag.name)) {
      const newTags = [...selectedTags, tag.name];
      onTagsChange(newTags);
    }
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (inputValue.trim() && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  // Handle input blur
  const handleInputBlur = (e: React.FocusEvent) => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(e.relatedTarget as Node)) {
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
      }
    }, 200);
  };

  return (
    <div className="space-y-3">
      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tagName) => {
            const tag = tags.find(t => t.name === tagName);
            return (
              <Badge
                key={tagName}
                variant="secondary"
                className="flex items-center gap-1 pr-1"
                style={{
                  backgroundColor: tag?.color ? `${tag.color}20` : undefined,
                  borderColor: tag?.color || undefined,
                }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: tag?.color || '#6b7280' }}
                />
                {tagName}
                {!disabled && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => removeTag(tagName)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </Badge>
            );
          })}
        </div>
      )}

      {/* Input Field */}
      <div className="relative">
        <div className="relative">
          <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            disabled={disabled}
            className="pl-10"
          />
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto"
          >
            {suggestions.map((tag, index) => (
              <button
                key={tag.id}
                type="button"
                className={`w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground flex items-center gap-2 ${
                  index === activeSuggestionIndex ? 'bg-accent text-accent-foreground' : ''
                }`}
                onClick={() => handleSuggestionClick(tag)}
              >
                <div
                  className="w-3 h-3 rounded-full border flex-shrink-0"
                  style={{ backgroundColor: tag.color || '#6b7280' }}
                />
                <span className="flex-1">{tag.name}</span>
                {tag.count > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {tag.count} recipe{tag.count !== 1 ? 's' : ''}
                  </span>
                )}
              </button>
            ))}
            
            {/* Add custom tag option */}
            {allowCustomTags && inputValue.trim() && !suggestions.some(s => s.name.toLowerCase() === inputValue.toLowerCase()) && (
              <button
                type="button"
                className={`w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground flex items-center gap-2 border-t ${
                  activeSuggestionIndex === suggestions.length ? 'bg-accent text-accent-foreground' : ''
                }`}
                onClick={() => addCustomTag(inputValue.trim())}
              >
                <Plus className="w-3 h-3 flex-shrink-0" />
                <span>Create "{inputValue.trim()}"</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Popular Tags */}
      {showPopularTags && popularTags.length > 0 && selectedTags.length === 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Popular tags:</Label>
          <div className="flex flex-wrap gap-2">
            {popularTags.map((tag) => (
              <Button
                key={tag.id}
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => handlePopularTagClick(tag)}
                disabled={disabled}
                style={{
                  borderColor: tag.color || undefined,
                }}
              >
                <div
                  className="w-2 h-2 rounded-full mr-1"
                  style={{ backgroundColor: tag.color || '#6b7280' }}
                />
                {tag.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Max tags warning */}
      {maxTags && selectedTags.length >= maxTags && (
        <p className="text-sm text-muted-foreground">
          Maximum of {maxTags} tags allowed.
        </p>
      )}
    </div>
  );
}