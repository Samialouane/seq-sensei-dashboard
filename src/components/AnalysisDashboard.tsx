import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Download,
  FileText,
  Zap,
  RefreshCw
} from 'lucide-react';

interface AnalysisDashboardProps {
  data: any;
  onNewAnalysis?: () => void;
}

export const AnalysisDashboard = ({ data, onNewAnalysis }: AnalysisDashboardProps) => {
  const { toast } = useToast();
  // Données par défaut si aucune donnée n'est fournie
  const defaultData = {
    summary: {
      totalReads: 2500000,
      qualityScore: 38.5,
      gcContent: 42.3,
      status: 'good'
    },
    metrics: [
      { name: 'Qualité des bases', value: 38.5, status: 'good', threshold: 30 },
      { name: 'Contenu GC', value: 42.3, status: 'good', threshold: 50 },
      { name: 'Duplication', value: 15.2, status: 'warning', threshold: 20 },
      { name: 'Adaptateurs', value: 2.1, status: 'good', threshold: 5 }
    ]
  };

  const analysisData = data || defaultData;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-destructive" />;
      default:
        return <CheckCircle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-success';
      case 'warning':
        return 'text-warning';
      case 'error':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'bg-gradient-success';
      case 'warning':
        return 'bg-gradient-warning';
      case 'error':
        return 'bg-destructive';
      default:
        return 'bg-muted';
    }
  };

  // Données simulées pour les graphiques
  const qualityData = Array.from({ length: 50 }, (_, i) => ({
    position: i + 1,
    quality: 35 + Math.random() * 8 - Math.sin(i / 10) * 2,
    median: 38,
    q25: 32,
    q75: 40
  }));

  const baseContentData = Array.from({ length: 50 }, (_, i) => ({
    position: i + 1,
    A: 25 + Math.random() * 5,
    T: 25 + Math.random() * 5,
    G: 25 + Math.random() * 5,
    C: 25 + Math.random() * 5
  }));

  const handleDownloadReport = () => {
    const reportData = {
      metadata: {
        generatedAt: new Date().toISOString(),
        analysisType: 'FASTQC Analysis',
        totalFiles: analysisData.files?.length || 0
      },
      summary: analysisData.summary,
      metrics: analysisData.metrics,
      interpretation: analysisData.interpretation,
      recommendations: analysisData.recommendations,
      files: analysisData.files
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

    toast({
      title: "Rapport téléchargé",
      description: "Le rapport d'analyse a été téléchargé avec succès",
    });
  };

  const handleExportPDF = () => {
    // Simulation de l'export PDF
    toast({
      title: "Export PDF en cours...",
      description: "Génération du rapport PDF (fonctionnalité en développement)",
    });
    
    // Ici vous pourriez intégrer une librairie comme jsPDF
    setTimeout(() => {
      toast({
        title: "Export terminé",
        description: "Le rapport PDF sera bientôt disponible",
      });
    }, 2000);
  };

  const handleNewAnalysis = () => {
    if (onNewAnalysis) {
      onNewAnalysis();
    } else {
      // Recharger la page ou rediriger vers l'upload
      window.location.reload();
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Tableau de Bord d'Analyse</h2>
        <p className="text-muted-foreground">
          Résultats détaillés de l'analyse FASTQC avec interprétation par IA
        </p>
      </div>

      {/* Résumé global */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-soft hover:shadow-medium transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Reads</p>
                <p className="text-2xl font-bold">
                  {(analysisData.summary.totalReads / 1000000).toFixed(1)}M
                </p>
              </div>
              <FileText className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft hover:shadow-medium transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Score Qualité</p>
                <p className="text-2xl font-bold text-success">
                  {analysisData.summary.qualityScore}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft hover:shadow-medium transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Contenu GC</p>
                <p className="text-2xl font-bold">
                  {analysisData.summary.gcContent}%
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft hover:shadow-medium transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Statut Global</p>
                <Badge variant={analysisData.summary.status === 'good' ? 'default' : 'secondary'}>
                  {getStatusIcon(analysisData.summary.status)}
                  <span className="ml-2">
                    {analysisData.summary.status === 'good' ? 'Excellent' : 'À surveiller'}
                  </span>
                </Badge>
              </div>
              <Zap className="w-8 h-8 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métriques détaillées */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Métriques de Qualité
          </CardTitle>
          <CardDescription>
            Analyse détaillée des différents paramètres de qualité
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {analysisData.metrics.map((metric, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(metric.status)}
                    <span className="font-medium">{metric.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${getStatusColor(metric.status)}`}>
                      {metric.value}
                      {metric.name.includes('Contenu') || metric.name.includes('Duplication') ? '%' : ''}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      / {metric.threshold}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Progress 
                    value={(metric.value / metric.threshold) * 100} 
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0</span>
                    <span>Seuil: {metric.threshold}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Graphiques de qualité */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribution des Scores de Qualité</CardTitle>
            <CardDescription>
              Évolution de la qualité par position de base
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={qualityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="position" />
                  <YAxis domain={[0, 45]} />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="q75" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))" 
                    fillOpacity={0.1}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="q25" 
                    stroke="hsl(var(--primary))" 
                    fill="white"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="quality" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="median" 
                    stroke="hsl(var(--warning))" 
                    strokeWidth={1}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contenu en Bases par Position</CardTitle>
            <CardDescription>
              Proportion des bases A, T, G, C
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={baseContentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="position" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="A" 
                    stackId="1" 
                    stroke="#ff6b6b" 
                    fill="#ff6b6b" 
                    fillOpacity={0.8}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="T" 
                    stackId="1" 
                    stroke="#4ecdc4" 
                    fill="#4ecdc4" 
                    fillOpacity={0.8}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="G" 
                    stackId="1" 
                    stroke="#45b7d1" 
                    fill="#45b7d1" 
                    fillOpacity={0.8}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="C" 
                    stackId="1" 
                    stroke="#f9ca24" 
                    fill="#f9ca24" 
                    fillOpacity={0.8}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="default" size="lg" onClick={handleDownloadReport}>
              <Download className="w-4 h-4 mr-2" />
              Télécharger le Rapport
            </Button>
            <Button variant="outline" size="lg" onClick={handleExportPDF}>
              <FileText className="w-4 h-4 mr-2" />
              Exporter en PDF
            </Button>
            <Button variant="success" size="lg" onClick={handleNewAnalysis}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Nouvelle Analyse
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};