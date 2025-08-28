import { useState } from 'react';
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
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

  const handleExportPDF = async () => {
    toast({
      title: "Export PDF en cours...",
      description: "Génération du rapport PDF en cours",
    });

    try {
      // Créer un élément HTML temporaire avec le rapport complet
      const reportElement = document.createElement('div');
      reportElement.innerHTML = `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px;">
            <h1 style="margin: 0; font-size: 24px;">Rapport d'Analyse FASTQC</h1>
            <p style="margin: 10px 0 0 0;">Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin: 20px 0;">
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
              <h3 style="margin: 0 0 10px 0; color: #495057;">Total Reads</h3>
              <h2 style="margin: 0; color: #007bff;">${data?.summary?.totalReads?.toLocaleString() || 'N/A'}</h2>
            </div>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
              <h3 style="margin: 0 0 10px 0; color: #495057;">Score Qualité</h3>
              <h2 style="margin: 0; color: ${(data?.summary?.qualityScore || 0) >= 30 ? '#28a745' : '#dc3545'};">${data?.summary?.qualityScore || 'N/A'}</h2>
            </div>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
              <h3 style="margin: 0 0 10px 0; color: #495057;">Contenu GC</h3>
              <h2 style="margin: 0; color: #6f42c1;">${data?.summary?.gcContent || 'N/A'}%</h2>
            </div>
          </div>

          <div style="margin: 20px 0;">
            <h3 style="color: #495057; border-bottom: 2px solid #dee2e6; padding-bottom: 10px;">Résumé de l'Analyse</h3>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 10px 0;">
              <p style="margin: 0; line-height: 1.6;">${data?.interpretation || 'Aucune interprétation disponible'}</p>
            </div>
          </div>

          <div style="margin: 20px 0;">
            <h3 style="color: #495057; border-bottom: 2px solid #dee2e6; padding-bottom: 10px;">Recommandations</h3>
            ${data?.recommendations ? `
              <ul style="list-style-type: disc; padding-left: 20px; line-height: 1.6;">
                ${data.recommendations.map(rec => `<li style="margin: 5px 0;">${rec}</li>`).join('')}
              </ul>
            ` : '<p>Aucune recommandation disponible</p>'}
          </div>

          <div style="margin: 20px 0;">
            <h3 style="color: #495057; border-bottom: 2px solid #dee2e6; padding-bottom: 10px;">Métriques Détaillées</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              ${Object.entries(data?.details || {}).map(([key, value]) => `
                <div style="background: #f8f9fa; padding: 10px; border-radius: 5px;">
                  <strong>${key}:</strong> ${typeof value === 'object' ? JSON.stringify(value) : value}
                </div>
              `).join('')}
            </div>
          </div>

          <div style="margin: 20px 0;">
            <h3 style="color: #495057; border-bottom: 2px solid #dee2e6; padding-bottom: 10px;">Fichiers Analysés</h3>
            ${data?.files ? `
              <ul style="list-style-type: none; padding: 0;">
                ${data.files.map(file => `
                  <li style="background: #e9ecef; margin: 5px 0; padding: 10px; border-radius: 5px;">
                    <strong>${file.name}</strong> - ${file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Taille inconnue'}
                  </li>
                `).join('')}
              </ul>
            ` : '<p>Aucun fichier listé</p>'}
          </div>

          <div style="text-align: center; margin-top: 30px; padding: 15px; background: #e9ecef; border-radius: 8px;">
            <p style="margin: 0; color: #6c757d; font-size: 12px;">
              Rapport généré automatiquement par l'outil d'analyse bioinformatique
            </p>
          </div>
        </div>
      `;

      // Ajouter temporairement à la page pour le rendu
      reportElement.style.position = 'absolute';
      reportElement.style.left = '-9999px';
      reportElement.style.top = '0';
      document.body.appendChild(reportElement);

      // Capturer l'élément comme image
      const canvas = await html2canvas(reportElement, {
        width: 800,
        height: reportElement.scrollHeight,
        scale: 2,
        useCORS: true,
        allowTaint: true
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
        position = heightLeft - imgHeight + 10; // Décalage pour la page suivante
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Télécharger le PDF
      pdf.save(`rapport-fastqc-${new Date().toISOString().split('T')[0]}.pdf`);

      toast({
        title: "Export PDF terminé",
        description: "Le rapport PDF a été téléchargé avec succès",
      });

    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      toast({
        title: "Erreur d'export",
        description: "Impossible de générer le PDF",
        variant: "destructive",
      });
    }
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
        <div className="flex items-center justify-center gap-3 mb-4">
          <h2 className="text-3xl font-bold">Tableau de Bord d'Analyse</h2>
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Simulation Éducative
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Simulation de résultats FASTQC avec interprétation par IA - Outil éducatif uniquement
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