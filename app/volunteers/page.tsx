'use client';

import { useEffect, useState } from 'react';
import { Mail, Phone, MapPin, Award } from 'lucide-react';
import { AppLayout } from '@/components/app-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getVolunteers } from '@/lib/api';
import { getInitials } from '@/lib/helpers';
import type { Volunteer } from '@/lib/types';

export default function VolunteerDirectory() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [filteredVolunteers, setFilteredVolunteers] = useState<Volunteer[]>([]);
  const [selectedAvailability, setSelectedAvailability] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const availabilityOptions = ['all', 'available', 'limited', 'unavailable'];

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available':
        return 'bg-green-900/30 text-green-300 border-green-700/50';
      case 'limited':
        return 'bg-amber-900/30 text-amber-300 border-amber-700/50';
      case 'unavailable':
        return 'bg-red-900/30 text-red-300 border-red-700/50';
      default:
        return 'bg-gray-900/30 text-gray-400 border-gray-700/50';
    }
  };

  useEffect(() => {
    async function loadVolunteers() {
      try {
        setLoading(true);
        const data = await getVolunteers();
        setVolunteers(data);
        setFilteredVolunteers(data);
      } catch (err) {
        console.error('[v0] Error loading volunteers:', err);
      } finally {
        setLoading(false);
      }
    }

    loadVolunteers();
  }, []);

  useEffect(() => {
    let filtered = volunteers;

    if (selectedAvailability !== 'all') {
      filtered = filtered.filter((v) => v.availability === selectedAvailability);
    }

    setFilteredVolunteers(filtered);
  }, [selectedAvailability, volunteers]);

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Volunteer Directory</h1>
          <p className="text-muted-foreground">
            {filteredVolunteers.length} active volunteers in system
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap mb-8">
          <span className="text-xs text-muted-foreground font-semibold pt-2">Availability:</span>
          <div className="flex gap-2">
            {availabilityOptions.map((option) => (
              <Button
                key={option}
                variant={selectedAvailability === option ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedAvailability(option)}
                className="text-xs"
              >
                {option}
              </Button>
            ))}
          </div>
        </div>

        {/* Volunteers Grid */}
        {loading ? (
          <Card className="bg-card/50 border-border p-8 text-center">
            <p className="text-muted-foreground">Loading volunteers...</p>
          </Card>
        ) : filteredVolunteers.length === 0 ? (
          <Card className="bg-card/50 border-border p-8 text-center">
            <p className="text-muted-foreground">No volunteers matching your filters</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVolunteers.map((volunteer) => (
              <Card key={volunteer.id} className="bg-card/50 border-border p-5">
                {/* Header with avatar and name */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">
                        {getInitials(volunteer.name)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">{volunteer.name}</h3>
                      <p className="text-xs text-muted-foreground">ID: {volunteer.id.slice(0, 8)}</p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs ${getAvailabilityColor(volunteer.availability)}`}
                  >
                    {volunteer.availability}
                  </Badge>
                </div>

                {/* Contact info */}
                <div className="space-y-2 mb-4 py-4 border-t border-b border-border/30">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="w-3 h-3" />
                    <a href={`mailto:${volunteer.email}`} className="hover:text-primary">
                      {volunteer.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="w-3 h-3" />
                    <a href={`tel:${volunteer.phone}`} className="hover:text-primary">
                      {volunteer.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    {volunteer.location.address}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-background rounded p-3 text-center">
                    <p className="text-lg font-bold text-foreground">{volunteer.hoursAvailable}</p>
                    <p className="text-xs text-muted-foreground">hours available</p>
                  </div>
                  <div className="bg-background rounded p-3 text-center">
                    <p className="text-lg font-bold text-foreground">{volunteer.totalHours}</p>
                    <p className="text-xs text-muted-foreground">hours served</p>
                  </div>
                </div>

                {/* Skills */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Skills</p>
                  <div className="flex flex-wrap gap-1">
                    {volunteer.skills.slice(0, 3).map((skill, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {volunteer.skills.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{volunteer.skills.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <Button className="w-full text-sm" size="sm">
                    <Award className="w-3 h-3 mr-1" />
                    Assign Task
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
