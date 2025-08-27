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
    
    console.log('Starting genome assembly:', { parameters, hasInputData: !!inputData });

    const assemblyResults = await performGenomeAssembly(parameters, inputData);
    
    return new Response(JSON.stringify(assemblyResults), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in genome-assembly function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function performGenomeAssembly(parameters: any, inputData: any) {
  const steps = [
    { name: 'Initialisation SPAdes', progress: 5, duration: 2000 },
    { name: 'Construction du graphe de k-mers', progress: 25, duration: 8000 },
    { name: 'Simplification du graphe', progress: 50, duration: 6000 },
    { name: 'Résolution des bulles', progress: 70, duration: 4000 },
    { name: 'Génération des contigs', progress: 90, duration: 3000 },
    { name: 'Finalisation et statistiques', progress: 100, duration: 1000 }
  ];

  const totalReads = inputData?.outputStats?.totalReads || inputData?.summary?.totalReads || 2000000;
  const coverage = Math.floor(totalReads / 100000); // Estimation simple de la couverture
  
  for (const step of steps) {
    await new Promise(resolve => setTimeout(resolve, step.duration));
  }

  // Simulation de statistiques d'assemblage réalistes
  const numContigs = Math.floor(200 + Math.random() * 300);
  const n50 = Math.floor(15000 + Math.random() * 25000);
  const longestContig = Math.floor(n50 * 3 + Math.random() * 50000);
  const totalLength = Math.floor(4500000 + Math.random() * 1000000);

  const report = {
    success: true,
    executionTime: Date.now(),
    parameters: parameters,
    assemblyStats: {
      totalContigs: numContigs,
      totalLength: totalLength,
      n50: n50,
      n90: Math.floor(n50 * 0.3),
      longestContig: longestContig,
      coverage: coverage,
      gcContent: (inputData?.summary?.gcContent || 42) + (Math.random() - 0.5) * 2
    },
    commands: [
      `spades.py \\`,
      `  -1 filtered_reads_R1.fastq \\`,
      `  -2 filtered_reads_R2.fastq \\`, 
      `  -o assembly_output \\`,
      `  --careful \\`,
      `  -m ${parameters.memory || 8} \\`,
      `  -t 4`,
      ``,
      `# Statistiques de l'assemblage`,
      `assembly-stats assembly_output/contigs.fasta`
    ],
    qualityMetrics: {
      rating: n50 > 20000 ? 'Excellent' : n50 > 10000 ? 'Bon' : 'Acceptable',
      continuity: longestContig > 100000 ? 'Haute' : longestContig > 50000 ? 'Moyenne' : 'Faible',
      completeness: coverage > 30 ? 'Complète' : coverage > 15 ? 'Satisfaisante' : 'Limitée'
    },
    recommendations: [
      `Assemblage généré avec ${numContigs} contigs`,
      `N50: ${n50.toLocaleString()} bp (${n50 > 20000 ? 'excellent' : n50 > 10000 ? 'bon' : 'acceptable'})`,
      `Contig le plus long: ${longestContig.toLocaleString()} bp`,
      `Couverture estimée: ${coverage}x`,
      coverage < 20 ? 'Couverture faible - Considérer plus de séquençage' : 'Couverture suffisante pour l\'analyse'
    ],
    files: [
      {
        name: 'contigs.fasta',
        description: 'Séquences assemblées finales',
        size: `${(totalLength / 1000000 * 1.2).toFixed(1)} MB`,
        type: 'text/fasta'
      },
      {
        name: 'scaffolds.fasta', 
        description: 'Scaffolds avec gaps',
        size: `${(totalLength / 1000000 * 1.1).toFixed(1)} MB`,
        type: 'text/fasta'
      },
      {
        name: 'assembly_graph.gfa',
        description: 'Graphe d\'assemblage',
        size: '15.2 MB',
        type: 'text/gfa'
      },
      {
        name: 'spades.log',
        description: 'Log d\'exécution SPAdes',
        size: '892 KB',
        type: 'text/plain'
      }
    ]
  };

  return report;
}