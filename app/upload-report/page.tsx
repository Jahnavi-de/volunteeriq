'use client';

import { useState } from 'react';
import { Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AppLayout } from '@/components/app-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { uploadFieldReport } from '@/lib/api';

export default function UploadReport() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    latitude: '',
    longitude: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [extractedNeeds, setExtractedNeeds] = useState<string[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const report = await uploadFieldReport({
        title: formData.title,
        description: formData.description,
        location: {
          latitude: Number(formData.latitude),
          longitude: Number(formData.longitude),
          address: formData.location,
        },
        timestamp: new Date().toISOString(),
      });
      setExtractedNeeds(report.extractedNeeds);
      setSubmitted(true);

      // Reset form after 3 seconds
      setTimeout(() => {
        setFormData({
          title: '',
          description: '',
          location: '',
          latitude: '',
          longitude: '',
        });
        setExtractedNeeds([]);
        setSubmitted(false);
      }, 3000);
    } catch (err) {
      console.error('[v0] Error submitting report:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Field Report</h1>
          <p className="text-muted-foreground">
            Upload field observations for AI analysis and automatic need detection
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2">
            {submitted && extractedNeeds.length > 0 ? (
              <Card className="bg-green-900/10 border-green-700/30 p-8 text-center">
                <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-green-300 mb-2">Report Submitted</h3>
                <p className="text-green-200/80 mb-4">
                  AI analysis identified {extractedNeeds.length} potential needs
                </p>
                <Button onClick={() => setSubmitted(false)} className="text-sm">
                  Submit Another Report
                </Button>
              </Card>
            ) : (
              <Card className="bg-card/50 border-border p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Report Title *
                    </label>
                    <Input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Brief title of the situation"
                      required
                      className="bg-input border-border text-foreground placeholder-muted-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Description *
                    </label>
                    <Textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Detailed description of the situation, observed needs, and any relevant context"
                      rows={6}
                      required
                      className="bg-input border-border text-foreground placeholder-muted-foreground resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Location Address *
                      </label>
                      <Input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="Street address or area"
                        required
                        className="bg-input border-border text-foreground placeholder-muted-foreground"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Latitude *
                      </label>
                      <Input
                        type="number"
                        step="0.0001"
                        name="latitude"
                        value={formData.latitude}
                        onChange={handleInputChange}
                        placeholder="0.0000"
                        required
                        className="bg-input border-border text-foreground placeholder-muted-foreground"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Longitude *
                      </label>
                      <Input
                        type="number"
                        step="0.0001"
                        name="longitude"
                        value={formData.longitude}
                        onChange={handleInputChange}
                        placeholder="0.0000"
                        required
                        className="bg-input border-border text-foreground placeholder-muted-foreground"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || !formData.title || !formData.description}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {loading ? 'Analyzing...' : 'Submit Report for AI Analysis'}
                  </Button>
                </form>
              </Card>
            )}
          </div>

          {/* Info Panel */}
          <div className="space-y-4">
            <Card className="bg-blue-900/10 border-blue-700/30 p-4">
              <h3 className="font-semibold text-blue-300 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                AI Processing
              </h3>
              <p className="text-sm text-blue-200/80">
                Our AI system analyzes field reports to automatically identify and categorize needs,
                extracting key information for quick coordination.
              </p>
            </Card>

            {extractedNeeds.length > 0 && (
              <Card className="bg-card/50 border-border p-4">
                <h3 className="font-semibold text-foreground mb-3">Identified Needs</h3>
                <div className="space-y-2">
                  {extractedNeeds.map((need, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                      <span className="text-sm text-foreground">{need}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <Card className="bg-card/50 border-border p-4">
              <h3 className="font-semibold text-foreground mb-3">Tips</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Be specific about observed needs and quantities</li>
                <li>• Include location coordinates if possible</li>
                <li>• Mention any urgent or time-sensitive items</li>
                <li>• Include affected population estimates</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
