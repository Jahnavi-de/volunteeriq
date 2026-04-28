'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Trophy, TrendingUp, MapPin } from 'lucide-react';
import { AppLayout } from '@/components/app-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getInsightsClusters, getLeaderboard } from '@/lib/api';
import type { InsightCluster } from '@/lib/types';

interface LeaderboardEntry {
  volunteerId: string;
  name: string;
  hoursServed: number;
  tasksCompleted: number;
}

export default function Insights() {
  const [clusters, setClusters] = useState<InsightCluster[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInsights() {
      try {
        setLoading(true);
        const [clustersData, leaderboardData] = await Promise.all([
          getInsightsClusters(),
          getLeaderboard(),
        ]);
        setClusters(clustersData);
        setLeaderboard(leaderboardData);
      } catch (err) {
        console.error('[v0] Error loading insights:', err);
      } finally {
        setLoading(false);
      }
    }

    loadInsights();
  }, []);

  // Prepare data for charts
  const clusterChartData = clusters.map((cluster) => ({
    name: cluster.name,
    needs: cluster.needCount,
    urgency: cluster.urgencyScore,
    assigned: Math.round(cluster.assignmentRate * 100),
  }));

  const scatterData = clusters.map((cluster) => ({
    x: cluster.location.latitude,
    y: cluster.location.longitude,
    z: cluster.needCount * 50,
    name: cluster.name,
  }));

  const leaderboardChartData = leaderboard.map((entry) => ({
    name: entry.name.split(' ')[0],
    hours: entry.hoursServed,
    tasks: entry.tasksCompleted,
  }));

  const colors = [
    'oklch(0.60 0.25 15)',
    'oklch(0.58 0.24 35)',
    'oklch(0.65 0.23 60)',
    'oklch(0.50 0.25 195)',
    'oklch(0.65 0.22 265)',
  ];

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Insights & Analytics</h1>
          <p className="text-muted-foreground">System performance and volunteer coordination metrics</p>
        </div>

        {loading ? (
          <Card className="bg-card/50 border-border p-8 text-center">
            <p className="text-muted-foreground">Loading insights...</p>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Clusters Section */}
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4">Geographic Clusters</h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cluster Chart */}
                <Card className="bg-card/50 border-border p-6">
                  <h3 className="font-semibold text-foreground mb-4">Need Distribution by Cluster</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={clusterChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0 0)" />
                      <XAxis dataKey="name" stroke="oklch(0.65 0 0)" style={{ fontSize: '12px' }} />
                      <YAxis stroke="oklch(0.65 0 0)" style={{ fontSize: '12px' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'oklch(0.145 0 0)',
                          border: '1px solid oklch(0.22 0 0)',
                          borderRadius: '8px',
                        }}
                        labelStyle={{ color: 'oklch(0.98 0 0)' }}
                      />
                      <Bar dataKey="needs" fill="oklch(0.525 0.31 262)" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="urgency" fill="oklch(0.60 0.25 15)" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                {/* Geographic Map */}
                <Card className="bg-card/50 border-border p-6">
                  <h3 className="font-semibold text-foreground mb-4">Cluster Locations</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0 0)" />
                      <XAxis dataKey="x" type="number" stroke="oklch(0.65 0 0)" />
                      <YAxis dataKey="y" type="number" stroke="oklch(0.65 0 0)" />
                      <Tooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        contentStyle={{
                          backgroundColor: 'oklch(0.145 0 0)',
                          border: '1px solid oklch(0.22 0 0)',
                          borderRadius: '8px',
                        }}
                        labelStyle={{ color: 'oklch(0.98 0 0)' }}
                      />
                      <Scatter name="Clusters" data={scatterData} fill="oklch(0.50 0.25 195)" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </Card>
              </div>

              {/* Cluster Details */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clusters.map((cluster, idx) => (
                  <Card key={cluster.id} className="bg-card/50 border-border p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-foreground">{cluster.name}</h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          Lat: {cluster.location.latitude.toFixed(2)}, Lng: {cluster.location.longitude.toFixed(2)}
                        </p>
                      </div>
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: colors[idx % colors.length] }}
                      ></div>
                    </div>

                    <div className="space-y-2 pt-3 border-t border-border/30">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Needs</span>
                        <span className="font-semibold text-foreground">{cluster.needCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Urgency Score</span>
                        <span className="font-semibold text-foreground">
                          {cluster.urgencyScore.toFixed(1)}/10
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Assigned</span>
                        <span className="font-semibold text-foreground">
                          {Math.round(cluster.assignmentRate * 100)}%
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Leaderboard Section */}
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4">Top Volunteers</h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Hours Chart */}
                <Card className="bg-card/50 border-border p-6">
                  <h3 className="font-semibold text-foreground mb-4">Hours Served</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={leaderboardChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0 0)" />
                      <XAxis dataKey="name" stroke="oklch(0.65 0 0)" style={{ fontSize: '12px' }} />
                      <YAxis stroke="oklch(0.65 0 0)" style={{ fontSize: '12px' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'oklch(0.145 0 0)',
                          border: '1px solid oklch(0.22 0 0)',
                          borderRadius: '8px',
                        }}
                        labelStyle={{ color: 'oklch(0.98 0 0)' }}
                      />
                      <Bar dataKey="hours" fill="oklch(0.525 0.31 262)" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                {/* Leaderboard Table */}
                <Card className="bg-card/50 border-border p-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    Leaderboard
                  </h3>

                  <div className="space-y-3">
                    {leaderboard.map((entry, idx) => (
                      <div
                        key={entry.volunteerId}
                        className="flex items-center justify-between p-3 bg-background rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Badge
                            variant="outline"
                            className={
                              idx === 0
                                ? 'bg-yellow-900/30 text-yellow-300 border-yellow-700/50'
                                : idx === 1
                                  ? 'bg-gray-600/30 text-gray-300 border-gray-600/50'
                                  : 'bg-orange-900/30 text-orange-300 border-orange-700/50'
                            }
                          >
                            #{idx + 1}
                          </Badge>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{entry.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {entry.tasksCompleted} tasks completed
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-primary">{entry.hoursServed} hrs</p>
                          <p className="text-xs text-muted-foreground">served</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>

            {/* Performance Metrics */}
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4">Overall Metrics</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-card/50 border-border p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">System Coverage</p>
                      <p className="text-3xl font-bold text-foreground">
                        {clusters.reduce((sum, c) => sum + c.needCount, 0)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">Total needs tracked</p>
                    </div>
                    <MapPin className="w-8 h-8 text-primary/40" />
                  </div>
                </Card>

                <Card className="bg-card/50 border-border p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Average Coverage</p>
                      <p className="text-3xl font-bold text-foreground">
                        {clusters.length > 0
                          ? Math.round(
                              (clusters.reduce((sum, c) => sum + c.assignmentRate, 0) /
                                clusters.length) *
                                100
                            )
                          : 0}
                        %
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">Assignment rate</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-primary/40" />
                  </div>
                </Card>

                <Card className="bg-card/50 border-border p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Active Volunteers</p>
                      <p className="text-3xl font-bold text-foreground">{leaderboard.length}</p>
                      <p className="text-xs text-muted-foreground mt-2">Currently serving</p>
                    </div>
                    <Trophy className="w-8 h-8 text-primary/40" />
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
