
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { agencyApi } from "@/lib/agenciesApi";
import { Agency } from "@/types/agency";
import { AgencyFormFields, agencyFormSchema, AgencyFormValues } from "../admin/AgencyFormFields";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  
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
      setError(null);
    },
    onError: (error: any) => {
      if (!isAdmin) {
        setError(t('admin.agencyManagement.feedback.noPermission'));
      } else if (error.response?.status === 400) {
        setError(t('admin.agencyManagement.feedback.invalidData'));
      } else if (error.message === 'Network Error') {
        setError(t('admin.agencyManagement.feedback.networkError'));
      } else {
        setError(t('admin.agencyManagement.feedback.createError'));
      }
      console.error("Error creating agency:", error);
    },
  });
  // Form submission handler
  const onSubmit = async (values: AgencyFormValues) => {
    try {
      if (!isAdmin) {
        setError(t('admin.agencyManagement.feedback.noPermission'));
        return;
      }

      setError(null);

      // Validate required fields
      if (!values.name || !values.phoneNumber) {
        setError(t('admin.agencyManagement.feedback.invalidData'));
        return;
      }

      const agencyData = {
        name: values.name.trim(),
        phoneNumber: values.phoneNumber.trim(),
        website: values.website ? values.website.trim() : undefined,
        description: values.description ? values.description.trim() : undefined,
      };

      await createAgencyMutation.mutateAsync(agencyData);
    } catch (err) {
      console.error("Error in form submission:", err);
    }
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
