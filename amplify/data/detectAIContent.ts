import type { Schema } from "./resource";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelCommandInput,
} from "@aws-sdk/client-bedrock-runtime";

// Initialize Bedrock runtime client with enhanced retry configuration
const client = new BedrockRuntimeClient({ 
  region: "us-east-1",
  maxAttempts: 8 // Increased max attempts
});

// Advanced retry function with circuit breaker pattern
async function invokeWithAdvancedRetry(
  command: InvokeModelCommand, 
  maxAttempts: number = 8
): Promise<any> {
  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxAttempts} - Invoking Bedrock model...`);
      return await client.send(command);
    } catch (error: any) {
      lastError = error;
      console.error(`Attempt ${attempt} failed:`, error.message);
      
      // Check if it's a throttling error
      if (error.name === 'ThrottlingException' || error.$metadata?.httpStatusCode === 429) {
        if (attempt === maxAttempts) {
          console.error(`All ${maxAttempts} attempts failed with throttling. Giving up.`);
          break;
        }
        
        // Calculate progressive delay with exponential backoff and jitter
        const baseDelay = Math.min(Math.pow(2, attempt) * 2000, 300000); // 2s, 4s, 8s, 16s, 32s, 64s, 120s, 300s max
        const jitter = Math.random() * 2000; // Add 0-2s random jitter
        const totalDelay = Math.floor(baseDelay + jitter);
        
        console.log(`Throttling detected. Waiting ${totalDelay}ms before retry ${attempt + 1}...`);
        await new Promise(resolve => setTimeout(resolve, totalDelay));
        continue;
      }
      
      // For non-throttling errors, use shorter delays
      if (error.name === 'ValidationException' || error.name === 'AccessDeniedException') {
        console.error(`Non-recoverable error: ${error.name}. Not retrying.`);
        break;
      }
      
      // For other errors, wait before retry
      if (attempt < maxAttempts) {
        const shortDelay = Math.min(1000 * attempt, 10000); // 1s, 2s, 3s, up to 10s
        console.log(`General error. Waiting ${shortDelay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, shortDelay));
      }
    }
  }
  
  throw lastError;
}

// Request queue to handle burst traffic
class RequestQueue {
  private static instance: RequestQueue;
  private queue: Array<{ resolve: Function; reject: Function; command: InvokeModelCommand }> = [];
  private processing: boolean = false;
  private readonly maxConcurrent = 2; // Limit concurrent requests
  private activeRequests = 0;
  
  static getInstance(): RequestQueue {
    if (!RequestQueue.instance) {
      RequestQueue.instance = new RequestQueue();
    }
    return RequestQueue.instance;
  }
  
  async enqueue(command: InvokeModelCommand): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.push({ resolve, reject, command });
      this.processQueue();
    });
  }
  
  private async processQueue() {
    if (this.processing || this.activeRequests >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }
    
    this.processing = true;
    
    while (this.queue.length > 0 && this.activeRequests < this.maxConcurrent) {
      const { resolve, reject, command } = this.queue.shift()!;
      this.activeRequests++;
      
      // Process request with staggered delays to avoid burst
      setTimeout(async () => {
        try {
          const result = await invokeWithAdvancedRetry(command);
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.activeRequests--;
          this.processQueue(); // Process next item
        }
      }, this.activeRequests * 500); // Stagger by 500ms per concurrent request
    }
    
    this.processing = false;
  }
}

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
  const maxTokens = Math.floor(Math.min(inputTokenEstimate * 3, 12000)); // Increased for larger responses

  // Configure model invocation
  const input = {
    modelId: process.env.MODEL_ID,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      system: `You are an AI content detection specialist. Analyze text for AI-generated patterns and return ONLY a JSON object with NO extra text.

CRITICAL: Respond with ONLY JSON starting with "{" and ending with "}". NO markdown, explanations, or wrapper text.

Detect these patterns:
- Repetitive structures, excessive transitions ("Furthermore," "Moreover")
- Buzzwords, corporate speak, perfect grammar
- Generic language, lack of personality/specifics
- Predictable vocabulary, uniform sentences

JSON FORMAT:
{
  "overallScore": 0-100,
  "confidence": "low|medium|high|very_high", 
  "summary": "brief findings",
  "flags": [{"type": "pattern_type", "severity": "low|medium|high|critical", "description": "issue", "text": "flagged text", "startIndex": 0, "endIndex": 0, "confidence": 0-100, "suggestion": "fix"}],
  "metrics": {"sentenceVariability": 0-100, "vocabularyDiversity": 0-100, "naturalFlow": 0-100, "personalityPresence": 0-100, "burstiness": 0-100, "perplexity": 0-100},
  "recommendations": ["suggestions"]
}

Flag types: repetitive_structure, transition_overuse, buzzword_heavy, generic_phrasing, perfect_grammar, robotic_flow, lack_personality, encyclopedic_tone, uniform_sentences, predictable_vocabulary, formal_rigidity.`,
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
    
    // Use request queue to manage concurrent requests and prevent bursts
    const requestQueue = RequestQueue.getInstance();
    console.log('Queuing AI detection request...');
    const response = await requestQueue.enqueue(command);
    
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
          
          // Try to repair truncated JSON
          console.log('Attempting to repair truncated JSON...');
          let repairedJson = jsonMatch[0];
          
          // Check if JSON is truncated and try to complete it
          if (!repairedJson.endsWith('}')) {
            // Count open braces vs close braces
            const openBraces = (repairedJson.match(/\{/g) || []).length;
            const closeBraces = (repairedJson.match(/\}/g) || []).length;
            const missingBraces = openBraces - closeBraces;
            
            // Count open brackets vs close brackets  
            const openBrackets = (repairedJson.match(/\[/g) || []).length;
            const closeBrackets = (repairedJson.match(/\]/g) || []).length;
            const missingBrackets = openBrackets - closeBrackets;
            
            // Add missing closing brackets and braces
            for (let i = 0; i < missingBrackets; i++) {
              repairedJson += ']';
            }
            for (let i = 0; i < missingBraces; i++) {
              repairedJson += '}';
            }
            
            // If still no recommendations array, add empty one
            if (!repairedJson.includes('"recommendations"')) {
              repairedJson = repairedJson.slice(0, -1) + ', "recommendations": []}';
            }
            
            console.log('Repaired JSON preview:', repairedJson.substring(0, 200));
            
            try {
              analysisResult = JSON.parse(repairedJson);
              console.log('Successfully parsed repaired JSON');
            } catch (repairError) {
              console.error('JSON repair failed:', repairError);
              throw secondParseError; // Fall back to original error
            }
          } else {
            throw secondParseError; // JSON wasn't truncated, original error stands
          }
          
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

  } catch (error: any) {
    console.error('AI Detection analysis failed:', error);
    
    // Enhanced error handling with specific throttling response
    if (error.name === 'ThrottlingException' || error.$metadata?.httpStatusCode === 429) {
      const errorResponse = {
        analysis: {
          overallScore: 0,
          confidence: "low" as const,
          summary: "Analysis temporarily unavailable due to high demand. Our AI detection service is experiencing heavy traffic. Please try again in a few moments.",
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
            "Please wait 30-60 seconds before trying again",
            "Consider analyzing shorter text segments",
            "Try again during off-peak hours for faster response"
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
        error: 'ThrottlingException: Service temporarily unavailable due to high demand'
      };
      
      return JSON.stringify(errorResponse);
    }
    
    // Return general error response for other types of errors
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
          "Check text formatting and try again",
          "Contact support if issue persists"
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