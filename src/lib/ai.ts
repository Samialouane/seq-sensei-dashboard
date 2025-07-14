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

// Auto-generated API keys (demo purposes - not secure for production)
export const generateDemoApiKey = (provider: string): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2);
  return `demo_${provider}_${timestamp}_${random}`;
};

// Main AI service
export class AIService {
  private provider: AIProvider;
  private apiKey: string | null = null;

  constructor(provider: AIProvider = new OpenAIProvider()) {
    this.provider = provider;
    this.generateApiKey();
  }

  setProvider(provider: AIProvider) {
    this.provider = provider;
    this.generateApiKey();
  }

  private generateApiKey() {
    // Auto-generate demo API key for development
    this.apiKey = generateDemoApiKey(this.provider.name.toLowerCase());
    console.log(`Clé API générée automatiquement pour ${this.provider.name}: ${this.apiKey}`);
  }

  getApiKey(): string | null {
    return this.apiKey;
  }

  async askAI(prompt: string, customApiKey?: string): Promise<string> {
    const keyToUse = customApiKey || this.apiKey;
    if (!keyToUse) {
      throw new Error('Aucune clé API disponible');
    }

    try {
      return await this.provider.generateResponse(prompt, keyToUse);
    } catch (error) {
      throw new Error(`Erreur ${this.provider.name}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }
}

// Default instance
export const aiService = new AIService();