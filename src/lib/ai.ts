// AI Provider abstraction for easy switching between providers
export interface AIProvider {
  name: string;
  generateResponse(prompt: string, apiKey: string): Promise<string>;
}

// OpenAI Provider
export class OpenAIProvider implements AIProvider {
  name = "OpenAI";

  async generateResponse(prompt: string, apiKey: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Tu es un expert en bioinformatique spécialisé dans l\'analyse de données FASTQC et MULTIQC. Réponds de manière précise et professionnelle.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'Aucune réponse reçue';
  }
}

// DeepSeek Provider (OpenAI compatible)
export class DeepSeekProvider implements AIProvider {
  name = "DeepSeek";

  async generateResponse(prompt: string, apiKey: string): Promise<string> {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'Tu es un expert en bioinformatique spécialisé dans l\'analyse de données FASTQC et MULTIQC. Réponds de manière précise et professionnelle.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'Aucune réponse reçue';
  }
}

// Main AI service
export class AIService {
  private provider: AIProvider;

  constructor(provider: AIProvider = new OpenAIProvider()) {
    this.provider = provider;
  }

  setProvider(provider: AIProvider) {
    this.provider = provider;
  }

  async askAI(prompt: string, apiKey: string): Promise<string> {
    try {
      return await this.provider.generateResponse(prompt, apiKey);
    } catch (error) {
      throw new Error(`Erreur ${this.provider.name}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }
}

// Default instance
export const aiService = new AIService();