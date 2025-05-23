
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { agencyApi } from "@/lib/agenciesApi";
import { Agency } from "@/types/agency";
import { useAuth } from "@/contexts/AuthContext";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteAgencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  agency: Agency;
  onSuccess: (agency: Agency) => void;
}

const DeleteAgencyModal = ({ isOpen, onClose, agency, onSuccess }: DeleteAgencyModalProps) => {
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Check if user has admin role
  const isAdmin = user?.role === "ADMIN";

  // Delete agency mutation
  const deleteAgencyMutation = useMutation({
    mutationFn: () => agencyApi.deleteAgency(agency.agencyId),
    onSuccess: () => {
      onSuccess(agency);
      onClose();
    },
    onError: (error) => {
      setError("Failed to delete agency. Please try again.");
      console.error("Error deleting agency:", error);
    },
  });

  // Handle delete confirmation
  const handleDelete = () => {
    if (!isAdmin) {
      setError("You don't have permission to delete agencies.");
      return;
    }

    setError(null);
    deleteAgencyMutation.mutate();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Agency</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <span className="font-semibold">{agency.name}</span>?
            <br />
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <div className="text-sm font-medium text-red-500 dark:text-red-400 mt-2">
            {error}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={deleteAgencyMutation.isPending}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteAgencyMutation.isPending}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            {deleteAgencyMutation.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAgencyModal;
