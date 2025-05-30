
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { t } from "i18next";

// Define schema for agency form
export const agencyFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  phoneNumber: z.string().min(1, "Phone number is required").max(20, "Phone number must be less than 20 characters"),
  website: z.string().url("Must be a valid URL").max(255, "Website must be less than 255 characters").optional().or(z.literal('')),
  description: z.string().max(500, "Description must be less than 500 characters").optional().or(z.literal('')),
});

// Define types
export type AgencyFormValues = z.infer<typeof agencyFormSchema>;

interface AgencyFormFieldsProps {
  form: UseFormReturn<AgencyFormValues>;
}

export const AgencyFormFields = ({ form }: AgencyFormFieldsProps) => {
  return (
    <>
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('admin.agencyManagement.fields.name')}</FormLabel>
            <FormControl>
              <Input placeholder="Enter agency name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="phoneNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('admin.agencyManagement.fields.phone')}</FormLabel>
            <FormControl>
              <Input placeholder="Enter phone number" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="website"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('admin.agencyManagement.fields.website')}</FormLabel>
            <FormControl>
              <Input placeholder="https://example.com" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('admin.agencyManagement.fields.description')}</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Enter agency description" 
                rows={3} 
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};
