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
import { Textarea } from '../ui/textarea';

const formSchema = z.object({
  welcomeMessage: z.string().min(2, 'Message is too short'),
  tone: z.enum(['friendly', 'professional', 'casual']),
  fallbackMessage: z.string().min(2, 'Message is too short'),
  responseLength: z.enum(['short', 'medium', 'detailed']),
});

export function ChatbotCustomizationForm({
  initialData,
  companyId,
}: {
  initialData: any;
  companyId: string;
}) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      welcomeMessage: initialData.welcomeMessage || 'Hello! How can I help you today?',
      tone: initialData.tone || 'friendly',
      fallbackMessage:
        initialData.fallbackMessage ||
        "I couldn't find the answer in our knowledge base. Here's what I know:",
      responseLength: initialData.responseLength || 'medium',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          customization: values,
        })
        .eq('id', companyId);

      if (error) throw error;

      toast.success('Customization saved successfully!');
    } catch (error) {
      toast.error('Failed to save customization', {
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="welcomeMessage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Welcome Message</FormLabel>
              <FormControl>
                <Textarea placeholder="Your welcome message" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tone</FormLabel>
              <FormControl>
                <select
                  {...field}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="friendly">Friendly</option>
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fallbackMessage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fallback Message</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Message when falling back to AI"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="responseLength"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Response Length</FormLabel>
              <FormControl>
                <select
                  {...field}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="short">Short</option>
                  <option value="medium">Medium</option>
                  <option value="detailed">Detailed</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Save Changes</Button>
      </form>
    </Form>
  );
}