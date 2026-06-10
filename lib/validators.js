import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().trim().min(1).max(100).optional().or(z.literal('')),
  email: z.string().trim().email(),
  password: z.string().min(8).max(100)
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1)
});

export const personSchema = z.object({
  name: z.string().trim().min(1).max(100)
});

export const transactionSchema = z.object({
  type: z.enum(['EXPENSE', 'PAYMENT']),
  personId: z.string().min(1),
  amount: z.union([z.string(), z.number()]),
  itemPurpose: z.string().trim().max(200).optional().or(z.literal('')),
  category: z.string().trim().max(100).optional().or(z.literal('')),
  remarks: z.string().trim().max(500).optional().or(z.literal('')),
  entryAt: z.string().optional(),
  isPending: z.boolean().optional()
});

export const bulkSchema = z.object({
  action: z.enum(['delete', 'deleteAll', 'moveToPayment', 'markRead', 'markUnread']),
  ids: z.array(z.string()).default([]),
  filters: z.record(z.any()).optional()
});

export const importSchema = z.object({
  mode: z.enum(['merge', 'replace']).default('merge')
});
