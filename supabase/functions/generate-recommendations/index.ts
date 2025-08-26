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
  const qualityScore = analysisData?.summary?.qualityScore || 35;
  const gcContent = analysisData?.summary?.gcContent || 42;
  const totalReads = analysisData?.summary?.totalReads || 2500000;
  
  const isHighQuality = qualityScore >= 35;
  const isGoodCoverage = totalReads >= 2000000;
  
  return {
    nextSteps: [
      {
        id: "quality_filtering",
        title: isHighQuality ? "Validation Qualité" : "Filtrage Qualité",
        description: isHighQuality ? 
          "Validation finale de la qualité avant assemblage" : 
          "Filtrage des reads de faible qualité recommandé",
        priority: isHighQuality ? "low" : "high",
        category: "quality",
        estimatedTime: "5-15 minutes",
        tools: ["Trimmomatic", "Cutadapt", "FastP"],
        parameters: {
          minQuality: isHighQuality ? "25" : "30",
          minLength: "50",
          adapter: "TruSeq3"
        },
        reasoning: isHighQuality ? 
          "Score de qualité excellent, validation recommandée" : 
          "Score de qualité modéré, filtrage nécessaire"
      },
      {
        id: "genome_assembly",
        title: "Assemblage Génomique",
        description: "Assemblage de novo du génome avec les paramètres optimaux",
        priority: "high",
        category: "assembly",
        estimatedTime: isGoodCoverage ? "30-60 minutes" : "60-120 minutes",
        tools: ["SPAdes", "MegaHit", "Flye"],
        parameters: {
          kmer: "auto",
          coverage: isGoodCoverage ? "auto" : "careful",
          memory: "8GB"
        },
        reasoning: `Avec ${(totalReads/1000000).toFixed(1)}M reads, assemblage ${isGoodCoverage ? 'standard' : 'avec paramètres conservateurs'} recommandé`
      },
      {
        id: "assembly_evaluation",
        title: "Évaluation de l'Assemblage",
        description: "Analyse de la qualité et des statistiques de l'assemblage",
        priority: "medium",
        category: "analysis",
        estimatedTime: "10-20 minutes",
        tools: ["QUAST", "BUSCO", "CheckM"],
        parameters: {
          reference: "none",
          mode: "genome",
          threads: "4"
        },
        reasoning: "Évaluation essentielle de la qualité d'assemblage"
      }
    ],
    qualityAssessment: {
      readyForAssembly: isHighQuality,
      recommendedFiltering: isHighQuality ? "light" : "moderate",
      confidenceLevel: isHighQuality && isGoodCoverage ? "high" : "medium",
      notes: `Données ${isHighQuality ? 'de haute qualité' : 'de qualité acceptable'} avec ${isGoodCoverage ? 'couverture suffisante' : 'couverture limitée'}`
    },
    warnings: [
      ...(qualityScore < 30 ? ["Score de qualité faible détecté"] : []),
      ...(gcContent < 30 || gcContent > 70 ? ["Contenu GC atypique"] : []),
      ...(totalReads < 1000000 ? ["Couverture potentiellement insuffisante"] : [])
    ],
    opportunities: [
      ...(isHighQuality ? ["Données excellentes pour publication"] : []),
      ...(isGoodCoverage ? ["Couverture suffisante pour assemblage complet"] : []),
      "Analyse phylogénétique possible",
      "Annotation génomique recommandée"
    ]
  };
}