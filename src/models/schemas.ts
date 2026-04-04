import { z } from 'zod';

export const PatientProfileSchema = z.object({
  uid: z.string(),
  fullName: z.string().min(1, "Full name is required"),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  medicalHistory: z.array(z.string()).optional(),
  createdAt: z.string().optional()
});

export const CareLogSchema = z.object({
  patientId: z.string(),
  type: z.enum(['medication', 'vital']),
  name: z.string().min(1, "Name is required"),
  value: z.string().min(1, "Value is required"),
  timestamp: z.string(),
  status: z.enum(['taken', 'missed', 'recorded'])
});

export const MessageSchema = z.object({
  senderId: z.string(),
  receiverId: z.string(),
  content: z.string().min(1, "Content cannot be empty"),
  timestamp: z.string(),
  role: z.enum(['patient', 'provider'])
});

export const ClinicalSummarySchema = z.object({
  patientId: z.string(),
  originalNote: z.string().min(1, "Original note is required"),
  translatedSummary: z.string().optional(),
  timestamp: z.string()
});

export type PatientProfile = z.infer<typeof PatientProfileSchema>;
export type CareLog = z.infer<typeof CareLogSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type ClinicalSummary = z.infer<typeof ClinicalSummarySchema>;
