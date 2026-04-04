import { describe, it, expect, vi } from 'vitest';
import { translateClinicalNote, draftProviderResponse, analyzeCareLogs } from '../src/services/geminiService';
import { PatientProfileSchema, CareLogSchema, MessageSchema } from '../src/models/schemas';

// Mock Gemini SDK
vi.mock('@google/genai', () => {
  class MockGoogleGenAI {
    models = {
      generateContent: vi.fn().mockResolvedValue({ text: 'Mocked Gemini Response' }),
    };
  }
  return {
    GoogleGenAI: MockGoogleGenAI,
    Type: {
      STRING: 'STRING',
      NUMBER: 'NUMBER',
      OBJECT: 'OBJECT',
      ARRAY: 'ARRAY',
    },
  };
});

describe('CareOrchestrator Core Logic', () => {
  
  describe('Gemini Services', () => {
    it('should translate clinical notes', async () => {
      const result = await translateClinicalNote('Patient presents with acute cephalalgia.');
      expect(result).toBe('Mocked Gemini Response');
    });

    it('should draft provider responses', async () => {
      const result = await draftProviderResponse('I have a headache.', ['History of migraines']);
      expect(result).toBe('Mocked Gemini Response');
    });

    it('should analyze care logs', async () => {
      const result = await analyzeCareLogs([{ type: 'medication', name: 'Aspirin', value: '81mg' }]);
      expect(result).toBe('Mocked Gemini Response');
    });
  });

  describe('Data Validation (Zod)', () => {
    it('should validate a correct patient profile', () => {
      const profile = {
        uid: 'user123',
        fullName: 'John Doe',
        dateOfBirth: '1990-01-01',
        medicalHistory: ['Hypertension'],
        createdAt: new Date().toISOString()
      };
      expect(() => PatientProfileSchema.parse(profile)).not.toThrow();
    });

    it('should throw error for invalid patient profile', () => {
      const profile = {
        uid: 'user123',
        fullName: '', // Invalid
        dateOfBirth: 'invalid-date' // Invalid
      };
      expect(() => PatientProfileSchema.parse(profile)).toThrow();
    });

    it('should validate a correct care log', () => {
      const log = {
        patientId: 'user123',
        type: 'medication',
        name: 'Aspirin',
        value: '81mg',
        timestamp: new Date().toISOString(),
        status: 'taken'
      };
      expect(() => CareLogSchema.parse(log)).not.toThrow();
    });

    it('should validate a correct message', () => {
      const message = {
        senderId: 'user123',
        receiverId: 'provider123',
        content: 'Hello doctor',
        timestamp: new Date().toISOString(),
        role: 'patient'
      };
      expect(() => MessageSchema.parse(message)).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty medical history', () => {
      const profile = {
        uid: 'user123',
        fullName: 'John Doe',
        dateOfBirth: '1990-01-01',
        medicalHistory: [],
        createdAt: new Date().toISOString()
      };
      expect(() => PatientProfileSchema.parse(profile)).not.toThrow();
    });

    it('should handle missing PII scrubbing layer in prompt', async () => {
      // This is a placeholder for a more complex prompt injection test
      const result = await translateClinicalNote('Patient John Doe has flu.');
      expect(result).toBe('Mocked Gemini Response');
    });
  });
});
