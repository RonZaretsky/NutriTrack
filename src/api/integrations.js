// AI Service Integrations
// Removed Base44 dependencies - using OpenAI and Anthropic only

import { InvokeLLM, UploadFile, AIService, AI_CONFIG } from './aiService';

// Export the AI service functions
export { InvokeLLM, UploadFile, AIService, AI_CONFIG };

// Legacy exports for backward compatibility (these will need to be implemented separately if needed)
export const Core = {
  SendEmail: async (params) => {
    console.warn('SendEmail not implemented - Base44 removed');
    throw new Error('SendEmail not available - please implement your own email service');
  },
  GenerateImage: async (params) => {
    console.warn('GenerateImage not implemented - Base44 removed');
    throw new Error('GenerateImage not available - please implement your own image generation service');
  },
  ExtractDataFromUploadedFile: async (params) => {
    console.warn('ExtractDataFromUploadedFile not implemented - Base44 removed');
    throw new Error('ExtractDataFromUploadedFile not available - please implement your own file extraction service');
  }
};

// Export individual functions for backward compatibility
export const SendEmail = Core.SendEmail;
export const GenerateImage = Core.GenerateImage;
export const ExtractDataFromUploadedFile = Core.ExtractDataFromUploadedFile;






