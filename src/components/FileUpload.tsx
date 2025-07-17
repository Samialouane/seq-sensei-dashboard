import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FastQCParser } from '@/lib/fastqc-parser';

interface FileUploadProps {
  onAnalysisComplete: (data: any) => void;
}

export const FileUpload = ({ onAnalysisComplete }: FileUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => 
      file.name.includes('fastqc') || 
      file.name.includes('multiqc') ||
      file.type.includes('html') ||
      file.type.includes('json') ||
      file.type.includes('zip')
    );
    
    if (validFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...validFiles]);
      toast({
        title: "Fichiers uploadés",
        description: `${validFiles.length} fichier(s) ajouté(s) avec succès`,
      });
    } else {
      toast({
        title: "Format non supporté",
        description: "Veuillez uploader des fichiers FASTQC ou MULTIQC",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setUploadedFiles(prev => [...prev, ...files]);
      toast({
        title: "Fichiers uploadés",
        description: `${files.length} fichier(s) ajouté(s) avec succès`,
      });
    }
  };

  const analyzeWithAI = async () => {
    setAnalyzing(true);
    setProgress(0);
    
    try {
      // Étape 1: Lecture des fichiers
      setProgress(20);
      toast({
        title: "Lecture des fichiers...",
        description: "Traitement des fichiers uploadés",
      });

      const fileContents = await Promise.all(
        uploadedFiles.map(async (file) => {
          const text = await file.text();
          return {
            name: file.name,
            content: text,
            size: file.size,
            type: file.type
          };
        })
      );

      // Étape 2: Analyse des données FASTQC
      setProgress(40);
      toast({
        title: "Extraction des métriques...",
        description: "Analyse des données de qualité",
      });

      // Étape 3: Traitement par l'analyseur local
      setProgress(60);
      toast({
        title: "Analyse intelligente...",
        description: "Interprétation des résultats",
      });

      // Utiliser l'analyseur local au lieu de l'API
      const analysisData = await FastQCParser.parseFiles(fileContents);

      // Étape 4: Finalisation
      setProgress(80);
      toast({
        title: "Génération du rapport...",
        description: "Préparation des résultats",
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Étape 5: Terminé
      setProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Sauvegarder dans l'historique
      const historyItem = {
        id: Date.now().toString(),
        fileName: uploadedFiles[0]?.name || 'Analyse',
        timestamp: Date.now(),
        data: analysisData
      };
      
      const existingHistory = localStorage.getItem('fastqc-analysis-history');
      const history = existingHistory ? JSON.parse(existingHistory) : [];
      history.unshift(historyItem);
      
      // Garder seulement les 20 dernières analyses
      if (history.length > 20) {
        history.splice(20);
      }
      
      localStorage.setItem('fastqc-analysis-history', JSON.stringify(history));

      setAnalyzing(false);
      onAnalysisComplete(analysisData);
      
      toast({
        title: "Analyse terminée !",
        description: "Vos résultats sont prêts à être consultés",
      });

    } catch (error) {
      setAnalyzing(false);
      setProgress(0);
      toast({
        title: "Erreur d'analyse",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Upload de Fichiers FASTQC/MULTIQC</h2>
        <p className="text-muted-foreground">
          Déposez vos fichiers de résultats pour une analyse automatique par notre agent IA
        </p>
      </div>

      {/* Zone de drop */}
      <Card className={`border-2 border-dashed transition-all duration-300 ${
        dragActive 
          ? 'border-primary bg-primary/5 shadow-glow' 
          : 'border-muted-foreground/25 hover:border-primary/50'
      }`}>
        <CardContent className="p-12">
          <div
            className="text-center"
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className={`w-16 h-16 mx-auto mb-6 ${
              dragActive ? 'text-primary animate-pulse-glow' : 'text-muted-foreground'
            }`} />
            <h3 className="text-xl font-semibold mb-2">
              Glissez-déposez vos fichiers ici
            </h3>
            <p className="text-muted-foreground mb-6">
              Formats supportés: HTML, JSON, ZIP (FASTQC/MULTIQC)
            </p>
            <div className="flex gap-4 justify-center">
              <Button variant="default" onClick={() => document.getElementById('file-input')?.click()}>
                <FileText className="w-4 h-4 mr-2" />
                Parcourir les fichiers
              </Button>
              <input
                id="file-input"
                type="file"
                multiple
                accept=".html,.json,.zip"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des fichiers uploadés */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Fichiers Uploadés ({uploadedFiles.length})
            </CardTitle>
            <CardDescription>
              Fichiers prêts pour l'analyse
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <div>
                      <div className="font-medium">{file.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Prêt
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      ×
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bouton d'analyse */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardContent className="p-6">
            {analyzing ? (
              <div className="text-center space-y-4">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                <h3 className="text-lg font-semibold">Analyse en cours...</h3>
                <Progress value={progress} className="w-full max-w-md mx-auto" />
                <p className="text-sm text-muted-foreground">
                  L'agent IA traite vos données ({progress}%)
                </p>
              </div>
            ) : (
              <div className="text-center">
                <Button 
                  variant="hero" 
                  size="lg" 
                  onClick={analyzeWithAI}
                  className="animate-pulse-glow"
                >
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Lancer l'Analyse IA
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  L'analyse prend généralement moins de 30 secondes
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};