'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, MapPin, Clock, Zap } from 'lucide-react';
import { createAssignment } from '@/lib/api';
import type { Need, Match } from '@/lib/types';

interface MatchModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  need: Need | null;
  match: Match | null;
  volunteerName?: string;
  onAssignmentSuccess?: () => void;
}

export function MatchModal({
  isOpen,
  onOpenChange,
  need,
  match,
  volunteerName = 'Volunteer',
  onAssignmentSuccess,
}: MatchModalProps) {
  const [assigning, setAssigning] = useState(false);
  const [assigned, setAssigned] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAssign = async () => {
    if (!need || !match) return;

    try {
      setAssigning(true);
      setError(null);
      await createAssignment(need.id, match.volunteerId);
      setAssigned(true);

      setTimeout(() => {
        onOpenChange(false);
        setAssigned(false);
        onAssignmentSuccess?.();
      }, 2000);
    } catch (err) {
      console.error('[v0] Assignment error:', err);
      setError('Failed to create assignment. Please try again.');
    } finally {
      setAssigning(false);
    }
  };

  if (!need || !match) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-foreground">Volunteer Assignment</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Confirm assignment of {volunteerName} to this need
          </DialogDescription>
        </DialogHeader>

        {assigned ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-green-300 mb-2">Assignment Created</h3>
            <p className="text-green-200/80">
              {volunteerName} has been assigned to {need.title}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Need Summary */}
            <div>
              <h4 className="font-semibold text-foreground mb-3">Need Details</h4>
              <Card className="bg-background/50 border-border/30 p-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="font-semibold text-foreground">{need.title}</h5>
                      <p className="text-sm text-muted-foreground mt-1">{need.description}</p>
                    </div>
                    <Badge className="bg-primary text-primary-foreground">
                      Urgency: {need.urgency}/10
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground pt-3 border-t border-border/30">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {need.location.address}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Due: {new Date(need.deadline).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Match Score */}
            <div>
              <h4 className="font-semibold text-foreground mb-3">Match Analysis</h4>
              <Card className="bg-background/50 border-border/30 p-4">
                <div className="space-y-3">
                  {/* Overall Score */}
                  <div className="flex items-center justify-between">
                    <span className="text-foreground font-semibold">Overall Match Score</span>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-primary">
                        {Math.round(match.score)}%
                      </span>
                      <p className="text-xs text-muted-foreground">compatibility</p>
                    </div>
                  </div>

                  {/* Score Breakdown */}
                  <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border/30">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Skills Match</p>
                      <div className="flex items-center justify-center gap-2">
                        <div className="text-lg font-bold text-foreground">
                          {Math.round(match.skillMatch)}%
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-background rounded-full mt-2 overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${match.skillMatch}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Availability</p>
                      <div className="flex items-center justify-center gap-2">
                        <div className="text-lg font-bold text-foreground">
                          {Math.round(match.availabilityMatch)}%
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-background rounded-full mt-2 overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${match.availabilityMatch}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Distance/Location</p>
                      <div className="flex items-center justify-center gap-2">
                        <div className="text-lg font-bold text-foreground">
                          {match.distanceKm.toFixed(1)} km
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-background rounded-full mt-2 overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${Math.max(0, 100 - Math.min(match.distanceKm, 50) * 2)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Urgency Indicator */}
            {need.urgency >= 8 && (
              <div className="flex items-start gap-3 p-4 bg-red-900/10 border border-red-700/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-red-300">High Urgency</p>
                  <p className="text-sm text-red-200/80">This assignment is time-sensitive</p>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-900/10 border border-red-700/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}
          </div>
        )}

        {!assigned && (
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={assigning}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={assigning}
              className="flex items-center gap-2"
            >
              {assigning ? 'Assigning...' : 'Confirm Assignment'}
              {!assigning && <Zap className="w-4 h-4" />}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
