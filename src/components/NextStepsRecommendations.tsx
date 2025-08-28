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
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
  const [stepResults, setStepResults] = useState<Record<string, any>>({});

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
      let functionName = '';
      let inputData = data;
      
      // Déterminer la fonction à appeler selon l'étape
      switch (step.category) {
        case 'quality':
          functionName = 'quality-validation';
          break;
        case 'assembly':
          functionName = 'genome-assembly';
          // Utiliser les résultats de la validation qualité si disponible
          inputData = stepResults[getStepId('quality')] || data;
          break;
        case 'analysis':
          functionName = 'assembly-evaluation';
          // Utiliser les résultats de l'assemblage si disponible
          inputData = stepResults[getStepId('assembly')] || data;
          break;
        default:
          throw new Error(`Type d'étape non supporté: ${step.category}`);
      }

      const { data: result, error } = await supabase.functions.invoke(functionName, {
        body: { 
          parameters: step.parameters,
          inputData: inputData
        }
      });

      if (error) throw error;
      if (!result.success) throw new Error(result.error || 'Erreur inconnue');

      // Stocker les résultats pour les étapes suivantes
      setStepResults(prev => ({
        ...prev,
        [step.id]: result
      }));
      
      setCompletedSteps(prev => new Set([...prev, step.id]));
      
      toast({
        title: "Étape complétée",
        description: `${step.title} - ${result.recommendations?.[0] || 'Exécution réussie'}`,
      });
      
    } catch (error) {
      console.error('Erreur exécution étape:', error);
      toast({
        title: "Erreur d'exécution",
        description: error.message || "Impossible d'exécuter cette étape",
        variant: "destructive",
      });
    } finally {
      setExecutingStep(null);
    }
  };

  const getStepId = (category: string) => {
    return recommendations?.nextSteps.find(s => s.category === category)?.id;
  };

  const handleDownloadProtocol = (step: NextStep) => {
    const stepResult = stepResults[step.id];
    
    const protocol = {
      stepInfo: {
        stepId: step.id,
        title: step.title,
        description: step.description,
        tools: step.tools,
        parameters: step.parameters,
        estimatedTime: step.estimatedTime,
        reasoning: step.reasoning,
        category: step.category
      },
      executionResults: stepResult || null,
      commandLines: stepResult?.commands || generateCommandLines(step),
      files: stepResult?.files || [],
      recommendations: stepResult?.recommendations || [],
      statistics: stepResult?.assemblyStats || stepResult?.quastResults || stepResult?.outputStats || null,
      timestamp: new Date().toISOString(),
      completed: completedSteps.has(step.id)
    };

    // Format approprié selon le type d'étape
    let content, filename, mimeType;
    
    if (stepResult && step.category === 'analysis') {
      // Rapport d'évaluation détaillé
      content = generateEvaluationReport(protocol);
      filename = `rapport-evaluation-${step.id}-${new Date().toISOString().split('T')[0]}.html`;
      mimeType = 'text/html';
    } else if (stepResult && step.category === 'assembly') {
      // Rapport d'assemblage
      content = generateAssemblyReport(protocol);
      filename = `rapport-assemblage-${step.id}-${new Date().toISOString().split('T')[0]}.html`;
      mimeType = 'text/html';
    } else if (stepResult && step.category === 'quality') {
      // Rapport de validation qualité
      content = generateQualityReport(protocol);
      filename = `rapport-qualite-${step.id}-${new Date().toISOString().split('T')[0]}.html`;
      mimeType = 'text/html';
    } else {
      // Protocole JSON par défaut
      content = JSON.stringify(protocol, null, 2);
      filename = `protocole-${step.id}-${new Date().toISOString().split('T')[0]}.json`;
      mimeType = 'application/json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Rapport téléchargé",
      description: `${stepResult ? 'Rapport détaillé' : 'Protocole'} pour ${step.title}`,
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

  const generateQualityReport = (protocol: any) => {
    const result = protocol.executionResults;
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Rapport de Validation Qualité</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; }
        .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
        .stat-box { background: #e9ecef; padding: 15px; border-radius: 5px; }
        .commands { background: #f8f9fa; padding: 15px; border-radius: 5px; font-family: monospace; }
        .improvement { color: #28a745; font-weight: bold; }
        .files { margin: 20px 0; }
        .file { background: #fff; border: 1px solid #dee2e6; padding: 10px; margin: 5px 0; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Rapport de Validation Qualité</h1>
        <p><strong>Étape :</strong> ${protocol.stepInfo.title}</p>
        <p><strong>Date :</strong> ${new Date(protocol.timestamp).toLocaleDateString('fr-FR')}</p>
    </div>
    
    <div class="stats">
        <div class="stat-box">
            <h3>Données d'entrée</h3>
            <p>Reads totaux : ${result?.inputStats?.totalReads?.toLocaleString() || 'N/A'}</p>
            <p>Score qualité : ${result?.inputStats?.qualityScore || 'N/A'}</p>
            <p>Contenu GC : ${result?.inputStats?.gcContent || 'N/A'}%</p>
        </div>
        <div class="stat-box">
            <h3>Résultats après filtrage</h3>
            <p>Reads conservés : ${result?.outputStats?.totalReads?.toLocaleString() || 'N/A'}</p>
            <p>Score qualité : ${result?.outputStats?.qualityScore || 'N/A'}</p>
            <p class="improvement">Amélioration : +${result?.outputStats?.improvementPercent || 0}%</p>
        </div>
    </div>
    
    <div>
        <h3>Recommandations</h3>
        <ul>
            ${result?.recommendations?.map(r => `<li>${r}</li>`).join('') || '<li>Aucune recommandation disponible</li>'}
        </ul>
    </div>
    
    <div>
        <h3>Commandes exécutées</h3>
        <div class="commands">
            ${result?.commands?.join('\\n') || 'Commandes non disponibles'}
        </div>
    </div>
    
    <div class="files">
        <h3>Fichiers générés</h3>
        ${result?.files?.map(f => `
            <div class="file">
                <strong>${f.name}</strong> (${f.size})<br>
                <small>${f.description}</small>
            </div>
        `).join('') || '<p>Aucun fichier listé</p>'}
    </div>
</body>
</html>`;
  };

  const generateAssemblyReport = (protocol: any) => {
    const result = protocol.executionResults;
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Rapport d'Assemblage Génomique</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; }
        .stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin: 20px 0; }
        .stat-box { background: #e9ecef; padding: 15px; border-radius: 5px; text-align: center; }
        .quality { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin: 20px 0; }
        .quality-box { background: #d4edda; padding: 15px; border-radius: 5px; text-align: center; }
        .commands { background: #f8f9fa; padding: 15px; border-radius: 5px; font-family: monospace; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Rapport d'Assemblage Génomique</h1>
        <p><strong>Étape :</strong> ${protocol.stepInfo.title}</p>
        <p><strong>Date :</strong> ${new Date(protocol.timestamp).toLocaleDateString('fr-FR')}</p>
    </div>
    
    <div class="stats">
        <div class="stat-box">
            <h4>Contigs</h4>
            <h2>${result?.assemblyStats?.totalContigs || 'N/A'}</h2>
        </div>
        <div class="stat-box">
            <h4>N50</h4>
            <h2>${result?.assemblyStats?.n50?.toLocaleString() || 'N/A'} bp</h2>
        </div>
        <div class="stat-box">
            <h4>Longueur totale</h4>
            <h2>${(result?.assemblyStats?.totalLength / 1000000)?.toFixed(1) || 'N/A'} Mb</h2>
        </div>
    </div>
    
    <div class="quality">
        <div class="quality-box">
            <h4>Qualité</h4>
            <p>${result?.qualityMetrics?.rating || 'N/A'}</p>
        </div>
        <div class="quality-box">
            <h4>Continuité</h4>
            <p>${result?.qualityMetrics?.continuity || 'N/A'}</p>
        </div>
        <div class="quality-box">
            <h4>Complétude</h4>
            <p>${result?.qualityMetrics?.completeness || 'N/A'}</p>
        </div>
    </div>
    
    <div>
        <h3>Recommandations</h3>
        <ul>
            ${result?.recommendations?.map(r => `<li>${r}</li>`).join('') || '<li>Aucune recommandation disponible</li>'}
        </ul>
    </div>
    
    <div>
        <h3>Commandes exécutées</h3>
        <div class="commands">
            ${result?.commands?.join('\\n') || 'Commandes non disponibles'}
        </div>
    </div>
</body>
</html>`;
  };

  const handleDownloadFiles = (stepId: string) => {
    const stepResult = stepResults[stepId];
    if (!stepResult?.files) return;

    // Créer un fichier de manifeste pour tous les fichiers de l'étape
    const manifest = {
      stepId: stepId,
      executionDate: new Date(stepResult.executionTime).toISOString(),
      files: stepResult.files,
      downloadNote: "Fichiers générés par l'analyse bioinformatique",
      commands: stepResult.commands
    };

    const content = JSON.stringify(manifest, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fichiers-${stepId}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Liste des fichiers téléchargée",
      description: `Manifeste des ${stepResult.files.length} fichiers généré`,
    });
  };

  const generateEvaluationReport = (protocol: any) => {
    const result = protocol.executionResults;
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Rapport d'Évaluation d'Assemblage</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; }
        .metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
        .metric-group { background: #e9ecef; padding: 15px; border-radius: 5px; }
        .busco-bar { background: #ddd; height: 20px; border-radius: 10px; overflow: hidden; margin: 10px 0; }
        .busco-complete { background: #28a745; height: 100%; float: left; }
        .busco-fragmented { background: #ffc107; height: 100%; float: left; }
        .quality-overall { background: #d4edda; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Rapport d'Évaluation d'Assemblage</h1>
        <p><strong>Étape :</strong> ${protocol.stepInfo.title}</p>
        <p><strong>Date :</strong> ${new Date(protocol.timestamp).toLocaleDateString('fr-FR')}</p>
    </div>
    
    <div class="quality-overall">
        <h2>Qualité Globale : ${result?.qualityAssessment?.overall || 'N/A'}</h2>
    </div>
    
    <div class="metrics">
        <div class="metric-group">
            <h3>Analyse BUSCO</h3>
            <div class="busco-bar">
                <div class="busco-complete" style="width: ${result?.buscoResults?.complete || 0}%"></div>
                <div class="busco-fragmented" style="width: ${result?.buscoResults?.fragmented || 0}%"></div>
            </div>
            <p>Complets : ${result?.buscoResults?.complete || 0}%</p>
            <p>Fragmentés : ${result?.buscoResults?.fragmented || 0}%</p>
            <p>Manquants : ${result?.buscoResults?.missing || 0}%</p>
        </div>
        
        <div class="metric-group">
            <h3>Analyse CheckM</h3>
            <p>Complétude : ${result?.checkmResults?.completeness || 0}%</p>
            <p>Contamination : ${result?.checkmResults?.contamination || 0}%</p>
            <p>Qualité : ${result?.checkmResults?.quality || 0}</p>
        </div>
    </div>
    
    <div>
        <h3>Recommandations finales</h3>
        <ul>
            ${result?.recommendations?.map(r => `<li>${r}</li>`).join('') || '<li>Aucune recommandation disponible</li>'}
        </ul>
    </div>
    
    <div>
        <h3>Outils utilisés</h3>
        <div class="commands">
            ${result?.commands?.join('\\n') || 'Commandes non disponibles'}
        </div>
    </div>
</body>
</html>`;
  };

  const handleDownloadCompletePipeline = () => {
    const pipeline = {
      metadata: {
        title: "Pipeline Bioinformatique Complet",
        generatedAt: new Date().toISOString(),
        completionRate: `${completedSteps.size}/${recommendations?.nextSteps.length || 0}`,
        inputData: data
      },
      steps: recommendations?.nextSteps.map(step => ({
        ...step,
        completed: completedSteps.has(step.id),
        results: stepResults[step.id] || null
      })) || [],
      assessment: recommendations?.qualityAssessment,
      warnings: recommendations?.warnings || [],
      opportunities: recommendations?.opportunities || [],
      allResults: stepResults
    };
    
    const blob = new Blob([JSON.stringify(pipeline, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pipeline-bioinformatique-complet-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Pipeline complet téléchargé",
      description: "Configuration et résultats complets sauvegardés",
    });
  };

  const handleDownloadAllReports = () => {
    // Générer un rapport consolidé HTML avec tous les résultats
    const consolidatedReport = `
<!DOCTYPE html>
<html>
<head>
    <title>Rapport Consolidé - Pipeline Bioinformatique</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; }
        .summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .step-section { border: 1px solid #dee2e6; margin: 20px 0; border-radius: 8px; overflow: hidden; }
        .step-header { background: #e9ecef; padding: 15px; font-weight: bold; }
        .step-content { padding: 20px; }
        .completed { border-left: 5px solid #28a745; }
        .pending { border-left: 5px solid #6c757d; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 15px 0; }
        .stat-box { background: #e3f2fd; padding: 15px; border-radius: 5px; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Rapport Consolidé - Pipeline Bioinformatique</h1>
        <p>Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
        <p>Progression : ${completedSteps.size}/${recommendations?.nextSteps.length || 0} étapes complétées</p>
    </div>

    <div class="summary">
        <h2>Résumé Exécutif</h2>
        <div class="stats-grid">
            <div class="stat-box">
                <h4>Étapes Complétées</h4>
                <h2>${completedSteps.size}</h2>
            </div>
            <div class="stat-box">
                <h4>Progression</h4>
                <h2>${Math.round((completedSteps.size / (recommendations?.nextSteps.length || 1)) * 100)}%</h2>
            </div>
            <div class="stat-box">
                <h4>Confiance</h4>
                <h2>${recommendations?.qualityAssessment.confidenceLevel || 'N/A'}</h2>
            </div>
        </div>
        
        <h3>Évaluation Globale</h3>
        <p><strong>Prêt pour assemblage :</strong> ${recommendations?.qualityAssessment.readyForAssembly ? 'Oui' : 'Non'}</p>
        <p><strong>Filtrage recommandé :</strong> ${recommendations?.qualityAssessment.recommendedFiltering || 'N/A'}</p>
        <p><strong>Notes :</strong> ${recommendations?.qualityAssessment.notes || 'N/A'}</p>
    </div>

    ${recommendations?.nextSteps.map(step => {
      const isCompleted = completedSteps.has(step.id);
      const result = stepResults[step.id];
      
      return `
        <div class="step-section ${isCompleted ? 'completed' : 'pending'}">
            <div class="step-header">
                ${step.title} - ${isCompleted ? '✅ Complétée' : '⏳ En attente'}
            </div>
            <div class="step-content">
                <p><strong>Description :</strong> ${step.description}</p>
                <p><strong>Priorité :</strong> ${step.priority} | <strong>Temps estimé :</strong> ${step.estimatedTime}</p>
                
                ${result ? `
                    <h4>Résultats :</h4>
                    ${result.recommendations ? `
                        <ul>
                            ${result.recommendations.map(r => `<li>${r}</li>`).join('')}
                        </ul>
                    ` : ''}
                    
                    ${result.assemblyStats ? `
                        <div class="stats-grid">
                            <div class="stat-box">
                                <h5>Contigs</h5>
                                <p>${result.assemblyStats.totalContigs || 'N/A'}</p>
                            </div>
                            <div class="stat-box">
                                <h5>N50</h5>
                                <p>${result.assemblyStats.n50?.toLocaleString() || 'N/A'} bp</p>
                            </div>
                            <div class="stat-box">
                                <h5>Longueur</h5>
                                <p>${(result.assemblyStats.totalLength / 1000000)?.toFixed(1) || 'N/A'} Mb</p>
                            </div>
                        </div>
                    ` : ''}
                ` : '<p><em>Étape non encore exécutée</em></p>'}
            </div>
        </div>
      `;
    }).join('') || ''}

    ${recommendations?.warnings && recommendations.warnings.length > 0 ? `
        <div class="summary">
            <h3>⚠️ Avertissements</h3>
            <ul>
                ${recommendations.warnings.map(w => `<li>${w}</li>`).join('')}
            </ul>
        </div>
    ` : ''}

    ${recommendations?.opportunities && recommendations.opportunities.length > 0 ? `
        <div class="summary">
            <h3>🚀 Opportunités</h3>
            <ul>
                ${recommendations.opportunities.map(o => `<li>${o}</li>`).join('')}
            </ul>
        </div>
    ` : ''}
</body>
</html>`;

    const blob = new Blob([consolidatedReport], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-consolide-pipeline-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Rapport consolidé téléchargé",
      description: "Rapport HTML complet avec tous les résultats",
    });
  };

  const handleExportPipelinePDF = async () => {
    toast({
      title: "Export PDF en cours...",
      description: "Génération du rapport PDF du pipeline",
    });

    try {
      // Créer un élément HTML temporaire avec le rapport complet du pipeline
      const reportElement = document.createElement('div');
      reportElement.innerHTML = `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; color: #333;">
          <!-- En-tête -->
          <div style="text-align: center; margin-bottom: 30px; padding: 25px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Pipeline Bioinformatique</h1>
            <p style="margin: 15px 0 5px 0; font-size: 16px;">Rapport d'Exécution Complet</p>
            <p style="margin: 0; font-size: 14px;">Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
            <div style="margin-top: 15px; font-size: 18px; font-weight: bold;">
              Progression : ${completedSteps.size}/${recommendations?.nextSteps.length || 0} étapes complétées
            </div>
          </div>

          <!-- Résumé exécutif -->
          <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin: 25px 0;">
            <h2 style="margin: 0 0 20px 0; color: #495057; border-bottom: 3px solid #007bff; padding-bottom: 10px;">Résumé Exécutif</h2>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin: 20px 0;">
              <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; text-align: center;">
                <h4 style="margin: 0 0 10px 0; color: #1976d2;">Étapes Complétées</h4>
                <div style="font-size: 32px; font-weight: bold; color: #1976d2;">${completedSteps.size}</div>
              </div>
              <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; text-align: center;">
                <h4 style="margin: 0 0 10px 0; color: #2e7d32;">Progression</h4>
                <div style="font-size: 32px; font-weight: bold; color: #2e7d32;">${Math.round((completedSteps.size / (recommendations?.nextSteps.length || 1)) * 100)}%</div>
              </div>
              <div style="background: #fce4ec; padding: 20px; border-radius: 8px; text-align: center;">
                <h4 style="margin: 0 0 10px 0; color: #c2185b;">Confiance</h4>
                <div style="font-size: 18px; font-weight: bold; color: #c2185b;">${recommendations?.qualityAssessment.confidenceLevel || 'N/A'}</div>
              </div>
            </div>
            
            <div style="margin-top: 20px;">
              <h4 style="margin: 0 0 10px 0; color: #495057;">Évaluation Globale</h4>
              <p style="margin: 5px 0;"><strong>Prêt pour assemblage :</strong> ${recommendations?.qualityAssessment.readyForAssembly ? '✅ Oui' : '❌ Non'}</p>
              <p style="margin: 5px 0;"><strong>Filtrage recommandé :</strong> ${recommendations?.qualityAssessment.recommendedFiltering || 'N/A'}</p>
              <p style="margin: 5px 0;"><strong>Notes :</strong> ${recommendations?.qualityAssessment.notes || 'N/A'}</p>
            </div>
          </div>

          <!-- Détail des étapes -->
          <div style="margin: 30px 0;">
            <h2 style="margin: 0 0 20px 0; color: #495057; border-bottom: 3px solid #007bff; padding-bottom: 10px;">Détail des Étapes</h2>
            
            ${recommendations?.nextSteps.map((step, index) => {
              const isCompleted = completedSteps.has(step.id);
              const result = stepResults[step.id];
              
              return `
                <div style="border: 2px solid ${isCompleted ? '#28a745' : '#dee2e6'}; margin: 20px 0; border-radius: 10px; overflow: hidden;">
                  <div style="background: ${isCompleted ? '#d4edda' : '#f8f9fa'}; padding: 20px; border-bottom: 1px solid #dee2e6;">
                    <h3 style="margin: 0; color: ${isCompleted ? '#155724' : '#495057'};">
                      ${index + 1}. ${step.title} ${isCompleted ? '✅' : '⏳'}
                    </h3>
                    <div style="margin: 10px 0; font-size: 14px;">
                      <span style="background: ${step.priority === 'high' ? '#dc3545' : step.priority === 'medium' ? '#ffc107' : '#6c757d'}; color: white; padding: 4px 8px; border-radius: 4px; margin-right: 10px;">
                        Priorité ${step.priority === 'high' ? 'Haute' : step.priority === 'medium' ? 'Moyenne' : 'Faible'}
                      </span>
                      <span style="color: #6c757d;">⏱️ ${step.estimatedTime}</span>
                    </div>
                  </div>
                  
                  <div style="padding: 20px;">
                    <p style="margin: 0 0 15px 0; line-height: 1.6;"><strong>Description :</strong> ${step.description}</p>
                    <p style="margin: 0 0 15px 0; line-height: 1.6; font-style: italic;"><strong>Justification :</strong> ${step.reasoning}</p>
                    
                    ${result ? `
                      <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 15px 0;">
                        <h4 style="margin: 0 0 10px 0; color: #2e7d32;">✅ Résultats d'Exécution</h4>
                        ${result.recommendations ? `
                          <ul style="margin: 10px 0; padding-left: 20px;">
                            ${result.recommendations.map(r => `<li style="margin: 5px 0;">${r}</li>`).join('')}
                          </ul>
                        ` : ''}
                        
                        ${result.assemblyStats ? `
                          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin: 15px 0;">
                            <div style="background: white; padding: 10px; border-radius: 5px; text-align: center;">
                              <strong>Contigs</strong><br>${result.assemblyStats.totalContigs || 'N/A'}
                            </div>
                            <div style="background: white; padding: 10px; border-radius: 5px; text-align: center;">
                              <strong>N50</strong><br>${result.assemblyStats.n50?.toLocaleString() || 'N/A'} bp
                            </div>
                            <div style="background: white; padding: 10px; border-radius: 5px; text-align: center;">
                              <strong>Longueur</strong><br>${(result.assemblyStats.totalLength / 1000000)?.toFixed(1) || 'N/A'} Mb
                            </div>
                          </div>
                        ` : ''}

                        ${result.buscoResults ? `
                          <div style="margin: 15px 0;">
                            <strong>Analyse BUSCO :</strong>
                            <div style="background: white; padding: 10px; border-radius: 5px; margin: 5px 0;">
                              Complets: ${result.buscoResults.complete}% | 
                              Fragmentés: ${result.buscoResults.fragmented}% | 
                              Manquants: ${result.buscoResults.missing}%
                            </div>
                          </div>
                        ` : ''}

                        ${result.files && result.files.length > 0 ? `
                          <div style="margin: 15px 0;">
                            <strong>Fichiers générés :</strong>
                            <ul style="margin: 5px 0; padding-left: 20px;">
                              ${result.files.map(f => `<li>${f.name} (${f.size})</li>`).join('')}
                            </ul>
                          </div>
                        ` : ''}
                      </div>
                    ` : `
                      <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 15px 0;">
                        <p style="margin: 0; color: #856404;"><em>⏳ Étape non encore exécutée</em></p>
                      </div>
                    `}
                    
                    <div style="margin: 15px 0;">
                      <strong>Outils recommandés :</strong> ${step.tools.join(', ')}
                    </div>
                    
                    <div style="margin: 15px 0;">
                      <strong>Paramètres suggérés :</strong>
                      <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 12px; margin: 5px 0;">
                        ${Object.entries(step.parameters).map(([key, value]) => `${key}: ${value}`).join('<br>')}
                      </div>
                    </div>
                  </div>
                </div>
              `;
            }).join('') || '<p>Aucune étape définie</p>'}
          </div>

          <!-- Avertissements et opportunités -->
          ${recommendations?.warnings && recommendations.warnings.length > 0 ? `
            <div style="background: #fff3cd; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 5px solid #ffc107;">
              <h3 style="margin: 0 0 15px 0; color: #856404;">⚠️ Avertissements</h3>
              <ul style="margin: 0; padding-left: 20px;">
                ${recommendations.warnings.map(w => `<li style="margin: 5px 0;">${w}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          ${recommendations?.opportunities && recommendations.opportunities.length > 0 ? `
            <div style="background: #d1ecf1; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 5px solid #17a2b8;">
              <h3 style="margin: 0 0 15px 0; color: #0c5460;">🚀 Opportunités</h3>
              <ul style="margin: 0; padding-left: 20px;">
                ${recommendations.opportunities.map(o => `<li style="margin: 5px 0;">${o}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          <!-- Footer -->
          <div style="text-align: center; margin-top: 40px; padding: 20px; background: #e9ecef; border-radius: 10px;">
            <p style="margin: 0; color: #6c757d; font-size: 12px;">
              Rapport généré automatiquement par l'outil d'analyse bioinformatique<br>
              Pipeline exécuté avec ${completedSteps.size} étape(s) complétée(s) sur ${recommendations?.nextSteps.length || 0}
            </p>
          </div>
        </div>
      `;

      // Ajouter temporairement à la page pour le rendu
      reportElement.style.position = 'absolute';
      reportElement.style.left = '-9999px';
      reportElement.style.top = '0';
      reportElement.style.width = '800px';
      document.body.appendChild(reportElement);

      // Capturer l'élément comme image
      const canvas = await html2canvas(reportElement, {
        width: 800,
        height: reportElement.scrollHeight,
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Supprimer l'élément temporaire
      document.body.removeChild(reportElement);

      // Créer le PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190; // Largeur en mm (A4 = 210mm, margin = 10mm de chaque côté)
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Si l'image est plus haute qu'une page, on la divise
      const pageHeight = 280; // Hauteur A4 en mm moins marges
      let heightLeft = imgHeight;
      let position = 10; // Marge du haut

      // Première page
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Pages supplémentaires si nécessaire
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Télécharger le PDF
      pdf.save(`rapport-pipeline-bioinformatique-${new Date().toISOString().split('T')[0]}.pdf`);

      toast({
        title: "Export PDF terminé",
        description: "Le rapport PDF du pipeline a été téléchargé",
      });

    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      toast({
        title: "Erreur d'export",
        description: "Impossible de générer le PDF du pipeline",
        variant: "destructive",
      });
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
            <Badge variant="outline" className="bg-warning/20 text-warning border-warning ml-2">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Simulation
            </Badge>
          </CardTitle>
          <CardDescription className="text-primary-foreground/80">
            Pipeline simulé de bioinformatique avec recommandations IA - Outil éducatif uniquement
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
                      {stepResults[step.id] ? 'Télécharger Rapport' : 'Protocole'}
                    </Button>
                    
                    {stepResults[step.id]?.files && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadFiles(step.id)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Fichiers ({stepResults[step.id].files.length})
                      </Button>
                    )}
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
              onClick={() => handleDownloadCompletePipeline()}
            >
              <Download className="w-4 h-4 mr-2" />
              Pipeline Complet
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => handleDownloadAllReports()}
              disabled={completedSteps.size === 0}
            >
              <FileText className="w-4 h-4 mr-2" />
              Tous les Rapports
            </Button>

            <Button 
              variant="outline" 
              size="lg"
              onClick={() => handleExportPipelinePDF()}
              disabled={completedSteps.size === 0}
            >
              <FileText className="w-4 h-4 mr-2" />
              Export PDF Pipeline
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};