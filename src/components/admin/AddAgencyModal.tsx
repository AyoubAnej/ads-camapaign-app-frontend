
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { agencyApi } from "@/lib/agenciesApi";
import { Agency } from "@/types/agency";
import { AgencyFormFields, agencyFormSchema, AgencyFormValues } from "./AgencyFormFields";
import { useAuth } from "@/contexts/AuthContext";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";

interface AddAgencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (agency: Agency) => void;
}

const AddAgencyModal = ({ isOpen, onClose, onSuccess }: AddAgencyModalProps) => {
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Check if user has admin role
  const isAdmin = user?.role === "ADMIN";

  // Initialize form
  const form = useForm<AgencyFormValues>({
    resolver: zodResolver(agencyFormSchema),
    defaultValues: {
      name: "",
      phoneNumber: "",
      website: "",
      description: "",
    },
  });

  // Create agency mutation
  const createAgencyMutation = useMutation({
    mutationFn: agencyApi.createAgency,
    onSuccess: (data) => {
      onSuccess(data);
      onClose();
      form.reset();
    },
    onError: (error) => {
      setError("Failed to create agency. Please try again.");
      console.error("Error creating agency:", error);
    },
  });

  // Form submission handler
  const onSubmit = (values: AgencyFormValues) => {
    if (!isAdmin) {
      setError("You don't have permission to create agencies.");
      return;
    }

    setError(null);
    // Ensure all required fields are passed and properly trimmed
    const agencyData = {
      name: values.name.trim(),
      phoneNumber: values.phoneNumber.trim(),
      website: values.website ? values.website.trim() : undefined,
      description: values.description ? values.description.trim() : undefined,
    };
    createAgencyMutation.mutate(agencyData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Agency</DialogTitle>
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
                disabled={createAgencyMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createAgencyMutation.isPending}
              >
                {createAgencyMutation.isPending ? "Adding..." : "Add Agency"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddAgencyModal;
