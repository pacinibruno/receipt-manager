'use client';

import React from 'react';
import { BarChart3, TrendingUp, Tag as TagIcon, AlertCircle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface TagStatistics {
  totalTags: number;
  mostUsedTags: Array<{ id: string; name: string; count: number; color?: string }>;
  recentlyUsedTags: Array<{ id: string; name: string; count: number; color?: string }>;
  unusedTags: Array<{ id: string; name: string; count: number; color?: string }>;
  tagUsageByMonth: Array<{ month: string; count: number }>;
}

interface TagStatisticsProps {
  tagStats: TagStatistics;
}

export function TagStatistics({ tagStats }: TagStatisticsProps) {
  const {
    totalTags,
    mostUsedTags,
    recentlyUsedTags,
    unusedTags,
    tagUsageByMonth,
  } = tagStats;

  // Calculate usage percentage for most used tags
  const maxUsage = mostUsedTags[0]?.count || 1;

  // Calculate trend for tag usage (comparing last 3 months vs previous 3 months)
  const recentMonths = tagUsageByMonth.slice(-3);
  const previousMonths = tagUsageByMonth.slice(-6, -3);
  const recentAverage = recentMonths.reduce((sum, month) => sum + month.count, 0) / 3;
  const previousAverage = previousMonths.reduce((sum, month) => sum + month.count, 0) / 3;
  const trend = previousAverage > 0 ? ((recentAverage - previousAverage) / previousAverage) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tags</p>
                <p className="text-2xl font-bold">{totalTags}</p>
              </div>
              <TagIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Most Used</p>
                <p className="text-2xl font-bold">{mostUsedTags[0]?.count || 0}</p>
                <p className="text-xs text-muted-foreground">
                  {mostUsedTags[0]?.name || 'N/A'}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unused Tags</p>
                <p className="text-2xl font-bold">{unusedTags.length}</p>
                <p className="text-xs text-muted-foreground">
                  {totalTags > 0 ? `${Math.round((unusedTags.length / totalTags) * 100)}%` : '0%'} of total
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Usage Trend</p>
                <p className={`text-2xl font-bold ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">Last 3 months</p>
              </div>
              <TrendingUp className={`h-8 w-8 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Most Used Tags */}
      <Card>
        <CardHeader>
          <CardTitle>Most Used Tags</CardTitle>
        </CardHeader>
        <CardContent>
          {mostUsedTags.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No tag usage data available</p>
          ) : (
            <div className="space-y-4">
              {mostUsedTags.map((tag, index) => (
                <div key={tag.id} className="flex items-center gap-4">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-sm font-medium text-muted-foreground w-6">
                      #{index + 1}
                    </span>
                    <div
                      className="w-3 h-3 rounded-full border flex-shrink-0"
                      style={{ backgroundColor: tag.color || '#6b7280' }}
                    />
                    <span className="font-medium truncate">{tag.name}</span>
                  </div>
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Progress 
                      value={(tag.count / maxUsage) * 100} 
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-12 text-right">
                      {tag.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recently Used Tags */}
      <Card>
        <CardHeader>
          <CardTitle>Recently Active Tags</CardTitle>
        </CardHeader>
        <CardContent>
          {recentlyUsedTags.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No recent tag activity</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {recentlyUsedTags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="flex items-center gap-1"
                  style={{
                    backgroundColor: tag.color ? `${tag.color}20` : undefined,
                    borderColor: tag.color || undefined,
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: tag.color || '#6b7280' }}
                  />
                  {tag.name} ({tag.count})
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tag Usage Over Time */}
      <Card>
        <CardHeader>
          <CardTitle>Tag Usage Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          {tagUsageByMonth.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No usage data available</p>
          ) : (
            <div className="space-y-3">
              {tagUsageByMonth.map((monthData, index) => {
                const maxMonthlyUsage = Math.max(...tagUsageByMonth.map(m => m.count));
                const percentage = maxMonthlyUsage > 0 ? (monthData.count / maxMonthlyUsage) * 100 : 0;
                
                return (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-20 text-sm font-medium text-muted-foreground">
                      {monthData.month}
                    </div>
                    <div className="flex-1 flex items-center gap-3">
                      <Progress value={percentage} className="flex-1" />
                      <span className="text-sm font-medium w-8 text-right">
                        {monthData.count}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unused Tags */}
      {unusedTags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Unused Tags ({unusedTags.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {unusedTags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="flex items-center gap-1 opacity-60"
                  style={{
                    borderColor: tag.color || undefined,
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: tag.color || '#6b7280' }}
                  />
                  {tag.name}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              These tags haven't been used in any recipes yet. Consider removing unused tags to keep your collection organized.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}