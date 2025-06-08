'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { supabase } from '@/lib/db/supabase';

import { Button } from '../ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { HexColorPicker } from 'react-colorful';

const formSchema = z.object({
  colorScheme: z.enum(['light', 'dark']),
  primaryColor: z.string(),
  backgroundColor: z.string(),
  textColor: z.string(),
  buttonColor: z.string(),
  buttonTextColor: z.string(),
  headerColor: z.string(),
  headerTextColor: z.string(),
  borderColor: z.string(),
});

export function AppearanceForm({
  initialData,
  companyId,
}: {
  initialData: any;
  companyId: string;
}) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      colorScheme: initialData.colorScheme || 'light',
      primaryColor: initialData.primaryColor || '#3b82f6',
      backgroundColor: initialData.backgroundColor || '#ffffff',
      textColor: initialData.textColor || '#000000',
      buttonColor: initialData.buttonColor || '#3b82f6',
      buttonTextColor: initialData.buttonTextColor || '#ffffff',
      headerColor: initialData.headerColor || '#f8fafc',
      headerTextColor: initialData.headerTextColor || '#000000',
      borderColor: initialData.borderColor || '#e2e8f0',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          appearance: values,
        })
        .eq('id', companyId);

      if (error) throw error;

      toast.success('Appearance settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save appearance settings', {
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="colorScheme"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color Scheme</FormLabel>
              <FormControl>
                <select
                  {...field}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            'primaryColor',
            'backgroundColor',
            'textColor',
            'buttonColor',
            'buttonTextColor',
            'headerColor',
            'headerTextColor',
            'borderColor',
          ].map((fieldName) => (
            <FormField
              key={fieldName}
              control={form.control}
              name={fieldName as any}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {fieldName
                      .replace(/([A-Z])/g, ' $1')
                      .replace(/^./, (str) => str.toUpperCase())}
                  </FormLabel>
                  <FormControl>
                    <div className="flex items-center space-x-2">
                      <Input {...field} />
                      <div className="relative">
                        <HexColorPicker
                          color={field.value}
                          onChange={field.onChange}
                          className="absolute z-10 mt-2"
                        />
                        <div
                          className="h-10 w-10 rounded border"
                          style={{ backgroundColor: field.value }}
                        />
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>

        <Button type="submit">Save Changes</Button>
      </form>
    </Form>
  );
}