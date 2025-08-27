import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { parameters, inputData } = await req.json();
    
    console.log('Starting assembly evaluation:', { parameters, hasInputData: !!inputData });

    const evaluationResults = await performAssemblyEvaluation(parameters, inputData);
    
    return new Response(JSON.stringify(evaluationResults), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in assembly-evaluation function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function performAssemblyEvaluation(parameters: any, inputData: any) {
  const steps = [
    { name: 'Analyse QUAST', progress: 20, duration: 3000 },
    { name: 'Évaluation BUSCO', progress: 50, duration: 5000 },
    { name: 'Analyse CheckM', progress: 75, duration: 4000 },
    { name: 'Compilation des résultats', progress: 100, duration: 1000 }
  ];

  const assemblyStats = inputData?.assemblyStats || {
    totalContigs: 250,
    n50: 18000,
    totalLength: 4800000,
    longestContig: 85000
  };

  for (const step of steps) {
    await new Promise(resolve => setTimeout(resolve, step.duration));
  }

  // Simulation des métriques d'évaluation
  const buscoComplete = Math.floor(85 + Math.random() * 12);
  const buscoFragmented = Math.floor(5 + Math.random() * 8);
  const buscoMissing = 100 - buscoComplete - buscoFragmented;
  const completeness = Math.floor(88 + Math.random() * 10);
  const contamination = Math.floor(0.5 + Math.random() * 3);

  const report = {
    success: true,
    executionTime: Date.now(),
    parameters: parameters,
    quastResults: {
      contigs: assemblyStats.totalContigs,
      totalLength: assemblyStats.totalLength,
      n50: assemblyStats.n50,
      n75: Math.floor(assemblyStats.n50 * 0.6),
      longestContig: assemblyStats.longestContig,
      gcContent: (inputData?.assemblyStats?.gcContent || 42).toFixed(1)
    },
    buscoResults: {
      complete: buscoComplete,
      fragmented: buscoFragmented,
      missing: buscoMissing,
      totalGenes: 3950,
      lineage: 'bacteria_odb10'
    },
    checkmResults: {
      completeness: completeness,
      contamination: contamination,
      strainHeterogeneity: Math.floor(contamination * 0.8),
      quality: completeness - (contamination * 5)
    },
    commands: [
      `# Analyse QUAST`,
      `quast.py contigs.fasta \\`,
      `  -o quast_results \\`,
      `  --threads 4`,
      ``,
      `# Évaluation BUSCO`,
      `busco -i contigs.fasta \\`,
      `  -o busco_results \\`,
      `  -m genome \\`,
      `  -l bacteria_odb10 \\`,
      `  --cpu 4`,
      ``,
      `# Analyse CheckM`, 
      `checkm lineage_wf \\`,
      `  -t 4 \\`,
      `  contigs_dir \\`,
      `  checkm_results`
    ],
    qualityAssessment: {
      overall: getOverallQuality(buscoComplete, completeness, contamination, assemblyStats.n50),
      genomicCompleteness: completeness > 90 ? 'Excellente' : completeness > 80 ? 'Bonne' : 'Acceptable',
      contamination: contamination < 2 ? 'Faible' : contamination < 5 ? 'Modérée' : 'Élevée',
      assembly: assemblyStats.n50 > 20000 ? 'Haute qualité' : assemblyStats.n50 > 10000 ? 'Qualité standard' : 'Fragmented'
    },
    recommendations: [
      `Complétude BUSCO: ${buscoComplete}% (${buscoComplete > 90 ? 'excellent' : buscoComplete > 80 ? 'bon' : 'acceptable'})`,
      `Complétude génomique: ${completeness}%`,
      `Contamination: ${contamination}% (${contamination < 2 ? 'très faible' : contamination < 5 ? 'acceptable' : 'élevée'})`,
      assemblyStats.n50 > 15000 ? 'Assemblage de bonne qualité' : 'Assemblage fragmenté - Optimisation recommandée',
      completeness > 85 && contamination < 3 ? 'Génome de haute qualité - Prêt pour annotation' : 'Génome exploitable avec précautions'
    ],
    files: [
      {
        name: 'quast_report.html',
        description: 'Rapport QUAST interactif',
        size: '1.8 MB',
        type: 'text/html'
      },
      {
        name: 'busco_summary.txt',
        description: 'Résultats BUSCO détaillés',
        size: '245 KB',
        type: 'text/plain'
      },
      {
        name: 'checkm_results.txt',
        description: 'Analyse CheckM complète',
        size: '156 KB', 
        type: 'text/plain'
      },
      {
        name: 'evaluation_summary.pdf',
        description: 'Rapport d\'évaluation consolidé',
        size: '3.2 MB',
        type: 'application/pdf'
      }
    ]
  };

  return report;
}

function getOverallQuality(busco: number, completeness: number, contamination: number, n50: number) {
  let score = 0;
  
  // Score BUSCO (40%)
  if (busco >= 95) score += 40;
  else if (busco >= 90) score += 35;
  else if (busco >= 85) score += 30;
  else if (busco >= 80) score += 25;
  else score += 15;
  
  // Score complétude (30%)
  if (completeness >= 95) score += 30;
  else if (completeness >= 90) score += 25;
  else if (completeness >= 85) score += 20;
  else score += 15;
  
  // Score contamination (20%)
  if (contamination < 1) score += 20;
  else if (contamination < 2) score += 18;
  else if (contamination < 5) score += 15;
  else if (contamination < 10) score += 10;
  else score += 5;
  
  // Score N50 (10%)
  if (n50 >= 30000) score += 10;
  else if (n50 >= 20000) score += 8;
  else if (n50 >= 10000) score += 6;
  else score += 4;
  
  if (score >= 90) return 'Excellente';
  else if (score >= 80) return 'Très bonne';
  else if (score >= 70) return 'Bonne';
  else if (score >= 60) return 'Acceptable';
  else return 'Insuffisante';
}