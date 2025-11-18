/**
 * Campaign Selector Component
 * Displays available campaigns and allows selection
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Users, BookOpen } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  description: string;
  estimatedDuration: number;
  characters: number;
}

interface CampaignSelectorProps {
  campaigns: Campaign[];
  onSelectCampaign: (campaignId: string) => void;
  selectedCampaignId?: string;
}

export function CampaignSelector({ campaigns, onSelectCampaign, selectedCampaignId }: CampaignSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {campaigns.map(campaign => (
        <Card 
          key={campaign.id}
          className={`cursor-pointer transition-all hover:shadow-lg ${
            selectedCampaignId === campaign.id ? 'ring-2 ring-primary' : ''
          }`}
          onClick={() => onSelectCampaign(campaign.id)}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {campaign.name}
            </CardTitle>
            <CardDescription>{campaign.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{campaign.estimatedDuration} min</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{campaign.characters} characters</span>
              </div>
            </div>
            <Button 
              className="w-full mt-4"
              variant={selectedCampaignId === campaign.id ? 'default' : 'outline'}
            >
              {selectedCampaignId === campaign.id ? 'Selected' : 'Start Campaign'}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}


