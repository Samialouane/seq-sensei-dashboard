import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Download,
  FileText,
  Zap
} from 'lucide-react';

interface AnalysisDashboardProps {
  data: any;
}

export const AnalysisDashboard = ({ data }: AnalysisDashboardProps) => {
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

      {/* Graphiques simulés */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribution des Scores de Qualité</CardTitle>
            <CardDescription>
              Répartition des scores par position
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted/30 rounded-lg flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                <p>Graphique de distribution</p>
                <p className="text-sm">(Données simulées)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contenu en Bases</CardTitle>
            <CardDescription>
              Proportion A, T, G, C par position
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted/30 rounded-lg flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <TrendingUp className="w-12 h-12 mx-auto mb-2" />
                <p>Graphique de contenu</p>
                <p className="text-sm">(Données simulées)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="default" size="lg">
              <Download className="w-4 h-4 mr-2" />
              Télécharger le Rapport
            </Button>
            <Button variant="outline" size="lg">
              <FileText className="w-4 h-4 mr-2" />
              Exporter en PDF
            </Button>
            <Button variant="success" size="lg">
              <Zap className="w-4 h-4 mr-2" />
              Nouvelle Analyse
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};