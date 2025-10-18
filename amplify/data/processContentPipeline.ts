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

// Shared throttling state management
let lastCallTime = 0;
const MIN_DELAY_BETWEEN_CALLS = 2000; // 2 seconds minimum between calls
const THROTTLE_BACKOFF_BASE = 5000; // 5 seconds base backoff for throttling

// Smart delay function to prevent throttling
const smartDelay = async (isThrottled = false): Promise<void> => {
  const now = Date.now();
  const timeSinceLastCall = now - lastCallTime;
  
  let delayNeeded = 0;
  
  if (isThrottled) {
    // If we hit throttling, wait longer
    delayNeeded = THROTTLE_BACKOFF_BASE;
  } else if (timeSinceLastCall < MIN_DELAY_BETWEEN_CALLS) {
    // Normal spacing between calls
    delayNeeded = MIN_DELAY_BETWEEN_CALLS - timeSinceLastCall;
  }
  
  if (delayNeeded > 0) {
    console.log(`Smart delay: waiting ${delayNeeded}ms before next call`);
    await new Promise(resolve => setTimeout(resolve, delayNeeded));
  }
  
  lastCallTime = Date.now();
};

// Reuse AI detection logic from detectAIContent function
const runAIDetection = async (text: string): Promise<any> => {
  console.log('Starting AI detection analysis...');
  
  const inputTokenEstimate = Math.ceil(text.length / 4);
  const maxTokens = Math.floor(Math.min(inputTokenEstimate * 0.5, 2000));

  const input = {
    modelId: process.env.MODEL_ID,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      system: `You are an expert AI content detection system. Analyze the provided text and identify patterns commonly found in AI-generated content. Your analysis should be thorough, evidence-based, and provide actionable insights.

You must use the provided tool to structure your response with detailed analysis and specific flags.`,
      tools: [
        {
          name: "provide_analysis",
          description: "Provide structured AI detection analysis with detailed findings",
          input_schema: {
            type: "object",
            properties: {
              overall_assessment: {
                type: "object",
                properties: {
                  ai_likelihood: {
                    type: "number",
                    description: "Likelihood this is AI-generated (0-100)"
                  },
                  confidence_level: {
                    type: "string",
                    enum: ["high", "medium", "low"],
                    description: "Confidence in the assessment"
                  },
                  primary_indicators: {
                    type: "array",
                    items: { type: "string" },
                    description: "Main indicators suggesting AI generation"
                  }
                },
                required: ["ai_likelihood", "confidence_level", "primary_indicators"]
              },
              detailed_flags: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    category: { type: "string" },
                    severity: {
                      type: "string",
                      enum: ["high", "medium", "low"]
                    },
                    description: { type: "string" },
                    examples: {
                      type: "array",
                      items: { type: "string" }
                    },
                    recommendation: { type: "string" }
                  },
                  required: ["category", "severity", "description", "examples", "recommendation"]
                }
              },
              human_like_elements: {
                type: "array",
                items: { type: "string" },
                description: "Elements that appear human-written"
              },
              recommendations: {
                type: "array",
                items: { type: "string" },
                description: "Specific suggestions to make content more human-like"
              }
            },
            required: ["overall_assessment", "detailed_flags", "human_like_elements", "recommendations"]
          }
        }
      ],
      tool_choice: {
        type: "tool",
        name: "provide_analysis"
      },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this text for AI-generated content patterns. Provide detailed analysis with specific flags and recommendations:\n\n${text}`,
            },
          ],
        },
      ],
      max_tokens: parseInt(maxTokens.toString()),
      temperature: 0.3,
      top_p: 0.9,
    }),
  } as InvokeModelCommandInput;

  const command = new InvokeModelCommand(input);
  const response = await client.send(command);
  const data = JSON.parse(Buffer.from(response.body).toString());
  
  // Extract token usage
  const usage = data.usage || {};
  const inputTokens = usage.input_tokens || 0;
  const outputTokens = usage.output_tokens || 0;
  
  // Extract analysis from tool calling response
  let analysis = null;
  if (data.content && data.content[0] && data.content[0].type === 'tool_use' && data.content[0].input) {
    analysis = data.content[0].input;
  }

  if (!analysis) {
    throw new Error('Failed to extract analysis from response');
  }

  return {
    analysis,
    usage: {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens
    }
  };
};

// Reuse humanization logic from generateHaiku function
const runHumanization = async (text: string, tone: string = "neutral"): Promise<any> => {
  console.log(`Starting humanization with ${tone} tone...`);
  
  const inputTokenEstimate = Math.ceil(text.length / 4);
  const maxTokens = Math.floor(Math.min(inputTokenEstimate * 1.5, 6000));

  const input = {
    modelId: process.env.MODEL_ID,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      system: `You're a professional human writer with years of experience crafting authentic, engaging content. Your task is to completely rewrite the provided text using a "${tone}" voice while keeping the core message intact. Write as if you're a real person sharing thoughts naturally - not an AI following instructions.

ESSENTIAL GUIDELINES:
• Start writing immediately - no introductions or explanations
• Never use phrases like "Here is" or "The rewritten version"
• Match the original's paragraph structure and general length
• Write with genuine human personality and natural flow

ANTI-DETECTION TECHNIQUES (Critical for human-like writing):

1. SENTENCE VARIETY:
   - Mix short punchy sentences with longer, complex ones
   - Use fragments occasionally ("Exactly.", "Not quite.", "Here's the thing.")
   - Vary sentence starters (avoid repetitive patterns)
   - Include compound sentences with natural conjunctions

2. VOCABULARY & STYLE:
   - Use contractions naturally (don't, won't, it's, we're)
   - Include filler words when appropriate (actually, basically, pretty much)
   - Mix common words with less predictable synonyms
   - Add subtle redundancies humans use ("end result", "past history")
   - Use domain-specific terms without over-explaining

3. HUMAN IMPERFECTIONS:
   - Include slight grammatical variations (starting with "And" or "But")
   - Use informal transitions ("So", "Now", "Anyway")
   - Add conversational asides in parentheses when natural
   - Include rhetorical questions if they fit the tone
   - Use ellipses for trailing thoughts when appropriate...

4. UNPREDICTABLE PATTERNS:
   - Avoid formulaic structures (don't always use topic → details → conclusion)
   - Vary paragraph lengths significantly
   - Break conventional rules when it sounds more natural
   - Use unexpected word choices that still fit the meaning
   - Include subtle emotional undertones even in neutral content

5. TONE-SPECIFIC AUTHENTICITY for "${tone}":
   - Neutral: Matter-of-fact but not robotic, occasional hedging ("seems to", "appears")
   - Casual: Relaxed grammar, contractions, everyday language, personal touches
   - Conversational: Direct address, questions, natural speech patterns
   - Friendly: Warm word choices, inclusive language, positive framing
   - Professional: Polished but not perfect, confident without being stiff
   - Formal: Proper but not archaic, sophisticated vocabulary, complete sentences
   - Confident: Strong statements, active voice, decisive language
   - Academic: Evidence-based thinking, qualified statements, analytical depth
   - Technical: Precise terminology, logical flow, assume audience knowledge
   - Creative: Vivid imagery, unexpected metaphors, playful language
   - Witty: Clever observations, subtle humor, smart wordplay
   - Funny: Natural humor, timing through punctuation, relatable examples
   - Heartfelt: Emotional authenticity, personal connection, vulnerable moments

You must use the provided tool to structure your response properly. The humanized content should be natural, authentic, and completely undetectable as AI-generated.`,
      tools: [
        {
          name: "provide_humanized_content",
          description: "Provide the humanized content that sounds completely natural and human-written",
          input_schema: {
            type: "object",
            properties: {
              humanized_text: {
                type: "string",
                description: "The rewritten text that sounds completely natural and human, with no AI-like patterns or introductory phrases"
              }
            },
            required: ["humanized_text"]
          }
        }
      ],
      tool_choice: {
        type: "tool",
        name: "provide_humanized_content"
      },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Take this content and rewrite it with a ${tone} voice. Make it sound completely natural and human - like something a real person would write. Keep the same meaning but express it in your own words. Use the tool to provide your response:\n\n${text}`,
            },
          ],
        },
      ],
      max_tokens: parseInt(maxTokens.toString()),
      temperature: 0.85,
      top_p: 0.92,
      top_k: 40,
    }),
  } as InvokeModelCommandInput;

  const command = new InvokeModelCommand(input);
  const response = await client.send(command);
  const data = JSON.parse(Buffer.from(response.body).toString());
  
  // Extract token usage
  const usage = data.usage || {};
  const inputTokens = usage.input_tokens || 0;
  const outputTokens = usage.output_tokens || 0;
  
  // Extract result from tool calling response
  let result = '';
  if (data.content && data.content[0]) {
    if (data.content[0].type === 'tool_use' && data.content[0].input) {
      result = data.content[0].input.humanized_text || '';
    } else if (data.content[0].text) {
      result = data.content[0].text;
    }
  }
  
  if (!result || result.length < 10) {
    throw new Error('Failed to generate humanized content');
  }

  return {
    content: result.trim(),
    usage: {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens
    }
  };
};

export const handler: Schema["processContentPipeline"]["functionHandler"] = async (
  event,
  context
) => {
  const { text, tone } = event.arguments;
  const safeTone = tone || "neutral";
  
  console.log('Starting sequential content processing pipeline...');
  
  try {
    // Step 1: AI Detection (always first)
    console.log('Pipeline Step 1: Running AI Detection...');
    const detectionResult = await runAIDetection(text);
    
    // Smart delay before next call to prevent throttling
    await smartDelay();
    
    // Step 2: Humanization (after delay)
    console.log('Pipeline Step 2: Running Humanization...');
    let humanizationResult;
    
    try {
      humanizationResult = await runHumanization(text, safeTone);
    } catch (error: any) {
      // If humanization fails due to throttling, provide guidance
      if (error.name === 'ThrottlingException') {
        console.log('Humanization throttled, will provide detection-only results');
        humanizationResult = {
          content: text, // Return original text
          usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
          throttled: true
        };
      } else {
        throw error;
      }
    }
    
    // Step 3: Run AI Detection on humanized content (for comparison)
    let humanizedAnalysis = null;
    if (!humanizationResult.throttled && humanizationResult.content !== text) {
      console.log('Pipeline Step 3: Analyzing humanized content...');
      
      await smartDelay();
      
      try {
        const humanizedDetectionResult = await runAIDetection(humanizationResult.content);
        humanizedAnalysis = humanizedDetectionResult.analysis;
      } catch (error: any) {
        console.log('Analysis of humanized content throttled, skipping comparison');
        humanizedAnalysis = null;
      }
    }
    
    // Return comprehensive results
    return JSON.stringify({
      success: true,
      pipeline: {
        originalText: text,
        originalAnalysis: detectionResult.analysis,
        humanizedText: humanizationResult.content,
        humanizedAnalysis,
        throttled: humanizationResult.throttled || false
      },
      usage: {
        detection: detectionResult.usage,
        humanization: humanizationResult.usage,
        total: {
          inputTokens: detectionResult.usage.inputTokens + humanizationResult.usage.inputTokens,
          outputTokens: detectionResult.usage.outputTokens + humanizationResult.usage.outputTokens,
          totalTokens: detectionResult.usage.totalTokens + humanizationResult.usage.totalTokens
        }
      }
    });
    
  } catch (error: any) {
    console.error('Pipeline processing failed:', error);
    
    // Enhanced error response with throttling info
    const errorResponse = {
      success: false,
      error: {
        name: error.name || 'PipelineError',
        message: error.message || 'Pipeline processing failed',
        isThrottling: error.name === 'ThrottlingException',
        retryAfter: error.retryAfter || 30,
        fastFail: true
      }
    };
    
    return JSON.stringify(errorResponse);
  }
};