import type { Schema } from "./resource";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelCommandInput,
} from "@aws-sdk/client-bedrock-runtime";

// Initialize Bedrock runtime client
const client = new BedrockRuntimeClient({ 
  region: "us-east-1" 
});

export const handler: Schema["detectAIContent"]["functionHandler"] = async (
  event,
  context
) => {
  // Extract user text to analyze
  const textToAnalyze = event.arguments.text;
  
  if (!textToAnalyze || textToAnalyze.trim().length === 0) {
    throw new Error("Text content is required for AI detection analysis");
  }

  const inputTokenEstimate = Math.ceil(textToAnalyze.length / 4);
  const maxTokens = Math.floor(Math.min(inputTokenEstimate * 2, 8000));

  // Configure model invocation
  const input = {
    modelId: process.env.MODEL_ID,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      system: `You are an elite AI content detection specialist with deep expertise in identifying AI-generated text patterns. Your mission is to analyze the provided text and detect specific indicators that suggest AI generation, providing granular feedback with precise locations and confidence scores.

CRITICAL OUTPUT REQUIREMENTS:
1. You MUST respond with ONLY a valid JSON object - absolutely NO additional text, explanations, or formatting.
2. The JSON must be properly formatted and parseable.
3. Do NOT include markdown code blocks, backticks, quotes, or any wrapper text.
4. Do NOT include any introductory phrases like "Here's the analysis:" or concluding remarks.
5. Start your response immediately with the opening brace "{" and end with the closing brace "}".
6. If you include any text outside the JSON object, the system will fail.

ANALYSIS FRAMEWORK:
Examine the text for these AI-generated content indicators:

LINGUISTIC PATTERNS:
- Repetitive sentence structures or formulaic patterns
- Overuse of transitional phrases ("Furthermore," "Moreover," "Additionally," "In conclusion")
- Excessive hedging language ("might," "could," "potentially," "arguably")
- Unnatural flow or robotic cadence
- Perfect grammar with no human imperfections
- Generic or vague language lacking specificity

STYLISTIC MARKERS:
- Overly balanced or symmetrical writing
- Lack of personal voice or authentic personality
- Buzzword-heavy language or corporate speak
- Absence of idiomatic expressions or colloquialisms
- Predictable paragraph structures
- Excessive use of superlatives without context

CONTENT CHARACTERISTICS:
- Information that seems encyclopedic or reference-like
- Lack of personal anecdotes or specific examples
- Generic examples that could apply to anyone
- Overly comprehensive coverage without depth
- Abstract concepts without concrete illustrations
- Neutral tone lacking emotional nuance

SEMANTIC ANALYSIS:
- Low perplexity (predictable word choices)
- Low burstiness (uniform sentence lengths)
- Lack of creative or unexpected phrasing
- Overuse of common AI training phrases
- Absence of domain-specific jargon or expertise markers

DETECTION CONFIDENCE LEVELS:
- 90-100%: Extremely likely AI-generated (multiple strong indicators)
- 70-89%: Highly likely AI-generated (several clear indicators)
- 50-69%: Possibly AI-generated (some suspicious patterns)
- 30-49%: Unlikely AI-generated (few minor indicators)
- 0-29%: Very likely human-written (natural patterns present)

RESPONSE FORMAT (JSON only):
{
  "overallScore": number (0-100),
  "confidence": "low|medium|high|very_high",
  "summary": "Brief explanation of findings",
  "flags": [
    {
      "type": "pattern_type",
      "severity": "low|medium|high|critical",
      "description": "What was detected",
      "text": "exact flagged text",
      "startIndex": number,
      "endIndex": number,
      "confidence": number (0-100),
      "suggestion": "how to make more human-like"
    }
  ],
  "metrics": {
    "sentenceVariability": number (0-100),
    "vocabularyDiversity": number (0-100),
    "naturalFlow": number (0-100),
    "personalityPresence": number (0-100),
    "burstiness": number (0-100),
    "perplexity": number (0-100)
  },
  "recommendations": [
    "specific suggestions for humanization"
  ]
}

FLAG TYPES TO IDENTIFY:
- "repetitive_structure": Similar sentence patterns
- "transition_overuse": Excessive transitional phrases
- "hedging_language": Overuse of uncertain language
- "generic_phrasing": Vague or non-specific language
- "perfect_grammar": Unnaturally perfect writing
- "robotic_flow": Mechanical or predictable rhythm
- "buzzword_heavy": Corporate or AI-common phrases
- "lack_personality": Absence of human voice
- "encyclopedic_tone": Reference-like writing style
- "uniform_sentences": Little sentence length variation
- "predictable_vocabulary": Common or expected word choices
- "formal_rigidity": Overly structured without flexibility

Analyze the text character by character, word by word, sentence by sentence. Provide specific text locations using exact character indices. Be thorough but precise in your analysis.`,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this text for AI-generated content indicators. Return ONLY the JSON object with no additional text or formatting:

TEXT TO ANALYZE:
${textToAnalyze}

RESPOND WITH JSON ONLY - START WITH { AND END WITH }`,
            },
          ],
        },
      ],
      max_tokens: parseInt(maxTokens.toString()),
      temperature: 0.0, // Deterministic output for consistent JSON formatting
      top_p: 1.0,
    }),
  } as InvokeModelCommandInput;

  try {
    const command = new InvokeModelCommand(input);
    const response = await client.send(command);
    const data = JSON.parse(Buffer.from(response.body).toString());
    
    // Extract token usage from Bedrock response
    const usage = data.usage || {};
    const inputTokens = usage.input_tokens || 0;
    const outputTokens = usage.output_tokens || 0;
    const totalTokens = inputTokens + outputTokens;
    
    // Calculate system prompt tokens (estimate based on our system prompt)
    // Our system prompt is approximately 2000-2500 characters = ~500-625 tokens
    const systemPromptTokens = Math.ceil(600); // Conservative estimate
    
    // Calculate user input tokens (exclude system prompt from billing)
    const userInputTokens = Math.max(0, inputTokens - systemPromptTokens);
    
    // Billable tokens = user input + output (excluding system overhead)
    const billableTokens = userInputTokens + outputTokens;
    
    let result = data.content[0].text.trim();

    // Enhanced cleanup for various formatting issues
    result = result.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
    result = result.replace(/^```\s*/i, '').replace(/\s*```$/i, '');
    result = result.replace(/^`+|`+$/g, '');
    
    // Remove any leading/trailing quotes
    result = result.replace(/^["']|["']$/g, '');
    
    // Remove common AI response prefixes
    result = result.replace(/^Here's the analysis:\s*/i, '');
    result = result.replace(/^Here is the analysis:\s*/i, '');
    result = result.replace(/^Analysis result:\s*/i, '');
    result = result.replace(/^The analysis shows:\s*/i, '');
    
    // Clean whitespace and trim
    result = result.trim();
    
    // Find the first { and last } to extract only the JSON part
    const firstBrace = result.indexOf('{');
    const lastBrace = result.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && firstBrace < lastBrace) {
      result = result.substring(firstBrace, lastBrace + 1);
    }

    // Validate JSON structure
    let analysisResult;
    try {
      analysisResult = JSON.parse(result);
    } catch (parseError) {
      console.error('JSON parsing failed:', parseError);
      console.error('Raw response length:', result.length);
      console.error('Raw response preview:', result.substring(0, 500));
      console.error('Raw response end:', result.substring(result.length - 200));
      
      // Try to extract JSON from response if it's wrapped in text
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          console.log('Attempting to parse extracted JSON...');
          analysisResult = JSON.parse(jsonMatch[0]);
        } catch (secondParseError) {
          console.error('Second JSON parse attempt failed:', secondParseError);
          
          // Final fallback response if all parsing attempts fail
          analysisResult = {
            overallScore: 0,
            confidence: "low",
            summary: "Unable to parse AI analysis response. The model may have returned improperly formatted data.",
            flags: [],
            metrics: {
              sentenceVariability: 0,
              vocabularyDiversity: 0,
              naturalFlow: 0,
              personalityPresence: 0,
              burstiness: 0,
              perplexity: 0
            },
            recommendations: [
              "Try analyzing shorter text segments",
              "Ensure text is in a supported language",
              "Contact support if issue persists"
            ]
          };
        }
      } else {
        // No JSON found in response
        analysisResult = {
          overallScore: 0,
          confidence: "low", 
          summary: "No valid JSON analysis found in model response. The AI model may not have followed output format instructions.",
          flags: [],
          metrics: {
            sentenceVariability: 0,
            vocabularyDiversity: 0,
            naturalFlow: 0,
            personalityPresence: 0,
            burstiness: 0,
            perplexity: 0
          },
          recommendations: [
            "Try again with different text",
            "Ensure text is clear and well-formatted",
            "Contact support if issue persists"
          ]
        };
      }
    }

    // Ensure required fields exist
    if (!analysisResult.overallScore) analysisResult.overallScore = 0;
    if (!analysisResult.flags) analysisResult.flags = [];
    if (!analysisResult.metrics) analysisResult.metrics = {};
    if (!analysisResult.recommendations) analysisResult.recommendations = [];

    // Return structured data with analysis results and usage info
    return JSON.stringify({
      analysis: analysisResult,
      originalText: textToAnalyze,
      usage: {
        inputTokens: userInputTokens, // Only user input tokens (system prompt excluded)
        outputTokens,
        totalTokens: billableTokens, // Only billable tokens
        systemPromptTokens, // Track but don't charge for this
        actualInputTokens: inputTokens, // For internal monitoring
        actualTotalTokens: totalTokens, // For internal monitoring
        // Convert billable tokens to estimated words for display (1.3 tokens ≈ 1 word)
        estimatedWords: Math.ceil(billableTokens / 1.3)
      }
    });

  } catch (error) {
    console.error('AI Detection analysis failed:', error);
    
    // Return error response with minimal usage
    return JSON.stringify({
      analysis: {
        overallScore: 0,
        confidence: "low",
        summary: "Analysis failed due to technical error. Please try again.",
        flags: [],
        metrics: {
          sentenceVariability: 0,
          vocabularyDiversity: 0,
          naturalFlow: 0,
          personalityPresence: 0,
          burstiness: 0,
          perplexity: 0
        },
        recommendations: [
          "Try again with shorter text",
          "Check text formatting and try again"
        ]
      },
      originalText: textToAnalyze,
      usage: {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        systemPromptTokens: 0,
        actualInputTokens: 0,
        actualTotalTokens: 0,
        estimatedWords: 0
      },
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
};