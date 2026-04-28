'use client';

import { useEffect, useState } from 'react';
import { MapPin, Users, Clock, ChevronRight } from 'lucide-react';
import { AppLayout } from '@/components/app-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createAssignment, getNeeds, getMatches } from '@/lib/api';
import { getUrgencyColor, getStatusBadgeColor, getCategoryColor, formatDate } from '@/lib/helpers';
import type { Need, Match } from '@/lib/types';

export default function NeedsBoard() {
  const [needs, setNeeds] = useState<Need[]>([]);
  const [filteredNeeds, setFilteredNeeds] = useState<Need[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedNeed, setSelectedNeed] = useState<Need | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchLoading, setMatchLoading] = useState(false);
  const [assigningVolunteerId, setAssigningVolunteerId] = useState<string | null>(null);

  const categories = ['all', 'Medical', 'Rescue', 'Food', 'Shelter', 'Other'];
  const statuses = ['all', 'open', 'assigned', 'completed', 'closed'];

  useEffect(() => {
    async function loadNeeds() {
      try {
        setLoading(true);
        const data = await getNeeds();
        setNeeds(data);
        setFilteredNeeds(data);
      } catch (err) {
        console.error('[v0] Error loading needs:', err);
      } finally {
        setLoading(false);
      }
    }

    loadNeeds();
  }, []);

  async function refreshNeeds() {
    const data = await getNeeds();
    setNeeds(data);
    setFilteredNeeds(data);
    if (selectedNeed) {
      const updatedNeed = data.find((need) => need.id === selectedNeed.id) || null;
      setSelectedNeed(updatedNeed);
    }
  }

  useEffect(() => {
    let filtered = needs;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((n) => n.category === selectedCategory);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter((n) => n.status === selectedStatus);
    }

    setFilteredNeeds(filtered);
  }, [selectedCategory, selectedStatus, needs]);

  async function handleSelectNeed(need: Need) {
    setSelectedNeed(need);
    try {
      setMatchLoading(true);
      const matchData = await getMatches(need.id);
      setMatches(matchData.slice(0, 5)); // Top 5 matches
    } catch (err) {
      console.error('[v0] Error loading matches:', err);
      setMatches([]);
    } finally {
      setMatchLoading(false);
    }
  }

  async function handleAssign(match: Match) {
    if (!selectedNeed) return;

    try {
      setAssigningVolunteerId(match.volunteerId);
      await createAssignment(selectedNeed.id, match.volunteerId);
      await refreshNeeds();
      const matchData = await getMatches(selectedNeed.id);
      setMatches(matchData.slice(0, 5));
    } catch (err) {
      console.error('[v0] Error assigning volunteer:', err);
    } finally {
      setAssigningVolunteerId(null);
    }
  }

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Needs Board</h1>
          <p className="text-muted-foreground">
            {filteredNeeds.length} needs requiring coordination
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Needs List */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              <div className="flex gap-2">
                <span className="text-xs text-muted-foreground font-semibold pt-2">Category:</span>
                <div className="flex gap-2 flex-wrap">
                  {categories.map((cat) => (
                    <Button
                      key={cat}
                      variant={selectedCategory === cat ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(cat)}
                      className="text-xs"
                    >
                      {cat}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground font-semibold pt-2">Status:</span>
              <div className="flex gap-2 flex-wrap">
                {statuses.map((status) => (
                  <Button
                    key={status}
                    variant={selectedStatus === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedStatus(status)}
                    className="text-xs"
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>

            {/* Needs List */}
            {loading ? (
              <Card className="bg-card/50 border-border p-8 text-center">
                <p className="text-muted-foreground">Loading needs...</p>
              </Card>
            ) : filteredNeeds.length === 0 ? (
              <Card className="bg-card/50 border-border p-8 text-center">
                <p className="text-muted-foreground">No needs matching your filters</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredNeeds.map((need) => (
                  <Card
                    key={need.id}
                    className={`bg-card/50 border-border p-4 cursor-pointer hover:bg-card/70 transition-colors ${
                      selectedNeed?.id === need.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleSelectNeed(need)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-foreground">{need.title}</h3>
                          <Badge
                            className={`${getCategoryColor(need.category)} text-white text-xs`}
                          >
                            {need.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{need.description}</p>

                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {need.location.address}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {need.volunteersNeeded - need.assignedVolunteers.length} of{' '}
                            {need.volunteersNeeded} needed
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Due {formatDate(need.deadline)}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-3 shrink-0">
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-lg font-bold text-foreground">{need.urgency}</span>
                          <span className="text-xs text-muted-foreground">urgency</span>
                        </div>
                        <div className="w-12 h-2 bg-card rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getUrgencyColor(need.urgency)}`}
                            style={{ width: `${(need.urgency / 10) * 100}%` }}
                          ></div>
                        </div>
                        <Badge variant="outline" className={getStatusBadgeColor(need.status)}>
                          {need.status}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Match Panel */}
          <div>
            <Card className="bg-card/50 border-border sticky top-8">
              {selectedNeed ? (
                <div className="p-4">
                  <h3 className="font-semibold text-foreground mb-4">Top Matches</h3>
                  <p className="text-xs text-muted-foreground mb-4">{selectedNeed.title}</p>

                  {matchLoading ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Finding matches...
                    </p>
                  ) : matches.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      No matches available
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {matches.map((match) => (
                        <div key={match.volunteerId} className="p-3 bg-background rounded-lg border border-border/30">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="text-xs font-semibold text-foreground">
                              {(match as Match & { volunteerName?: string }).volunteerName ||
                                `Volunteer ${match.volunteerId.slice(0, 8)}...`}
                            </span>
                            <span className="text-xs font-bold text-primary">
                              {Math.round(match.score)}%
                            </span>
                          </div>

                          <div className="space-y-1 text-xs text-muted-foreground mb-3">
                            <div className="flex justify-between">
                              <span>Distance</span>
                              <span>{match.distanceKm.toFixed(1)} km</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Skills</span>
                              <span>{Math.round(match.skillMatch)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Available</span>
                              <span>{Math.round(match.availabilityMatch)}%</span>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            className="w-full text-xs"
                            variant="default"
                            disabled={assigningVolunteerId === match.volunteerId}
                            onClick={() => handleAssign(match)}
                          >
                            <ChevronRight className="w-3 h-3 mr-1" />
                            {assigningVolunteerId === match.volunteerId ? 'Assigning...' : 'Assign'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">Select a need to view matches</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
