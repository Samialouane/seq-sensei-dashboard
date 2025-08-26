import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Zap, 
  Clock, 
  Settings, 
  Play, 
  CheckCircle, 
  AlertTriangle, 
  Target,
  TrendingUp,
  Microscope,
  FileText,
  Download,
  RefreshCw,
  Loader2
} from 'lucide-react';

interface NextStep {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'quality' | 'assembly' | 'annotation' | 'analysis';
  estimatedTime: string;
  tools: string[];
  parameters: Record<string, string>;
  reasoning: string;
}

interface Recommendations {
  nextSteps: NextStep[];
  qualityAssessment: {
    readyForAssembly: boolean;
    recommendedFiltering: string;
    confidenceLevel: string;
    notes: string;
  };
  warnings: string[];
  opportunities: string[];
}

interface NextStepsRecommendationsProps {
  data: any;
}

export const NextStepsRecommendations = ({ data }: NextStepsRecommendationsProps) => {
  const { toast } = useToast();
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
  const [loading, setLoading] = useState(false);
  const [executingStep, setExecutingStep] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  useEffect(() => {
    generateRecommendations();
  }, [data]);

  const generateRecommendations = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('generate-recommendations', {
        body: { 
          analysisData: data,
          currentStep: 'analysis'
        }
      });

      if (error) throw error;

      setRecommendations(result);
      
    } catch (error) {
      console.error('Erreur génération recommandations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer les recommandations IA",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'quality':
        return CheckCircle;
      case 'assembly':
        return Settings;
      case 'annotation':
        return FileText;
      case 'analysis':
        return Microscope;
      default:
        return Target;
    }
  };

  const handleExecuteStep = async (step: NextStep) => {
    setExecutingStep(step.id);
    
    try {
      // Simulation de l'exécution d'une étape
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setCompletedSteps(prev => new Set([...prev, step.id]));
      
      toast({
        title: "Étape complétée",
        description: `${step.title} a été exécutée avec succès`,
      });
      
    } catch (error) {
      toast({
        title: "Erreur d'exécution",
        description: "Impossible d'exécuter cette étape",
        variant: "destructive",
      });
    } finally {
      setExecutingStep(null);
    }
  };

  const handleDownloadProtocol = (step: NextStep) => {
    const protocol = {
      stepId: step.id,
      title: step.title,
      description: step.description,
      tools: step.tools,
      parameters: step.parameters,
      estimatedTime: step.estimatedTime,
      reasoning: step.reasoning,
      commandLines: generateCommandLines(step),
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(protocol, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `protocole-${step.id}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Protocole téléchargé",
      description: `Protocole pour ${step.title} téléchargé`,
    });
  };

  const generateCommandLines = (step: NextStep) => {
    // Générer des exemples de lignes de commande basées sur l'étape
    switch (step.category) {
      case 'quality':
        return [
          `trimmomatic PE -threads 4 input_R1.fastq input_R2.fastq output_R1.fastq unpaired_R1.fastq output_R2.fastq unpaired_R2.fastq ILLUMINACLIP:TruSeq3-PE.fa:2:30:10 LEADING:3 TRAILING:3 SLIDINGWINDOW:4:${step.parameters.minQuality || 15} MINLEN:${step.parameters.minLength || 36}`,
          `fastqc output_R1.fastq output_R2.fastq -o quality_reports/`
        ];
      case 'assembly':
        return [
          `spades.py -1 output_R1.fastq -2 output_R2.fastq -o assembly_output --careful`,
          `quast.py assembly_output/contigs.fasta -o quast_results`
        ];
      case 'analysis':
        return [
          `quast.py contigs.fasta -o quast_results`,
          `busco -i contigs.fasta -o busco_results -m genome`
        ];
      default:
        return [`# Commandes pour ${step.title} à définir`];
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span>Génération des recommandations IA...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!recommendations) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-warning mx-auto" />
            <p>Impossible de générer les recommandations</p>
            <Button onClick={generateRecommendations} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const completionRate = (completedSteps.size / recommendations.nextSteps.length) * 100;

  return (
    <div className="space-y-6">
      {/* En-tête avec évaluation globale */}
      <Card className="bg-gradient-primary text-primary-foreground">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-6 h-6" />
            Prochaines Étapes Recommandées par IA
          </CardTitle>
          <CardDescription className="text-primary-foreground/80">
            Recommandations personnalisées basées sur votre analyse FASTQC
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Évaluation Qualité</h4>
              <div className="flex items-center gap-2">
                {recommendations.qualityAssessment.readyForAssembly ? (
                  <CheckCircle className="w-5 h-5 text-white" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-yellow-300" />
                )}
                <Badge variant="secondary" className="bg-white/20 text-white">
                  {recommendations.qualityAssessment.confidenceLevel === 'high' ? 'Haute Confiance' :
                   recommendations.qualityAssessment.confidenceLevel === 'medium' ? 'Confiance Moyenne' : 'Confiance Faible'}
                </Badge>
              </div>
              <p className="text-sm text-primary-foreground/80">
                {recommendations.qualityAssessment.notes}
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">Progression</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Étapes complétées</span>
                  <span>{completedSteps.size}/{recommendations.nextSteps.length}</span>
                </div>
                <Progress value={completionRate} className="bg-white/20" />
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Filtrage Recommandé</h4>
              <Badge variant="outline" className="border-white/30 text-white">
                {recommendations.qualityAssessment.recommendedFiltering === 'none' ? 'Aucun' :
                 recommendations.qualityAssessment.recommendedFiltering === 'light' ? 'Léger' :
                 recommendations.qualityAssessment.recommendedFiltering === 'moderate' ? 'Modéré' : 'Strict'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertes et opportunités */}
      {(recommendations.warnings.length > 0 || recommendations.opportunities.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.warnings.length > 0 && (
            <Card className="border-l-4 border-l-warning">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-warning">
                  <AlertTriangle className="w-5 h-5" />
                  Avertissements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {recommendations.warnings.map((warning, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-warning mt-2 flex-shrink-0" />
                      {warning}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {recommendations.opportunities.length > 0 && (
            <Card className="border-l-4 border-l-success">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-success">
                  <TrendingUp className="w-5 h-5" />
                  Opportunités
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {recommendations.opportunities.map((opportunity, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-success mt-2 flex-shrink-0" />
                      {opportunity}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Étapes détaillées */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Plan d'Action Détaillé</h3>
        
        {recommendations.nextSteps.map((step, index) => {
          const CategoryIcon = getCategoryIcon(step.category);
          const isCompleted = completedSteps.has(step.id);
          const isExecuting = executingStep === step.id;
          
          return (
            <Card key={step.id} className={`transition-all duration-300 ${
              isCompleted ? 'bg-success/5 border-success/20' : 
              step.priority === 'high' ? 'border-l-4 border-l-destructive' : ''
            }`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      isCompleted ? 'bg-success/20' : 'bg-primary/10'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="w-6 h-6 text-success" />
                      ) : (
                        <CategoryIcon className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {step.title}
                        <Badge variant={getPriorityColor(step.priority)}>
                          Priorité {step.priority === 'high' ? 'Haute' : 
                                  step.priority === 'medium' ? 'Moyenne' : 'Faible'}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {step.description}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {step.estimatedTime}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    <strong>Justification :</strong> {step.reasoning}
                  </p>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium mb-2">Outils Recommandés</h5>
                      <div className="flex flex-wrap gap-1">
                        {step.tools.map((tool) => (
                          <Badge key={tool} variant="outline" className="text-xs">
                            {tool}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-medium mb-2">Paramètres Suggérés</h5>
                      <div className="space-y-1">
                        {Object.entries(step.parameters).map(([key, value]) => (
                          <div key={key} className="text-xs flex justify-between">
                            <span className="text-muted-foreground">{key}:</span>
                            <span className="font-mono">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={isCompleted ? "secondary" : "default"}
                      size="sm"
                      onClick={() => handleExecuteStep(step)}
                      disabled={isExecuting || isCompleted}
                    >
                      {isExecuting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : isCompleted ? (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      ) : (
                        <Play className="w-4 h-4 mr-2" />
                      )}
                      {isCompleted ? 'Complétée' : isExecuting ? 'Exécution...' : 'Exécuter'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadProtocol(step)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Protocole
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Actions globales */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="default" 
              size="lg" 
              onClick={generateRecommendations}
              disabled={loading}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser les Recommandations
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => {
                // Simulation de l'export du pipeline complet
                const pipeline = {
                  steps: recommendations.nextSteps,
                  assessment: recommendations.qualityAssessment,
                  warnings: recommendations.warnings,
                  opportunities: recommendations.opportunities,
                  generatedAt: new Date().toISOString()
                };
                
                const blob = new Blob([JSON.stringify(pipeline, null, 2)], { 
                  type: 'application/json' 
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `pipeline-bioinformatique-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                toast({
                  title: "Pipeline exporté",
                  description: "Le pipeline complet a été téléchargé",
                });
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Exporter le Pipeline
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};