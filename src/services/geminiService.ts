import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function translateClinicalNote(clinicalNote: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Translate the following clinical note into plain, easy-to-understand language for a patient. Avoid medical jargon and focus on actionable steps: \n\n${clinicalNote}`,
    config: {
      systemInstruction: "You are a clinical translator. Your goal is to simplify medical jargon for patients while maintaining accuracy. Scrub any PII before processing.",
      temperature: 0.7,
    },
  });
  return response.text || "Failed to translate clinical note.";
}

export async function draftProviderResponse(patientMessage: string, patientHistory: string[]): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Draft a professional and empathetic response to this patient message: "${patientMessage}". \n\nPatient History: ${patientHistory.join(", ")}`,
    config: {
      systemInstruction: "You are a senior healthcare provider. Draft a response that is clinical yet empathetic. Ensure no PII is included in the draft.",
      temperature: 0.5,
    },
  });
  return response.text || "Failed to draft response.";
}

export async function analyzeCareLogs(logs: any[]): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze these care logs and provide a brief summary of medication adherence and vital trends: \n\n${JSON.stringify(logs)}`,
    config: {
      systemInstruction: "You are a clinical data analyst. Summarize patient adherence and trends concisely.",
      temperature: 0.3,
    },
  });
  return response.text || "Failed to analyze logs.";
}
