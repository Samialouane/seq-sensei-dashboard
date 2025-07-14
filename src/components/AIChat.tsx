import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader, Brain, Send, AlertCircle, Settings, MessageSquare } from "lucide-react";
import { aiService, OpenAIProvider, DeepSeekProvider } from "@/lib/ai";
import { useToast } from "@/hooks/use-toast";

export const AIChat = () => {
  const [message, setMessage] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [provider, setProvider] = useState<"openai" | "deepseek">("openai");
  const [showSettings, setShowSettings] = useState(!localStorage.getItem('ai_api_key'));
  const [response, setResponse] = useState("");
  const { toast } = useToast();

  // Set provider based on selection
  const updateProvider = (providerName: "openai" | "deepseek") => {
    setProvider(providerName);
    if (providerName === "openai") {
      aiService.setProvider(new OpenAIProvider());
    } else {
      aiService.setProvider(new DeepSeekProvider());
    }
  };

  const aiMutation = useMutation({
    mutationFn: async ({ prompt, key }: { prompt: string; key: string }) => {
      return await aiService.askAI(prompt, key);
    },
    onSuccess: (data) => {
      setResponse(data);
      toast({
        title: "Réponse IA reçue",
        description: "L'agent a analysé votre question avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur IA",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !apiKey.trim()) {
      toast({
        title: "Champs manquants",
        description: "Veuillez saisir votre question et votre clé API.",
        variant: "destructive",
      });
      return;
    }

    // Save API key to localStorage for convenience
    localStorage.setItem('ai_api_key', apiKey);
    
    aiMutation.mutate({ prompt: message, key: apiKey });
  };

  // Load saved API key on component mount
  useState(() => {
    const savedKey = localStorage.getItem('ai_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      setShowSettings(false);
    }
  });

  return (
    <div className="space-y-6">
      {/* Settings Card */}
      <Card className="shadow-soft">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Configuration IA</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              {showSettings ? "Masquer" : "Afficher"}
            </Button>
          </div>
        </CardHeader>
        
        {showSettings && (
          <CardContent className="space-y-4">
            <Alert className="border-warning/50 bg-warning/10">
              <AlertCircle className="h-4 w-4 text-warning" />
              <AlertDescription className="text-warning-foreground">
                <strong>Important :</strong> Votre clé API est stockée localement dans votre navigateur. 
                Pour une sécurité optimale, connectez votre projet à Supabase pour gérer les secrets de manière sécurisée.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Fournisseur IA</label>
                <Select value={provider} onValueChange={updateProvider}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un fournisseur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI GPT</SelectItem>
                    <SelectItem value="deepseek">DeepSeek</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Clé API</label>
                <Input
                  type="password"
                  placeholder={`Votre clé API ${provider === 'openai' ? 'OpenAI' : 'DeepSeek'}`}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Chat Interface */}
      <Card className="shadow-soft">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            <div>
              <CardTitle className="flex items-center gap-2">
                Agent IA Bioinformatique
                <Badge variant="secondary" className="text-xs">
                  {provider === 'openai' ? 'OpenAI' : 'DeepSeek'}
                </Badge>
              </CardTitle>
              <CardDescription>
                Posez vos questions sur l'analyse FASTQC/MULTIQC et obtenez des réponses d'expert
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Chat Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Posez votre question sur l'analyse de données de séquençage..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={aiMutation.isPending}
                className="flex-1"
              />
              <Button 
                type="submit" 
                disabled={aiMutation.isPending || !message.trim() || !apiKey.trim()}
                className="px-6"
              >
                {aiMutation.isPending ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </form>

          {/* Response Display */}
          {response && (
            <Card className="bg-muted/30 border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <CardTitle className="text-base">Réponse de l'Agent IA</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none text-foreground">
                  {response.split('\n').map((line, index) => (
                    <p key={index} className="mb-2 last:mb-0">
                      {line}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {aiMutation.isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {aiMutation.error instanceof Error 
                  ? aiMutation.error.message 
                  : "Une erreur est survenue lors de la communication avec l'IA"}
              </AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {aiMutation.isPending && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Loader className="w-5 h-5 animate-spin text-primary" />
                <span>L'agent IA analyse votre question...</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};