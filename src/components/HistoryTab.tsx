import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, FileText, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface AnalysisHistoryItem {
  id: string;
  fileName: string;
  timestamp: number;
  data: any;
}

interface HistoryTabProps {
  onLoadAnalysis: (data: any) => void;
}

export const HistoryTab = ({ onLoadAnalysis }: HistoryTabProps) => {
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('fastqc-analysis-history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const clearHistory = () => {
    localStorage.removeItem('fastqc-analysis-history');
    setHistory([]);
  };

  const deleteItem = (id: string) => {
    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem('fastqc-analysis-history', JSON.stringify(updatedHistory));
  };

  const loadAnalysis = (item: AnalysisHistoryItem) => {
    onLoadAnalysis(item.data);
  };

  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-xl font-semibold mb-2">Aucun historique</h3>
        <p className="text-muted-foreground">
          Aucune analyse n'a encore été effectuée. Commencez par uploader un fichier FASTQC.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Historique des Analyses</h2>
          <p className="text-muted-foreground">
            {history.length} analyse{history.length > 1 ? 's' : ''} sauvegardée{history.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="outline" onClick={clearHistory}>
          <Trash2 className="w-4 h-4 mr-2" />
          Vider l'historique
        </Button>
      </div>

      <div className="grid gap-4">
        {history.map((item) => (
          <Card key={item.id} className="cursor-pointer hover:shadow-medium transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1" onClick={() => loadAnalysis(item)}>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    {item.fileName}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Clock className="w-4 h-4" />
                    {format(new Date(item.timestamp), 'dd/MM/yyyy à HH:mm')}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteItem(item.id);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent onClick={() => loadAnalysis(item)}>
              <div className="flex gap-2 flex-wrap">
                {item.data.totalReads && (
                  <Badge variant="secondary">
                    {item.data.totalReads.toLocaleString()} reads
                  </Badge>
                )}
                {item.data.gcContent && (
                  <Badge variant="secondary">
                    GC: {item.data.gcContent}%
                  </Badge>
                )}
                {item.data.encoding && (
                  <Badge variant="secondary">
                    {item.data.encoding}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};