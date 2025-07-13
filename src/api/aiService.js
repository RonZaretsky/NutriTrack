// AI Service API for chat functionality
// Uses Supabase Edge Function for secure AI processing

// Configuration
const AI_CONFIG = {
  // Supabase Edge Function Configuration (Primary)
  supabase: {
    baseURL: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`,
    model: 'gpt-4o-mini',
    maxTokens: 2000,
    temperature: 0.3
  },
  
  // OpenAI Configuration (Fallback - only for development)
  openai: {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    baseURL: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    maxTokens: 2000,
    temperature: 0.3
  },
  
  // Anthropic Configuration (Backup)
  anthropic: {
    apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
    baseURL: 'https://api.anthropic.com/v1',
    model: 'claude-3-haiku-20240307',
    maxTokens: 2000,
    temperature: 0.3
  }
};

// AI Service class
class AIService {
  constructor(provider = 'openai') {
    this.provider = provider;
    this.config = AI_CONFIG[provider];
  }

  // Main method to invoke AI
  async invokeLLM({ prompt, file_urls, response_json_schema }) {
    try {
      switch (this.provider) {
        case 'supabase':
          return await this.supabaseInvoke({ prompt, file_urls, response_json_schema });
        case 'openai':
          return await this.openaiInvoke({ prompt, file_urls, response_json_schema });
        case 'anthropic':
          return await this.anthropicInvoke({ prompt, file_urls, response_json_schema });
        default:
          throw new Error(`Unsupported AI provider: ${this.provider}`);
      }
    } catch (error) {
      console.error('AI Service Error:', error);
      
      // Try fallback providers if available
      if (this.provider === 'supabase') {
        // Try OpenAI as fallback if in development
        if (import.meta.env.DEV && AI_CONFIG.openai.apiKey) {
          console.log('🔄 Trying OpenAI as fallback...');
          const fallbackService = new AIService('openai');
          return await fallbackService.invokeLLM({ prompt, file_urls, response_json_schema });
        }
        // Try Anthropic as fallback
        if (AI_CONFIG.anthropic.apiKey) {
          console.log('🔄 Trying Anthropic as fallback...');
          const fallbackService = new AIService('anthropic');
          return await fallbackService.invokeLLM({ prompt, file_urls, response_json_schema });
        }
      }
      
      throw new Error(`AI service failed: ${error.message}`);
    }
  }

  // Supabase Edge Function implementation (Primary - Production)
  async supabaseInvoke({ prompt, file_urls, response_json_schema }) {
    if (!import.meta.env.VITE_SUPABASE_URL) {
      throw new Error('Supabase URL not configured. Please add VITE_SUPABASE_URL to your .env file');
    }

    const { supabase } = await import('./supabaseClient.js');
    
    const response = await supabase.functions.invoke('ai-proxy', {
      body: {
        prompt,
        file_urls,
        response_json_schema,
        model: this.config.model
      }
    });

    if (response.error) {
      throw new Error(`Supabase Edge Function error: ${response.error.message}`);
    }

    if (!response.data.success) {
      throw new Error(`AI service error: ${response.data.error}`);
    }

    return response.data.data;
  }

  // OpenAI implementation (Fallback - Development only)
  async openaiInvoke({ prompt, file_urls, response_json_schema }) {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env file');
    }

    const messages = [
      {
        role: 'system',
        content: 'You are a nutrition assistant expert. Always respond in Hebrew and provide accurate nutritional information. Be precise with calculations and use the provided weight guidelines.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    // Add image if provided
    if (file_urls && file_urls.length > 0) {
      messages[1].content = [
        { type: 'text', text: prompt },
        ...file_urls.map(url => ({
          type: 'image_url',
          image_url: { url }
        }))
      ];
    }

    const requestBody = {
      model: this.config.model,
      messages,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature
    };

    // Add JSON response format if schema is provided
    if (response_json_schema) {
      requestBody.response_format = { type: 'json_object' };
    }

    const response = await fetch(`${this.config.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error (${response.status}): ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse JSON if schema was requested
    if (response_json_schema) {
      try {
        return JSON.parse(content);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Raw content:', content);
        throw new Error('Failed to parse AI response as JSON. The AI may not have followed the required format.');
      }
    }
    
    return content;
  }

  // Anthropic implementation (Backup)
  async anthropicInvoke({ prompt, file_urls, response_json_schema }) {
    if (!this.config.apiKey) {
      throw new Error('Anthropic API key not configured. Please add VITE_ANTHROPIC_API_KEY to your .env file');
    }

    const messages = [
      {
        role: 'user',
        content: prompt
      }
    ];

    // Add image if provided
    if (file_urls && file_urls.length > 0) {
      messages[0].content = [
        { type: 'text', text: prompt },
        ...file_urls.map(url => ({
          type: 'image',
          source: { type: 'url', url }
        }))
      ];
    }

    const response = await fetch(`${this.config.baseURL}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Anthropic API error (${response.status}): ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.content[0].text;
    
    // Parse JSON if schema was requested
    if (response_json_schema) {
      try {
        return JSON.parse(content);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Raw content:', content);
        throw new Error('Failed to parse AI response as JSON. The AI may not have followed the required format.');
      }
    }
    
    return content;
  }

  // Upload file method (converts to base64 for AI providers)
  async uploadFile(file) {
    try {
      // Convert file to base64 for AI providers
      const base64 = await this.fileToBase64(file);
      return `data:${file.type};base64,${base64}`;
    } catch (error) {
      console.error('File upload error:', error);
      throw new Error(`File upload failed: ${error.message}`);
    }
  }

  // Helper method to convert file to base64
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }

  // Check if provider is configured
  isConfigured() {
    return !!this.config.apiKey;
  }

  // Get available providers
  static getAvailableProviders() {
    const providers = [];
    if (import.meta.env.VITE_SUPABASE_URL) providers.push('supabase');
    if (AI_CONFIG.openai.apiKey) providers.push('openai');
    if (AI_CONFIG.anthropic.apiKey) providers.push('anthropic');
    return providers;
  }
}

// Create default instance (Supabase preferred for production, OpenAI for development)
const availableProviders = AIService.getAvailableProviders();
let defaultProvider;

if (import.meta.env.DEV && availableProviders.includes('openai')) {
  // Use OpenAI directly in development if available
  defaultProvider = 'openai';
} else if (availableProviders.includes('supabase')) {
  // Use Supabase Edge Function in production
  defaultProvider = 'supabase';
} else {
  // Fallback to any available provider
  defaultProvider = availableProviders[0] || 'supabase';
}

const defaultAI = new AIService(defaultProvider);

// Export functions for backward compatibility
export const InvokeLLM = (params) => defaultAI.invokeLLM(params);
export const UploadFile = (file) => defaultAI.uploadFile(file);

// Export the service class for advanced usage
export { AIService };

// Export configuration for setup
export { AI_CONFIG }; 