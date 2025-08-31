import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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
    const { analysisData, currentStep = 'analysis' } = await req.json();
    
    console.log('Generating recommendations for:', { 
      currentStep, 
      hasData: !!analysisData,
      dataKeys: analysisData ? Object.keys(analysisData) : []
    });

    // Construire le prompt en français pour les recommandations bioinformatiques
    const prompt = `En tant qu'expert en bioinformatique, analyse ces résultats FASTQC et génère des recommandations personnalisées pour les prochaines étapes :

Données d'analyse :
${JSON.stringify(analysisData, null, 2)}

Étape actuelle : ${currentStep}

Génère une réponse JSON avec cette structure exacte :
{
  "nextSteps": [
    {
      "id": "step1",
      "title": "Nom de l'étape",
      "description": "Description détaillée",
      "priority": "high|medium|low",
      "category": "quality|assembly|annotation|analysis",
      "estimatedTime": "temps estimé",
      "tools": ["outil1", "outil2"],
      "parameters": {
        "param1": "valeur1",
        "param2": "valeur2"
      },
      "reasoning": "Pourquoi cette étape est recommandée"
    }
  ],
  "qualityAssessment": {
    "readyForAssembly": true/false,
    "recommendedFiltering": "none|light|moderate|strict",
    "confidenceLevel": "high|medium|low",
    "notes": "Notes spécifiques"
  },
  "warnings": ["Liste des avertissements"],
  "opportunities": ["Liste des opportunités"]
}

Base tes recommandations sur :
1. La qualité des données (score qualité, contenu GC, duplications)
2. Le nombre de reads et la couverture
3. Les métriques spécifiques détectées
4. Les meilleures pratiques bioinformatiques actuelles

Réponds UNIQUEMENT en JSON valide, sans markdown ni texte supplémentaire.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { 
            role: 'system', 
            content: 'Tu es un expert en bioinformatique spécialisé dans l\'analyse de données de séquençage et les pipelines d\'assemblage génomique. Réponds toujours en JSON valide.' 
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1500,
        temperature: 0.3
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;
    
    console.log('AI Response:', aiResponse);

    if (!aiResponse) {
      throw new Error('Aucune réponse reçue de l\'IA');
    }

    // Parser la réponse JSON
    let recommendations;
    try {
      // Nettoyer la réponse au cas où elle contiendrait du markdown
      const cleanResponse = aiResponse.replace(/```json\n?/g, '').replace(/```/g, '').trim();
      recommendations = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error('Erreur de parsing JSON:', parseError);
      console.error('Réponse brute:', aiResponse);
      
      // Fallback avec des recommandations par défaut
      recommendations = generateFallbackRecommendations(analysisData);
    }

    return new Response(JSON.stringify(recommendations), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-recommendations function:', error);
    
    // Retourner des recommandations par défaut en cas d'erreur
    const fallbackRecommendations = generateFallbackRecommendations();
    
    return new Response(JSON.stringify(fallbackRecommendations), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateFallbackRecommendations(analysisData?: any) {
  // Extraction améliorée des métriques avec valeurs par défaut intelligentes
  const qualityScore = analysisData?.summary?.qualityScore || 28;
  const gcContent = analysisData?.summary?.gcContent || 45;
  const totalReads = analysisData?.summary?.totalReads || 850000;
  const duplicationLevel = analysisData?.summary?.duplicationLevel || 15;
  const adapterContent = analysisData?.summary?.adapterContent || 2;
  
  // Classification intelligente basée sur les métriques réelles
  const isHighQuality = qualityScore >= 35;
  const isMediumQuality = qualityScore >= 25 && qualityScore < 35;
  const isLowQuality = qualityScore < 25;
  
  const isHighCoverage = totalReads >= 5000000;
  const isMediumCoverage = totalReads >= 1000000 && totalReads < 5000000;
  const isLowCoverage = totalReads < 1000000;
  
  const hasHighDuplication = duplicationLevel > 20;
  const hasAdapterContamination = adapterContent > 5;
  const hasAtypicalGC = gcContent < 35 || gcContent > 65;
  
  // Génération des étapes avec logique contextuelle
  const nextSteps = [];
  
  // 1. Étape de filtrage qualité (toujours nécessaire mais avec paramètres adaptatifs)
  if (isLowQuality || hasAdapterContamination || hasHighDuplication) {
    nextSteps.push({
      id: "quality_filtering",
      title: "Filtrage Qualité Strict",
      description: `Filtrage intensif requis - Score: ${qualityScore}, Adaptateurs: ${adapterContent}%, Duplications: ${duplicationLevel}%`,
      priority: "high",
      category: "quality",
      estimatedTime: isLowCoverage ? "10-20 minutes" : "20-40 minutes",
      tools: hasAdapterContamination ? ["Trimmomatic", "Cutadapt"] : ["FastP", "Trimmomatic"],
      parameters: {
        minQuality: isLowQuality ? "30" : "25",
        minLength: isLowCoverage ? "30" : "50",
        adapter: hasAdapterContamination ? "TruSeq3-PE" : "auto-detect",
        deduplicate: hasHighDuplication ? "true" : "false"
      },
      reasoning: `Qualité ${isLowQuality ? 'faible' : 'modérée'} (Q${qualityScore}), ${hasAdapterContamination ? 'contamination adaptateurs détectée' : ''} ${hasHighDuplication ? 'taux de duplication élevé' : ''}`
    });
  } else if (isMediumQuality) {
    nextSteps.push({
      id: "quality_filtering",
      title: "Filtrage Qualité Modéré",
      description: `Filtrage standard recommandé - Score qualité acceptable (Q${qualityScore})`,
      priority: "medium",
      category: "quality",
      estimatedTime: "5-15 minutes",
      tools: ["FastP", "Trimmomatic"],
      parameters: {
        minQuality: "20",
        minLength: "40",
        adapter: "auto-detect"
      },
      reasoning: `Score de qualité modéré (Q${qualityScore}), filtrage léger recommandé pour optimiser l'assemblage`
    });
  } else {
    nextSteps.push({
      id: "quality_validation",
      title: "Validation Qualité",
      description: `Validation finale - Excellente qualité (Q${qualityScore})`,
      priority: "low",
      category: "quality",
      estimatedTime: "5 minutes",
      tools: ["FastQC"],
      parameters: {
        validate: "true",
        minQuality: "15"
      },
      reasoning: `Excellente qualité (Q${qualityScore}), validation rapide suffisante`
    });
  }
  
  // 2. Assemblage avec stratégie adaptée à la couverture et qualité
  let assemblyStrategy, estimatedTime, memoryReq;
  if (isHighCoverage && isHighQuality) {
    assemblyStrategy = "standard";
    estimatedTime = "30-60 minutes";
    memoryReq = "16GB";
  } else if (isMediumCoverage && isMediumQuality) {
    assemblyStrategy = "careful";
    estimatedTime = "60-120 minutes";
    memoryReq = "12GB";
  } else {
    assemblyStrategy = "conservative";
    estimatedTime = "90-180 minutes";
    memoryReq = "8GB";
  }
  
  nextSteps.push({
    id: "genome_assembly",
    title: `Assemblage ${assemblyStrategy === 'standard' ? 'Standard' : assemblyStrategy === 'careful' ? 'Prudent' : 'Conservateur'}`,
    description: `Assemblage ${assemblyStrategy} adapté à ${(totalReads/1000000).toFixed(1)}M reads (Q${qualityScore})`,
    priority: "high",
    category: "assembly",
    estimatedTime: estimatedTime,
    tools: isHighCoverage ? ["SPAdes", "MegaHit"] : isLowCoverage ? ["MegaHit", "SKESA"] : ["SPAdes", "Flye"],
    parameters: {
      kmer: isHighQuality ? "auto" : "21,33,55",
      coverage: assemblyStrategy,
      memory: memoryReq,
      threads: isHighCoverage ? "8" : "4"
    },
    reasoning: `${(totalReads/1000000).toFixed(1)}M reads avec Q${qualityScore} ${isHighCoverage ? '(haute couverture)' : isLowCoverage ? '(couverture limitée)' : '(couverture modérée)'} - stratégie ${assemblyStrategy} recommandée`
  });
  
  // 3. Évaluation avec focus sur les points critiques
  const evaluationFocus = [];
  if (hasAtypicalGC) evaluationFocus.push("contamination");
  if (isLowCoverage) evaluationFocus.push("complétude");
  if (isLowQuality) evaluationFocus.push("fragmentation");
  
  nextSteps.push({
    id: "assembly_evaluation",
    title: "Évaluation Complète",
    description: `Évaluation QUAST/BUSCO ${evaluationFocus.length > 0 ? '- Focus: ' + evaluationFocus.join(', ') : ''}`,
    priority: evaluationFocus.length > 0 ? "high" : "medium",
    category: "analysis",
    estimatedTime: "15-30 minutes",
    tools: ["QUAST", "BUSCO", hasAtypicalGC ? "CheckM" : ""].filter(Boolean),
    parameters: {
      reference: "none",
      mode: "genome",
      threads: "4",
      checkContamination: hasAtypicalGC ? "true" : "false"
    },
    reasoning: `Évaluation ${evaluationFocus.length > 0 ? 'ciblée sur ' + evaluationFocus.join(' et ') : 'standard'} nécessaire`
  });
  
  return {
    nextSteps: nextSteps,
    qualityAssessment: {
      readyForAssembly: !isLowQuality && !isLowCoverage,
      recommendedFiltering: isLowQuality || hasAdapterContamination ? "strict" : isMediumQuality ? "moderate" : "light",
      confidenceLevel: (isHighQuality && isHighCoverage) ? "high" : 
                      (isMediumQuality && isMediumCoverage) ? "medium" : "low",
      notes: `Q${qualityScore}, ${(totalReads/1000000).toFixed(1)}M reads, GC:${gcContent}%, Dup:${duplicationLevel}%`
    },
    warnings: [
      ...(isLowQuality ? [`Score de qualité faible (Q${qualityScore}) - Filtrage strict requis`] : []),
      ...(hasAtypicalGC ? [`Contenu GC atypique (${gcContent}%) - Vérifier contamination`] : []),
      ...(isLowCoverage ? [`Couverture faible (${(totalReads/1000000).toFixed(1)}M) - Assemblage fragmenté probable`] : []),
      ...(hasHighDuplication ? [`Taux de duplication élevé (${duplicationLevel}%) - Déduplication recommandée`] : []),
      ...(hasAdapterContamination ? [`Contamination adaptateurs détectée (${adapterContent}%)`] : [])
    ],
    opportunities: [
      ...(isHighQuality && isHighCoverage ? ["Données de très haute qualité - Idéal pour assemblage de référence"] : []),
      ...(isHighQuality ? ["Qualité suffisante pour analyses comparatives"] : []),
      ...(isHighCoverage ? ["Couverture élevée - Détection variants possible"] : []),
      ...(gcContent >= 35 && gcContent <= 65 ? ["Contenu GC normal - Assemblage standard recommandé"] : []),
      ...(duplicationLevel < 15 ? ["Faible duplication - Données de bonne qualité"] : []),
      "Analyse phylogénétique envisageable",
      ...(isHighQuality ? ["Annotation génomique complète recommandée"] : ["Annotation génomique de base possible"])
    ]
  };
}