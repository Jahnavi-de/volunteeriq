'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, TrendingUp, Users, CheckCircle2, Clock } from 'lucide-react';
import { AppLayout } from '@/components/app-layout';
import { StatCard } from '@/components/stat-card';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getDashboardStats, getNeeds } from '@/lib/api';
import { getUrgencyColor, getStatusBadgeColor, formatDate } from '@/lib/helpers';
import type { DashboardStats, Need } from '@/lib/types';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [criticalNeeds, setCriticalNeeds] = useState<Need[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [statsData, needsData] = await Promise.all([
          getDashboardStats(),
          getNeeds({ minUrgency: 7 }),
        ]);
        setStats(statsData);
        setCriticalNeeds(needsData.slice(0, 5));
        setError(null);
      } catch (err) {
        console.error('[v0] Dashboard loading error:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Real-time volunteer coordination overview</p>
        </div>

        {/* Error state */}
        {error && (
          <Card className="bg-red-900/10 border-red-700/30 p-4 mb-6">
            <p className="text-red-300 text-sm">{error}</p>
          </Card>
        )}

        {/* Stats Grid */}
        {stats && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <StatCard
              label="Total Needs"
              value={stats.totalNeeds}
              icon={AlertCircle}
              description={`${stats.assignedNeeds} assigned`}
            />
            <StatCard
              label="Active Volunteers"
              value={stats.activeVolunteers}
              icon={Users}
              description={`of ${stats.totalVolunteers} total`}
            />
            <StatCard
              label="Completed Tasks"
              value={stats.completedTasks}
              icon={CheckCircle2}
              description="This session"
            />
            <StatCard
              label="Urgent Needs"
              value={stats.urgentCount}
              icon={AlertCircle}
              description={`Avg urgency: ${stats.averageUrgency.toFixed(1)}`}
            />
            <StatCard
              label="Assignment Rate"
              value={`${Math.round(stats.assignmentRate * 100)}%`}
              icon={TrendingUp}
              description="Needs matched"
            />
          </div>
        )}

        {/* Critical Needs Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">Critical Needs (Urgency 7+)</h2>
              <p className="text-sm text-muted-foreground">Requires immediate attention</p>
            </div>
          </div>

          {criticalNeeds.length === 0 ? (
            <Card className="bg-card/50 border-border p-8 text-center">
              <p className="text-muted-foreground">No critical needs at this moment</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {criticalNeeds.map((need) => (
                <Card
                  key={need.id}
                  className="bg-card/50 border-border p-4 hover:bg-card/70 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-foreground truncate">{need.title}</h3>
                        <Badge
                          className={`${getStatusBadgeColor(need.status)} shrink-0`}
                          variant="outline"
                        >
                          {need.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{need.description}</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {need.category}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {need.location.address}
                        </Badge>
                      </div>
                    </div>

                    {/* Urgency bar */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-sm font-bold text-foreground">{need.urgency}/10</span>
                        <div className="w-12 h-2 bg-card rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getUrgencyColor(need.urgency)}`}
                            style={{ width: `${(need.urgency / 10) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timeline info */}
                  <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Due: {formatDate(need.deadline)}</span>
                    </div>
                    <span>{need.volunteersNeeded - need.assignedVolunteers.length} volunteers needed</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-card/50 border-border p-6">
            <h3 className="font-semibold text-foreground mb-4">System Health</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Data Sync</span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-green-400">Live</span>
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">API Status</span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-green-400">Connected</span>
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Last Update</span>
                <span className="text-foreground">Just now</span>
              </div>
            </div>
          </Card>

          <Card className="bg-card/50 border-border p-6">
            <h3 className="font-semibold text-foreground mb-4">This Period</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Assigned</span>
                <span className="font-semibold text-foreground">
                  {stats ? stats.assignedNeeds : 0}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Completed</span>
                <span className="font-semibold text-foreground">
                  {stats ? stats.completedTasks : 0}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Avg Response</span>
                <span className="font-semibold text-foreground">2.3 hrs</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
