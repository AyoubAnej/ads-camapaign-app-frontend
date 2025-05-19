
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { updateAgency } from "@/lib/agenciesApi";
import { Agency } from "@/types/agency";
import { AgencyFormFields, agencyFormSchema, AgencyFormValues } from "./AgencyFormFields";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";

interface EditAgencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  agency: Agency;
  onSuccess: (agency: Agency) => void;
}

const EditAgencyModal = ({ isOpen, onClose, agency, onSuccess }: EditAgencyModalProps) => {
  const [error, setError] = useState<string | null>(null);

  // Initialize form
  const form = useForm<AgencyFormValues>({
    resolver: zodResolver(agencyFormSchema),
    defaultValues: {
      name: agency.name,
      phoneNumber: agency.phoneNumber,
      website: agency.website,
      description: agency.description,
    },
  });

  // Update form when agency prop changes
  useEffect(() => {
    form.reset({
      name: agency.name,
      phoneNumber: agency.phoneNumber,
      website: agency.website,
      description: agency.description,
    });
  }, [agency, form]);

  // Update agency mutation
  const updateAgencyMutation = useMutation({
    mutationFn: updateAgency,
    onSuccess: (data) => {
      onSuccess(data);
      onClose();
    },
    onError: (error) => {
      setError("Failed to update agency. Please try again.");
      console.error("Error updating agency:", error);
    },
  });

  // Form submission handler
  const onSubmit = (values: AgencyFormValues) => {
    setError(null);
    // Ensure all required fields are passed and properly trimmed
    const agencyData = {
      agencyId: agency.agencyId,
      name: values.name.trim(),
      phoneNumber: values.phoneNumber.trim(),
      website: values.website.trim(),
      description: values.description.trim(),
    };
    updateAgencyMutation.mutate(agencyData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Agency</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <AgencyFormFields form={form} />

            {error && (
              <div className="text-sm font-medium text-red-500 dark:text-red-400">
                {error}
              </div>
            )}

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={updateAgencyMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateAgencyMutation.isPending}
              >
                {updateAgencyMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditAgencyModal;
