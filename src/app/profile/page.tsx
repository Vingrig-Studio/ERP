'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { updateProfile } from '@/lib/shopify-auth';

// Schema for profile
const profileSchema = z.object({
  companyType: z.enum(['limited', 'sole_trader']),
  isLargeProducer: z.boolean(),
  // ... other fields
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
    try {
      await updateProfile(data);
      alert('Profile saved successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error saving profile');
    }
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
        {/* Other fields */}
        <Button type="submit">Save Profile</Button>
      </form>
    </Form>
  );
} 