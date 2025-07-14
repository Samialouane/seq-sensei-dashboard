import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Brain, 
  Lightbulb, 
  AlertCircle, 
  CheckCircle, 
  TrendingUp,
  FileText,
  Zap,
  Target,
  Microscope
} from 'lucide-react';

interface ResultsInterpretationProps {
  data: any;
}

export const ResultsInterpretation = ({ data }: ResultsInterpretationProps) => {
  // Interprétations intelligentes basées sur l'analyse
  const interpretations = [
    {
      category: "Qualité Générale",
      status: "excellent",
      icon: CheckCircle,
      title: "Séquençage de Haute Qualité",
      description: "Vos données présentent un score de qualité moyen de 38.5, ce qui indique un séquençage de très haute qualité. Les bases sont fiables pour les analyses en aval.",
      recommendations: [
        "Procédez avec confiance aux analyses d'assemblage",
        "Aucun filtrage supplémentaire nécessaire",
        "Données adaptées pour la publication"
      ]
    },
    {
      category: "Contenu GC",
      status: "good",
      icon: TrendingUp,
      title: "Composition Équilibrée",
      description: "Le contenu GC de 42.3% est dans la fourchette normale pour la plupart des organismes. Cela suggère une représentation équilibrée du génome.",
      recommendations: [
        "Aucune correction de biais nécessaire",
        "Adapté pour l'analyse phylogénétique",
        "Bon candidat pour l'annotation génomique"
      ]
    },
    {
      category: "Duplication",
      status: "warning",
      icon: AlertCircle,
      title: "Léger Niveau de Duplication",
      description: "Un taux de duplication de 15.2% est observé. Bien qu'acceptable, il pourrait indiquer une amplification PCR ou une contamination légère.",
      recommendations: [
        "Considérer un filtrage des duplicats",
        "Vérifier les protocoles de préparation",
        "Surveiller lors des prochains séquençages"
      ]
    }
  ];

  const insights = [
    {
      title: "Profondeur de Couverture",
      value: "Optimale",
      description: "Avec 2.5M de reads, vous avez une couverture suffisante pour la plupart des analyses génomiques.",
      icon: Target
    },
    {
      title: "Homogénéité",
      value: "Excellente",
      description: "La distribution des qualités est homogène, indiquant un séquençage stable.",
      icon: Microscope
    },
    {
      title: "Adaptateurs",
      value: "Minimal (2.1%)",
      description: "Très peu de contamination par les adaptateurs, trimming optionnel.",
      icon: Zap
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-success';
      case 'good':
        return 'text-primary';
      case 'warning':
        return 'text-warning';
      case 'error':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'default';
      case 'good':
        return 'secondary';
      case 'warning':
        return 'outline';
      case 'error':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const handleGenerateReport = () => {
    // Génération du rapport complet
    const reportData = {
      interpretations,
      insights,
      timestamp: new Date().toISOString(),
      summary: "Analyse complète des données FASTQC avec recommandations"
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-fastqc-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleStartAssembly = () => {
    // Simulation du démarrage de l'assemblage
    alert('Démarrage de l\'assemblage génomique avec les paramètres optimaux basés sur l\'analyse IA.');
    // Ici vous pourriez rediriger vers un module d'assemblage ou lancer un pipeline
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4 flex items-center justify-center gap-3">
          <Brain className="w-8 h-8 text-primary" />
          Interprétation par IA
        </h2>
        <p className="text-muted-foreground">
          Analyse intelligente et recommandations personnalisées pour vos données de séquençage
        </p>
      </div>

      {/* Résumé exécutif */}
      <Card className="border-l-4 border-l-success shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-success">
            <CheckCircle className="w-6 h-6" />
            Résumé Exécutif
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-lg leading-relaxed">
              <strong>Verdict global :</strong> Vos données de séquençage sont de <span className="text-success font-semibold">haute qualité</span> et 
              adaptées pour la plupart des analyses bioinformatiques. L'agent IA recommande de procéder aux étapes d'analyse en aval 
              avec un niveau de confiance élevé.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">Qualité Excellente</Badge>
              <Badge variant="secondary">Prêt pour Assemblage</Badge>
              <Badge variant="outline">Surveillance Duplication</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {insights.map((insight, index) => (
          <Card key={index} className="shadow-soft hover:shadow-medium transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <insight.icon className="w-6 h-6 text-primary mt-1" />
                <div className="space-y-2">
                  <h3 className="font-semibold">{insight.title}</h3>
                  <p className="text-sm font-medium text-primary">{insight.value}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {insight.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Interprétations détaillées */}
      <div className="space-y-6">
        <h3 className="text-2xl font-bold flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-warning" />
          Analyses Détaillées
        </h3>
        
        {interpretations.map((interp, index) => (
          <Card key={index} className="shadow-soft">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <interp.icon className={`w-6 h-6 ${getStatusColor(interp.status)}`} />
                  <div>
                    <CardTitle className="text-xl">{interp.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <span>{interp.category}</span>
                      <Badge variant={getStatusBadge(interp.status)}>
                        {interp.status === 'excellent' ? 'Excellent' :
                         interp.status === 'good' ? 'Bon' :
                         interp.status === 'warning' ? 'Attention' : 'Problème'}
                      </Badge>
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="leading-relaxed">{interp.description}</p>
                
                <Separator />
                
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Recommandations
                  </h4>
                  <ul className="space-y-2">
                    {interp.recommendations.map((rec, recIndex) => (
                      <li key={recIndex} className="flex items-start gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Prochaines étapes */}
      <Card className="bg-gradient-primary text-primary-foreground">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-6 h-6" />
            Prochaines Étapes Recommandées
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold">Analyses Recommandées :</h4>
              <ul className="space-y-1 text-sm">
                <li>• Assemblage de novo du génome</li>
                <li>• Annotation automatique des gènes</li>
                <li>• Analyse comparative phylogénétique</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold">Outils Suggérés :</h4>
              <ul className="space-y-1 text-sm">
                <li>• SPAdes ou MegaHit pour l'assemblage</li>
                <li>• Prokka pour l'annotation</li>
                <li>• QUAST pour l'évaluation qualité</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="default" size="lg" onClick={handleGenerateReport}>
              <FileText className="w-4 h-4 mr-2" />
              Rapport Complet
            </Button>
            <Button variant="outline" size="lg">
              <Brain className="w-4 h-4 mr-2" />
              Nouvelle Interprétation
            </Button>
            <Button variant="success" size="lg" onClick={handleStartAssembly}>
              <Microscope className="w-4 h-4 mr-2" />
              Démarrer l'Assemblage
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};