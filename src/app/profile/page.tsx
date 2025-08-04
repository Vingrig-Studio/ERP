'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { updateProfile } from '@/lib/shopify-auth';

// Схема для профиля
const profileSchema = z.object({
  companyType: z.enum(['limited', 'sole_trader']),
  isLargeProducer: z.boolean(),
  // ... другие поля
});

type Profile = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const form = useForm<Profile>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      companyType: 'limited',
      isLargeProducer: false,
    },
  });

  const onSubmit = async (data: Profile) => {
    await updateProfile(data);
    // TODO: обработка
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="companyType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Type</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Другие поля */}
        <Button type="submit">Save Profile</Button>
      </form>
    </Form>
  );
} 