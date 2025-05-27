import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { campaignApi } from "@/lib/campaignApi";
import {
  GetCampaignResponseDto,
  UpdateCampaignRequestDto,
  GlobalState,
  CampaignType,
  getGlobalStateString,
  getCampaignTypeString,
} from "@/types/campaign";
import { cn } from "@/lib/utils";

interface EditCampaignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: GetCampaignResponseDto;
  onEditCampaign: () => void;
}

export const EditCampaignModal: React.FC<EditCampaignModalProps> = ({
  open,
  onOpenChange,
  campaign,
  onEditCampaign,
}) => {
  const [name, setName] = useState(campaign.campaignName);
  const [startDate, setStartDate] = useState(
    campaign.campaignStartDate ? campaign.campaignStartDate.split("T")[0] : ""
  );
  const [endDate, setEndDate] = useState(
    campaign.campaignEndDate ? campaign.campaignEndDate.split("T")[0] : ""
  );
  const [globalState, setGlobalState] = useState<GlobalState>(
    campaign.globalState
  );
  const [campaignType, setCampaignType] = useState<CampaignType>(
    campaign.campaignType
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (campaign) {
      setName(campaign.campaignName);
      setStartDate(
        campaign.campaignStartDate
          ? campaign.campaignStartDate.split("T")[0]
          : ""
      );
      setEndDate(
        campaign.campaignEndDate ? campaign.campaignEndDate.split("T")[0] : ""
      );
      setGlobalState(campaign.globalState);
      setCampaignType(campaign.campaignType);
    }
  }, [campaign]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!name) {
        throw new Error("Campaign name is required");
      }

      if (!startDate) {
        throw new Error("Start date is required");
      }

      const updateData: UpdateCampaignRequestDto = {
        campaignName: name,
        campaignStartDate: new Date(startDate),
        campaignEndDate: endDate ? new Date(endDate) : null,
        globalState: globalState,
        campaignType: campaignType,
        // Preserve existing values for these fields
        ownerActivation: campaign.ownerActivation,
        bid: campaign.bid,
      };

      await campaignApi.updateCampaign(campaign.campaignId, updateData);
      onEditCampaign();
      onOpenChange(false);
    } catch (err) {
      console.error("Error updating campaign:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update campaign. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Campaign</DialogTitle>
          <DialogDescription>
            Update the campaign details. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startDate" className="text-right">
                Start Date
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={cn(
                  "col-span-3 cursor-pointer hover:border-primary",
                  "[&::-webkit-calendar-picker-indicator]:text-foreground [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:bg-foreground/50 [&::-webkit-calendar-picker-indicator]:hover:bg-foreground/70 [&::-webkit-calendar-picker-indicator]:p-1 [&::-webkit-calendar-picker-indicator]:rounded-md [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                )}
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endDate" className="text-right">
                End Date
              </Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={cn(
                  "col-span-3 cursor-pointer hover:border-primary",
                  "[&::-webkit-calendar-picker-indicator]:text-foreground [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:bg-foreground/50 [&::-webkit-calendar-picker-indicator]:hover:bg-foreground/70 [&::-webkit-calendar-picker-indicator]:p-1 [&::-webkit-calendar-picker-indicator]:rounded-md [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                )}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select
                value={globalState.toString()}
                onValueChange={(value) => setGlobalState(value as GlobalState)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={GlobalState.OK.toString()}>
                    {getGlobalStateString(GlobalState.OK)}
                  </SelectItem>
                  <SelectItem value={GlobalState.DISABLED.toString()}>
                    {getGlobalStateString(GlobalState.DISABLED)}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <Select
                value={campaignType.toString()}
                onValueChange={(value) =>
                  setCampaignType(value as CampaignType)
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={CampaignType.SPONSORED.toString()}>
                    {getCampaignTypeString(CampaignType.SPONSORED)}
                  </SelectItem>
                  <SelectItem value={CampaignType.SPONSOREDPLUS.toString()}>
                    {getCampaignTypeString(CampaignType.SPONSOREDPLUS)}
                  </SelectItem>
                  <SelectItem value={CampaignType.HEADLINE.toString()}>
                    {getCampaignTypeString(CampaignType.HEADLINE)}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
