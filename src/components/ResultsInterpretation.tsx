import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { NextStepsRecommendations } from '@/components/NextStepsRecommendations';
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
  // Générer des interprétations basées sur les vraies données
  const generateInterpretations = (analysisData: any) => {
    const interpretations = [];
    
    if (analysisData?.summary) {
      const { qualityScore, gcContent, status } = analysisData.summary;
      
      // Interprétation de la qualité
      interpretations.push({
        category: "Qualité Générale",
        status: qualityScore >= 35 ? "excellent" : qualityScore >= 25 ? "good" : "warning",
        icon: qualityScore >= 35 ? CheckCircle : qualityScore >= 25 ? TrendingUp : AlertCircle,
        title: qualityScore >= 35 ? "Séquençage de Haute Qualité" : qualityScore >= 25 ? "Qualité Acceptable" : "Qualité Préoccupante",
        description: `Score de qualité moyen de ${qualityScore}. ${
          qualityScore >= 35 ? "Excellente qualité pour toutes analyses." :
          qualityScore >= 25 ? "Qualité suffisante pour la plupart des analyses." :
          "Qualité faible, filtrage recommandé."
        }`,
        recommendations: qualityScore >= 35 ? [
          "Procédez avec confiance aux analyses d'assemblage",
          "Aucun filtrage supplémentaire nécessaire",
          "Données adaptées pour la publication"
        ] : qualityScore >= 25 ? [
          "Filtrage léger recommandé",
          "Convient pour l'assemblage standard",
          "Vérifier les paramètres de séquençage"
        ] : [
          "Filtrage strict nécessaire",
          "Revoir les protocoles de séquençage",
          "Considérer un nouveau séquençage"
        ]
      });

      // Interprétation du contenu GC
      interpretations.push({
        category: "Contenu GC",
        status: (gcContent >= 35 && gcContent <= 65) ? "good" : "warning",
        icon: (gcContent >= 35 && gcContent <= 65) ? TrendingUp : AlertCircle,
        title: (gcContent >= 35 && gcContent <= 65) ? "Composition Équilibrée" : "Composition Atypique",
        description: `Contenu GC de ${gcContent}%. ${
          (gcContent >= 35 && gcContent <= 65) ? 
          "Dans la fourchette normale pour la plupart des organismes." :
          "Peut indiquer un biais de composition ou une contamination."
        }`,
        recommendations: (gcContent >= 35 && gcContent <= 65) ? [
          "Aucune correction de biais nécessaire",
          "Adapté pour l'analyse phylogénétique",
          "Bon candidat pour l'annotation génomique"
        ] : [
          "Vérifier la présence de contaminants",
          "Analyser la composition taxonomique",
          "Considérer un filtrage spécialisé"
        ]
      });
    }

    // Ajouter d'autres interprétations basées sur les métriques
    if (analysisData?.metrics) {
      const duplicationMetric = analysisData.metrics.find(m => m.name.includes('Duplication'));
      if (duplicationMetric) {
        interpretations.push({
          category: "Duplication",
          status: duplicationMetric.status,
          icon: duplicationMetric.status === 'good' ? CheckCircle : AlertCircle,
          title: duplicationMetric.status === 'good' ? "Niveau de Duplication Normal" : "Duplication Élevée",
          description: `Taux de duplication de ${duplicationMetric.value}%. ${
            duplicationMetric.status === 'good' ? 
            "Niveau acceptable pour la plupart des analyses." :
            "Peut indiquer une amplification PCR excessive."
          }`,
          recommendations: duplicationMetric.status === 'good' ? [
            "Aucune action nécessaire",
            "Procéder à l'assemblage",
            "Surveillance de routine"
          ] : [
            "Considérer un filtrage des duplicats",
            "Vérifier les protocoles de préparation",
            "Optimiser les cycles PCR"
          ]
        });
      }
    }

    return interpretations;
  };

  const interpretations = data ? generateInterpretations(data) : [];

  const insights = [
    {
      title: "Profondeur de Couverture",
      value: data?.summary ? `${(data.summary.totalReads / 1000000).toFixed(1)}M reads` : "Optimale",
      description: data?.summary ? 
        `Avec ${(data.summary.totalReads / 1000000).toFixed(1)}M de reads, vous avez une couverture ${data.summary.totalReads > 2000000 ? 'excellente' : 'suffisante'} pour les analyses génomiques.` :
        "Avec 2.5M de reads, vous avez une couverture suffisante pour la plupart des analyses génomiques.",
      icon: Target
    },
    {
      title: "Homogénéité",
      value: data?.summary?.status === 'good' ? "Excellente" : "Variable",
      description: data?.summary?.status === 'good' ? 
        "La distribution des qualités est homogène, indiquant un séquençage stable." :
        "Variation de qualité détectée, surveiller les performances.",
      icon: Microscope
    },
    {
      title: "Adaptateurs",
      value: data?.metrics ? 
        `${data.metrics.find(m => m.name.includes('Adaptateurs'))?.value || 'N/A'}%` : 
        "Minimal (2.1%)",
      description: data?.metrics ? 
        `${data.metrics.find(m => m.name.includes('Adaptateurs'))?.value < 5 ? 'Très peu' : 'Niveau élevé'} de contamination par les adaptateurs.` :
        "Très peu de contamination par les adaptateurs, trimming optionnel.",
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
    // Génération du rapport complet avec vraies données
    const reportData = {
      interpretations,
      insights,
      data: data || {},
      timestamp: new Date().toISOString(),
      summary: data?.interpretation || "Analyse complète des données FASTQC avec recommandations IA"
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interpretation-ia-${new Date().toISOString().split('T')[0]}.json`;
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
              <strong>Verdict global :</strong> {data?.summary ? (
                <>
                  Vos données de séquençage sont de <span className={`font-semibold ${
                    data.summary.status === 'good' ? 'text-success' : 
                    data.summary.status === 'warning' ? 'text-warning' : 'text-destructive'
                  }`}>
                    {data.summary.status === 'good' ? 'haute qualité' : 
                     data.summary.status === 'warning' ? 'qualité acceptable' : 'qualité préoccupante'}
                  </span> et {data.summary.status === 'good' ? 'adaptées pour la plupart des analyses bioinformatiques' : 'nécessitent une attention particulière'}.
                </>
              ) : (
                <>
                  Vos données de séquençage sont de <span className="text-success font-semibold">haute qualité</span> et 
                  adaptées pour la plupart des analyses bioinformatiques.
                </>
              )} L'agent IA recommande de procéder aux étapes d'analyse en aval 
              avec un niveau de confiance {data?.summary?.status === 'good' ? 'élevé' : 'modéré'}.
            </p>
            <div className="flex flex-wrap gap-2">
              {data?.summary?.status === 'good' && <Badge variant="default">Qualité Excellente</Badge>}
              {data?.summary?.status === 'good' && <Badge variant="secondary">Prêt pour Assemblage</Badge>}
              {data?.metrics?.some(m => m.status === 'warning') && <Badge variant="outline">Surveillance Recommandée</Badge>}
              {data?.interpretation && <Badge variant="secondary">Analysé par IA</Badge>}
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

      {/* Prochaines étapes fonctionnelles */}
      <NextStepsRecommendations data={data} />

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