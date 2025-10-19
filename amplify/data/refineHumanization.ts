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

// AI Detection Flag Interface
interface AIDetectionFlag {
  type: string;
  severity: string;
  description: string;
  text: string;
  startIndex: number;
  endIndex: number;
  confidence: number;
  suggestion: string;
  originalSearchText: string;
}

interface AIDetectionAnalysis {
  overallScore: number;
  confidence: string;
  summary: string;
  flags: AIDetectionFlag[];
  metrics: {
    sentenceVariability: number;
    vocabularyDiversity: number;
    naturalFlow: number;
    personalityPresence: number;
    burstiness: number;
    perplexity: number;
  };
  recommendations: string[];
}

interface DetectAIResult {
  analysis: AIDetectionAnalysis;
  originalText: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    systemPromptTokens: number;
    actualInputTokens: number;
    actualTotalTokens: number;
    estimatedWords: number;
  };
}

export const handler: Schema["refineHumanization"]["functionHandler"] = async (
  event,
  context
) => {
  // Parse the AI detection results
  const detectAIResultString = event.arguments.detectAIResult;
  const tone = event.arguments.tone || "neutral";
  
  let detectAIResult: DetectAIResult;
  try {
    detectAIResult = JSON.parse(detectAIResultString);
  } catch (error) {
    throw new Error("Invalid detectAI result format. Please provide valid JSON.");
  }

  const { analysis, originalText } = detectAIResult;
  const { flags, recommendations } = analysis;

  // Validate tone against allowed values
  const validTones = [
    "neutral", "casual", "conversational", "friendly", "professional",
    "formal", "confident", "academic", "technical", "creative",
    "witty", "funny", "heartfelt"
  ];

  if (!validTones.includes(tone)) {
    throw new Error(`Invalid tone. Please select from: ${validTones.join(", ")}`);
  }

  const inputTokenEstimate = Math.ceil(originalText.length / 4);
  const maxTokens = Math.floor(Math.min(inputTokenEstimate * 1.5, 6000));

  // Build flag-specific refinement instructions
  const buildFlagRefinementInstructions = (flags: AIDetectionFlag[]): string => {
    if (flags.length === 0) return "The text is already well-humanized. Make minor natural improvements.";

    let instructions = "CRITICAL FLAG CORRECTIONS NEEDED:\\n\\n";
    
    flags.forEach((flag, index) => {
      instructions += `${index + 1}. **${flag.type.toUpperCase()}** (${flag.severity} severity, ${flag.confidence}% confidence):\\n`;
      instructions += `   - Flagged text: "${flag.text}"\\n`;
      instructions += `   - Issue: ${flag.description}\\n`;
      instructions += `   - Fix required: ${flag.suggestion}\\n`;
      instructions += `   - Position: characters ${flag.startIndex}-${flag.endIndex}\\n\\n`;
    });

    return instructions;
  };

  // Build recommendations section
  const buildRecommendationsSection = (recommendations: string[]): string => {
    if (recommendations.length === 0) return "";
    
    let section = "GENERAL IMPROVEMENT RECOMMENDATIONS:\\n";
    recommendations.forEach((rec, index) => {
      section += `${index + 1}. ${rec}\\n`;
    });
    
    return section;
  };

  // Create the advanced refinement system prompt
  const systemPrompt = `You are an expert human content refinement specialist. Your task is to take text that has been flagged by AI detection systems and refine it to eliminate ALL detected AI patterns while making it sound completely natural and human-written.

CURRENT TEXT ANALYSIS:
- Overall AI Score: ${analysis.overallScore}% (Target: <20%)
- Confidence Level: ${analysis.confidence}
- Sentence Variability: ${analysis.metrics.sentenceVariability}% (Target: >80%)
- Vocabulary Diversity: ${analysis.metrics.vocabularyDiversity}% (Target: >75%)
- Natural Flow: ${analysis.metrics.naturalFlow}% (Target: >85%)
- Personality Presence: ${analysis.metrics.personalityPresence}% (Target: >85%)

${buildFlagRefinementInstructions(flags)}

${buildRecommendationsSection(recommendations)}

REFINEMENT STRATEGY FOR ${tone.toUpperCase()} TONE:

1. **PRECISE FLAG ELIMINATION**:
   - Address each flagged text segment specifically
   - Replace generic phrases with concrete, specific alternatives
   - Eliminate repetitive sentence structures
   - Remove corporate buzzwords and replace with natural language
   - Add genuine personality markers and specific details

2. **ADVANCED HUMANIZATION TECHNIQUES**:
   - Inject natural human inconsistencies and imperfections
   - Add personal touches, anecdotes, or specific examples
   - Vary sentence lengths dramatically (mix 3-word and 25+ word sentences)
   - Include natural hesitations, qualifiers, and human thinking patterns
   - Use irregular punctuation and natural speech rhythms

3. **ANTI-DETECTION OPTIMIZATION**:
   - Ensure sentence variability exceeds 80%
   - Increase vocabulary diversity above 75%
   - Boost natural flow and personality presence above 85%
   - Add authentic emotional undertones and cognitive patterns
   - Include subtle human flaws that make content undetectable

4. **TONE-SPECIFIC REFINEMENTS FOR ${tone.toUpperCase()}**:
   ${tone === 'casual' ? '- Use natural contractions inconsistently\\n   - Include casual filler words and interruptions\\n   - Add conversational tangents and personal observations' :
     tone === 'professional' ? '- Maintain polish while showing human expertise\\n   - Include professional confidence with subtle uncertainty markers\\n   - Add industry-specific insights that show real experience' :
     tone === 'conversational' ? '- Include direct address and genuine questions\\n   - Add natural conversation flows and topic shifts\\n   - Show authentic engagement and interactive elements' :
     '- Balance formality with human authenticity\\n   - Show genuine expertise with natural confidence\\n   - Include appropriate emotional undertones for the context'}

CRITICAL INSTRUCTIONS:
- Fix EVERY flagged text segment specifically
- Maintain the original meaning and key information
- Make the refined text sound like it came from a real human with genuine personality
- Ensure the result would score <20% on AI detection systems
- Never announce what you're doing - just provide the refined content

Transform the text to eliminate all AI detection flags while preserving meaning and enhancing human authenticity.`;

  // Configure model invocation
  const input = {
    modelId: process.env.MODEL_ID,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      system: systemPrompt,
      tools: [
        {
          name: "provide_refined_content",
          description: "Provide the refined content that addresses all AI detection flags and sounds completely natural and human-written",
          input_schema: {
            type: "object",
            properties: {
              refined_text: {
                type: "string",
                description: "The refined text that eliminates all AI detection flags while maintaining meaning and enhancing human authenticity"
              }
            },
            required: ["refined_text"]
          }
        }
      ],
      tool_choice: {
        type: "tool",
        name: "provide_refined_content"
      },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Refine this text to eliminate all AI detection flags and make it sound completely human-written with a ${tone} tone:\\n\\n${originalText}`,
            },
          ],
        },
      ],
      max_tokens: parseInt(maxTokens.toString()),
      temperature: 0.92, // High temperature for natural variation
      top_p: 0.88, // Balanced creativity and focus
      top_k: 30, // Good variety while maintaining quality
    }),
  } as InvokeModelCommandInput;

  const command = new InvokeModelCommand(input);
  const response = await client.send(command);
  const data = JSON.parse(Buffer.from(response.body).toString());
  
  // Extract token usage from Bedrock response
  const usage = data.usage || {};
  const inputTokens = usage.input_tokens || 0;
  const outputTokens = usage.output_tokens || 0;
  const totalTokens = inputTokens + outputTokens;
  
  // Calculate system prompt tokens (estimate for refinement prompt)
  // Refinement prompt is more detailed: ~2800-3200 characters = ~700-800 tokens
  const systemPromptTokens = Math.ceil(800);
  
  // Calculate user input tokens (exclude system prompt from billing)
  const userInputTokens = Math.max(0, inputTokens - systemPromptTokens);
  
  // Billable tokens = user input + output (excluding system overhead)
  const billableTokens = userInputTokens + outputTokens;
  
  // Extract result from tool calling response
  let result = '';
  if (data.content && data.content[0]) {
    if (data.content[0].type === 'tool_use' && data.content[0].input) {
      // Tool calling response
      result = data.content[0].input.refined_text || '';
    } else if (data.content[0].text) {
      // Fallback to regular text response
      result = data.content[0].text;
    }
  }
  
  result = result.trim();

  // Advanced post-processing: Remove AI artifacts and enhance natural patterns
  const cleanupPatterns = [
    // AI introduction patterns
    /^Here is the refined.*?[:\n]\s*/i,
    /^Here's the refined.*?[:\n]\s*/i,
    /^The refined text.*?[:\n]\s*/i,
    /^Refined version.*?[:\n]\s*/i,
    /^Here is the text.*?refined.*?[:\n]\s*/i,
    /^I've refined.*?[:\n]\s*/i,
    /^After refining.*?[:\n]\s*/i,
    
    // Meta-commentary removal
    /^\s*\(.*?refined.*?\)\s*/i,
    /^\s*\[.*?refined.*?\]\s*/i,
    
    // Clean up formatting artifacts
    /^[:\-\*\•]\s*/,
    /^\d+\.\s*/,
    /^[-\*\+]\s*/,
    
    // Remove concluding AI patterns
    /\s*This refined version.*$/i,
    /\s*The refinement.*$/i,
    /\s*Hope this helps.*$/i,
    /\s*Let me know.*$/i,
    
    // Remove surrounding quotes and formatting
    /^["'`]|["'`]$/g,
    /^\s*```[\w]*\s*|\s*```\s*$/g,
  ];

  // Apply cleanup patterns
  let previousResult = '';
  let cleanupAttempts = 0;
  while (result !== previousResult && cleanupAttempts < 3) {
    previousResult = result;
    for (const pattern of cleanupPatterns) {
      result = result.replace(pattern, '');
    }
    cleanupAttempts++;
  }

  // Final text processing for enhanced naturalness
  const enhanceNaturalness = (text: string): string => {
    let processedText = text;
    
    // Add subtle natural imperfections
    if (Math.random() < 0.2) {
      // Occasionally add natural redundancies
      processedText = processedText.replace(/\bvery important\b/gi, 'really important');
      processedText = processedText.replace(/\bexactly\b/gi, 'exactly right');
    }
    
    // Enhance natural flow with varied punctuation
    if (Math.random() < 0.15) {
      processedText = processedText.replace(/\. And /g, '. Plus, ');
      processedText = processedText.replace(/\. But /g, '. However, ');
    }
    
    // Add natural hesitation markers in casual contexts
    if (tone === 'casual' || tone === 'conversational') {
      if (Math.random() < 0.2) {
        processedText = processedText.replace(/\bI think\b/g, 'I actually think');
        processedText = processedText.replace(/\bwe should\b/g, 'we probably should');
      }
    }
    
    return processedText;
  };

  // Apply final enhancements
  result = enhanceNaturalness(result);

  // Final cleanup and standardization
  result = result
    .trim()
    .replace(/\n{3,}/g, '\n\n')
    .replace(/ {2,}/g, ' ')
    .replace(/\.{2,}/g, '...')
    .replace(/!{2,}/g, '!')
    .replace(/\?{2,}/g, '?')
    .split('\n')
    .map((line: string) => line.trim())
    .join('\n')
    .trim();

  // Safety check
  if (!result || result.length < 10) {
    result = data.content[0].text.trim().replace(/^["'`]|["'`]$/g, '');
  }

  // Return structured data matching humanize function format
  return JSON.stringify({
    content: result,
    usage: {
      inputTokens: userInputTokens,
      outputTokens,
      totalTokens: billableTokens,
      systemPromptTokens,
      actualInputTokens: inputTokens,
      actualTotalTokens: totalTokens,
      estimatedWords: Math.ceil(billableTokens / 1.3)
    }
  });
};