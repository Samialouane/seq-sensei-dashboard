import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Brain, BarChart3, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { FileUpload } from "@/components/FileUpload";
import { AnalysisDashboard } from "@/components/AnalysisDashboard";
import { ResultsInterpretation } from "@/components/ResultsInterpretation";
import { AIChat } from "@/components/AIChat";
import { HistoryTab } from "@/components/HistoryTab";
import { UserProfile } from "@/components/UserProfile";
import { supabase } from "@/lib/supabase";

interface IndexProps {
  user: any;
}

const Index = ({ user }: IndexProps) => {
  const [activeSection, setActiveSection] = useState<'upload' | 'dashboard' | 'results' | 'ai' | 'history'>('upload');
  const [analysisData, setAnalysisData] = useState(null);

  const features = [
    {
      icon: FileText,
      title: "Import FASTQC/MULTIQC",
      description: "Uploadez vos fichiers de résultats pour une analyse instantanée",
      color: "text-primary"
    },
    {
      icon: Brain,
      title: "IA d'Interprétation",
      description: "Agent intelligent qui analyse et interprète vos données automatiquement",
      color: "text-success"
    },
    {
      icon: BarChart3,
      title: "Visualisations Avancées",
      description: "Graphiques interactifs et tableaux de bord professionnels",
      color: "text-warning"
    }
  ];

  const stats = [
    { label: "Analyses Traitées", value: "1,250+", icon: CheckCircle, color: "text-success" },
    { label: "Précision IA", value: "98.7%", icon: Brain, color: "text-primary" },
    { label: "Temps Moyen", value: "< 30s", icon: AlertCircle, color: "text-warning" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="bg-background border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Brain className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold">FASTQC Agent</span>
          </div>
          <UserProfile user={user} onSignOut={() => window.location.reload()} />
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6 bg-white/20 text-white border-white/30">
              <Brain className="w-4 h-4 mr-2" />
              Intelligence Artificielle Bioinformatique
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
              Agent d'Analyse FASTQC
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-foreground/90 animate-fade-in">
              Interprétation intelligente de vos résultats de séquençage avec une précision scientifique
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-scale-in">
              <Button 
                variant="hero" 
                size="lg"
                onClick={() => {
                  setActiveSection('upload');
                  // Scroll vers la section upload
                  setTimeout(() => {
                    const uploadSection = document.querySelector('[data-section="upload"]');
                    if (uploadSection) {
                      uploadSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }, 100);
                }}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm"
              >
                <Upload className="w-5 h-5 mr-2" />
                Commencer l'Analyse
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-primary/30 text-primary hover:bg-primary/10 backdrop-blur-sm"
                onClick={() => setActiveSection('dashboard')}
                disabled={!analysisData}
              >
                <BarChart3 className="w-5 h-5 mr-2" />
                Voir le Dashboard
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-card border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <Card key={index} className="text-center shadow-soft hover:shadow-medium transition-all duration-300">
                <CardContent className="pt-6">
                  <stat.icon className={`w-12 h-12 mx-auto mb-4 ${stat.color}`} />
                  <div className="text-3xl font-bold text-foreground mb-2">{stat.value}</div>
                  <div className="text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Fonctionnalités Avancées</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Une suite complète d'outils pour l'analyse et l'interprétation de vos données de séquençage
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center shadow-soft hover:shadow-medium transition-all duration-300 hover:scale-105">
                <CardHeader>
                  <feature.icon className={`w-16 h-16 mx-auto mb-4 ${feature.color}`} />
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Main Application Sections */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          {/* Navigation */}
          <div className="flex justify-center mb-12">
            <div className="flex bg-card rounded-lg p-2 shadow-medium">
              <Button
                variant={activeSection === 'upload' ? 'default' : 'ghost'}
                onClick={() => setActiveSection('upload')}
                className="rounded-md"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
              <Button
                variant={activeSection === 'dashboard' ? 'default' : 'ghost'}
                onClick={() => setActiveSection('dashboard')}
                className="rounded-md"
                disabled={!analysisData}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <Button
                variant={activeSection === 'results' ? 'default' : 'ghost'}
                onClick={() => setActiveSection('results')}
                className="rounded-md"
              >
                <Brain className="w-4 h-4 mr-2" />
                Interprétation
              </Button>
              <Button
                variant={activeSection === 'ai' ? 'default' : 'ghost'}
                onClick={() => setActiveSection('ai')}
                className="rounded-md"
              >
                <Brain className="w-4 h-4 mr-2" />
                Agent IA
              </Button>
              <Button
                variant={activeSection === 'history' ? 'default' : 'ghost'}
                onClick={() => setActiveSection('history')}
                className="rounded-md"
              >
                <FileText className="w-4 h-4 mr-2" />
                Historique
              </Button>
            </div>
          </div>

          {/* Content Sections */}
          <div className="animate-fade-in">
            {activeSection === 'upload' && (
              <div data-section="upload">
                <FileUpload onAnalysisComplete={(data) => {
                  setAnalysisData(data);
                  setActiveSection('dashboard');
                }} />
              </div>
            )}
            {activeSection === 'dashboard' && <AnalysisDashboard data={analysisData} onNewAnalysis={() => setActiveSection('upload')} />}
            {activeSection === 'results' && <ResultsInterpretation data={analysisData} />}
            {activeSection === 'ai' && <AIChat />}
            {activeSection === 'history' && (
              <HistoryTab onLoadAnalysis={(data) => {
                setAnalysisData(data);
                setActiveSection('dashboard');
              }} />
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-4">
            <Brain className="w-8 h-8 text-primary mr-3" />
            <span className="text-2xl font-bold text-foreground">FASTQC Agent</span>
          </div>
          <p className="text-muted-foreground">
            Analyse intelligente de données bioinformatiques • Développé avec IA
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
