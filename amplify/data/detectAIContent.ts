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

// Fast-fail retry function for improved UX
async function invokeWithFastRetry(
  command: InvokeModelCommand, 
  maxAttempts: number = 3 // Reduced attempts for faster failure
): Promise<any> {
  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxAttempts} - Invoking Bedrock model...`);
      return await client.send(command);
    } catch (error: any) {
      lastError = error;
      console.error(`Attempt ${attempt} failed:`, error.message);
      
      // For throttling errors, fail fast and let frontend handle retries
      if (error.name === 'ThrottlingException' || error.$metadata?.httpStatusCode === 429) {
        if (attempt === 1) {
          // Immediate throttling - fail fast
          console.log('Immediate throttling detected. Failing fast for frontend retry.');
          throw {
            ...error,
            isThrottling: true,
            retryAfter: 30, // Suggest 30 second wait
            fastFail: true
          };
        } else if (attempt < maxAttempts) {
          // Quick retry with minimal delay
          const quickDelay = 2000 + (Math.random() * 1000); // 2-3 seconds
          console.log(`Quick throttling retry. Waiting ${quickDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, quickDelay));
          continue;
        }
      }
      
      // For non-throttling errors, don't retry
      if (error.name === 'ValidationException' || error.name === 'AccessDeniedException') {
        console.error(`Non-recoverable error: ${error.name}. Not retrying.`);
        break;
      }
      
      // For other errors, one quick retry only
      if (attempt < maxAttempts) {
        const shortDelay = 1000; // Just 1 second
        console.log(`General error. Quick retry in ${shortDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, shortDelay));
      }
    }
  }
  
  throw lastError;
}

// Simplified request queue with fast-fail approach
class RequestQueue {
  private static instance: RequestQueue;
  private queue: Array<{ resolve: Function; reject: Function; command: InvokeModelCommand }> = [];
  private processing: boolean = false;
  private readonly maxConcurrent = 1; // Reduced to prevent cascading throttling
  private activeRequests = 0;
  private lastThrottleTime = 0;
  private readonly throttleCooldown = 30000; // 30 seconds
  
  static getInstance(): RequestQueue {
    if (!RequestQueue.instance) {
      RequestQueue.instance = new RequestQueue();
    }
    return RequestQueue.instance;
  }
  
  async enqueue(command: InvokeModelCommand): Promise<any> {
    // Check if we're in throttle cooldown
    const now = Date.now();
    if (now - this.lastThrottleTime < this.throttleCooldown) {
      throw {
        name: 'ThrottlingException',
        message: 'Service is in throttle cooldown period',
        isThrottling: true,
        retryAfter: Math.ceil((this.throttleCooldown - (now - this.lastThrottleTime)) / 1000),
        fastFail: true
      };
    }
    
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
      
      // Process immediately without artificial delays
      try {
        const result = await invokeWithFastRetry(command);
        resolve(result);
      } catch (error: any) {
        // Track throttling for cooldown management
        if (error.isThrottling || error.name === 'ThrottlingException') {
          this.lastThrottleTime = Date.now();
        }
        reject(error);
      } finally {
        this.activeRequests--;
        // Small delay before processing next to prevent burst
        setTimeout(() => this.processQueue(), 100);
      }
    }
    
    this.processing = false;
  }
}

// HTML sanitization function to prevent markup contamination
function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  return text
    // Remove HTML tags completely
    .replace(/<[^>]*>/g, '')
    // Decode HTML entities
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    // Remove data attributes and class attributes
    .replace(/\s*data-[^=]*="[^"]*"/g, '')
    .replace(/\s*class="[^"]*"/g, '')
    // Clean up excessive whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

// Enhanced function to find accurate indices with fuzzy matching
function findAccurateIndices(originalText: string, searchText: string, contextWindow: number = 50): { startIndex: number, endIndex: number, actualText: string } {
  // Sanitize both texts to ensure clean comparison
  const cleanOriginal = sanitizeText(originalText);
  const cleanSearch = sanitizeText(searchText);
  
  if (!cleanSearch || cleanSearch.length === 0) {
    return { startIndex: 0, endIndex: 0, actualText: '' };
  }
  
  // Strategy 1: Exact match
  let startIndex = cleanOriginal.indexOf(cleanSearch);
  if (startIndex !== -1) {
    return {
      startIndex,
      endIndex: startIndex + cleanSearch.length,
      actualText: cleanOriginal.substring(startIndex, startIndex + cleanSearch.length)
    };
  }
  
  // Strategy 2: Case-insensitive match
  const lowerOriginal = cleanOriginal.toLowerCase();
  const lowerSearch = cleanSearch.toLowerCase();
  startIndex = lowerOriginal.indexOf(lowerSearch);
  if (startIndex !== -1) {
    return {
      startIndex,
      endIndex: startIndex + cleanSearch.length,
      actualText: cleanOriginal.substring(startIndex, startIndex + cleanSearch.length)
    };
  }
  
  // Strategy 3: Fuzzy match by word boundaries
  const searchWords = cleanSearch.split(/\s+/).filter(word => word.length > 2);
  if (searchWords.length > 0) {
    // Find the first significant word
    const firstWord = searchWords[0];
    const firstWordIndex = lowerOriginal.indexOf(firstWord.toLowerCase());
    
    if (firstWordIndex !== -1) {
      // Try to find a reasonable segment around this word
      const segmentStart = Math.max(0, firstWordIndex - contextWindow);
      const segmentEnd = Math.min(cleanOriginal.length, firstWordIndex + cleanSearch.length + contextWindow);
      const segment = cleanOriginal.substring(segmentStart, segmentEnd);
      
      // Check if this segment contains most of our search words
      const foundWords = searchWords.filter(word => 
        segment.toLowerCase().includes(word.toLowerCase())
      );
      
      if (foundWords.length >= Math.ceil(searchWords.length * 0.6)) { // 60% match threshold
        return {
          startIndex: segmentStart,
          endIndex: Math.min(segmentEnd, segmentStart + cleanSearch.length),
          actualText: segment.substring(0, Math.min(segment.length, cleanSearch.length))
        };
      }
    }
  }
  
  // Strategy 4: Partial match with longest common substring
  let bestMatch = { start: 0, length: 0 };
  const minMatchLength = Math.min(20, Math.floor(cleanSearch.length * 0.3));
  
  for (let i = 0; i <= cleanOriginal.length - minMatchLength; i++) {
    for (let j = minMatchLength; j <= cleanSearch.length && i + j <= cleanOriginal.length; j++) {
      const originalSubstring = cleanOriginal.substring(i, i + j).toLowerCase();
      const searchSubstring = cleanSearch.substring(0, j).toLowerCase();
      
      if (originalSubstring === searchSubstring && j > bestMatch.length) {
        bestMatch = { start: i, length: j };
      }
    }
  }
  
  if (bestMatch.length >= minMatchLength) {
    return {
      startIndex: bestMatch.start,
      endIndex: bestMatch.start + bestMatch.length,
      actualText: cleanOriginal.substring(bestMatch.start, bestMatch.start + bestMatch.length)
    };
  }
  
  // Strategy 5: Return safe fallback
  return {
    startIndex: 0,
    endIndex: Math.min(cleanSearch.length, cleanOriginal.length),
    actualText: cleanOriginal.substring(0, Math.min(cleanSearch.length, cleanOriginal.length))
  };
}

// Function to validate and correct flag indices
function validateAndCorrectFlags(flags: any[], originalText: string): any[] {
  const cleanOriginalText = sanitizeText(originalText);
  
  return flags.map(flag => {
    // Skip flags that represent entire text or conceptual patterns
    if (flag.text === 'Entire text' || 
        flag.text.includes('...') || 
        flag.text.toLowerCase().includes('throughout') ||
        flag.text.toLowerCase().includes('pattern') ||
        flag.endIndex - flag.startIndex > cleanOriginalText.length * 0.8) {
      return {
        ...flag,
        startIndex: 0,
        endIndex: cleanOriginalText.length,
        text: flag.text === 'Entire text' ? 'Entire text' : flag.text,
        actualText: 'Entire text'
      };
    }
    
    // For specific text segments, find accurate indices
    const result = findAccurateIndices(cleanOriginalText, flag.text);
    
    return {
      ...flag,
      startIndex: result.startIndex,
      endIndex: result.endIndex,
      text: result.actualText || flag.text,
      originalSearchText: flag.text, // Keep original for debugging
      confidence: result.actualText === sanitizeText(flag.text) ? flag.confidence : Math.max(50, flag.confidence - 20)
    };
  });
}

// Function to apply low score mode configuration
function applyLowScoreMode(analysisResult: any, maxScore: number = 25): any {
  // Reduce the overall score to be below maxScore
  const originalScore = analysisResult.overallScore;
  
  // Calculate a score between 0 and (maxScore - 1)
  const reducedScore = Math.min(originalScore, Math.floor(Math.random() * maxScore));
  
  // Update all score-related fields
  const modifiedResult = {
    ...analysisResult,
    overallScore: reducedScore,
    confidence: reducedScore < 10 ? 'low' : reducedScore < 20 ? 'medium' : 'high',
    summary: `Analysis shows ${reducedScore}% likelihood of AI generation. Content appears largely human-written.`,
    
    // Reduce flag severities and confidences
    flags: analysisResult.flags.map((flag: any) => ({
      ...flag,
      severity: flag.severity === 'critical' ? 'medium' : 
                flag.severity === 'high' ? 'low' : flag.severity,
      confidence: Math.min(flag.confidence, Math.floor(flag.confidence * 0.6)), // Reduce by 40%
      description: flag.description.replace(/severe|critical|obvious|clear/, 'minor')
    })),
    
    // Improve metrics to reflect lower AI likelihood
    metrics: {
      sentenceVariability: Math.max(analysisResult.metrics.sentenceVariability || 0, 70),
      vocabularyDiversity: Math.max(analysisResult.metrics.vocabularyDiversity || 0, 75),
      naturalFlow: Math.max(analysisResult.metrics.naturalFlow || 0, 80),
      personalityPresence: Math.max(analysisResult.metrics.personalityPresence || 0, 70),
      burstiness: Math.max(analysisResult.metrics.burstiness || 0, 75),
      perplexity: Math.max(analysisResult.metrics.perplexity || 0, 70)
    },
    
    // Update recommendations to be more positive
    recommendations: [
      "Content shows good human-like characteristics",
      "Minor improvements could enhance naturalness",
      "Overall writing style appears authentic",
      "Consider adding more personal touches if desired"
    ],
    
    // Add metadata to track the modification
    _modified: {
      originalScore,
      appliedMode: 'low_score',
      maxScore,
      timestamp: new Date().toISOString()
    }
  };
  
  console.log(`Applied low score mode: ${originalScore}% -> ${reducedScore}% (max: ${maxScore}%)`);
  return modifiedResult;
}

export const handler: Schema["detectAIContent"]["functionHandler"] = async (
  event,
  context
) => {
  // Extract user text to analyze and configuration options
  const textToAnalyze = event.arguments.text;
  const forceMode = event.arguments.forceMode || 'natural'; // 'natural' or 'low_score'
  const maxScore = event.arguments.maxScore || 25; // Maximum score when in force mode
  
  if (!textToAnalyze || textToAnalyze.trim().length === 0) {
    throw new Error("Text content is required for AI detection analysis");
  }

  // Sanitize input to prevent HTML contamination
  const cleanTextToAnalyze = sanitizeText(textToAnalyze);

  // Calculate appropriate token limits based on input size
  const inputTokenEstimate = Math.ceil(cleanTextToAnalyze.length / 4);
  // Reserve tokens: system prompt (~800) + user prompt (~200) + JSON structure (~1000) = ~2000
  const reservedTokens = 2000;
  const maxTokens = Math.min(
    Math.max(reservedTokens + 500, inputTokenEstimate + 1500), // Minimum viable response
    4096 // Claude's context window limit for responses
  );

  // Configure model invocation with structured output using tool calling
  const input = {
    modelId: process.env.MODEL_ID,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      system: `You are an AI content detection specialist. You will analyze text for AI-generated patterns and provide structured results using the analyze_content tool.

Your analysis should focus on:
- Repetitive structures and excessive transitions
- Corporate buzzwords and formal language patterns
- Generic phrasing and lack of specificity
- Predictable vocabulary and uniform sentence patterns
- Grammar perfection that seems unnatural
- Lack of personality or human quirks

Always use the analyze_content tool to provide your analysis in the required structured format.`,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Please analyze the following text for AI-generated content patterns and provide a detailed assessment. IMPORTANT: When providing text examples in flags, use EXACT quotes from the original text. Do not paraphrase or summarize.

${cleanTextToAnalyze.length > 4000 ? cleanTextToAnalyze.substring(0, 4000) + "..." : cleanTextToAnalyze}`,
            },
          ],
        },
      ],
      tools: [
        {
          name: "analyze_content",
          description: "Provide structured AI content detection analysis",
          input_schema: {
            type: "object",
            properties: {
              overallScore: {
                type: "integer",
                minimum: 0,
                maximum: 100,
                description: "Overall AI likelihood score (0-100)"
              },
              confidence: {
                type: "string",
                enum: ["low", "medium", "high", "very_high"],
                description: "Confidence level in the analysis"
              },
              summary: {
                type: "string",
                maxLength: 200,
                description: "Brief summary of findings"
              },
              flags: {
                type: "array",
                maxItems: 8,
                items: {
                  type: "object",
                  properties: {
                    type: {
                      type: "string",
                      enum: [
                        "repetitive_structure", "transition_overuse", "buzzword_heavy",
                        "generic_phrasing", "perfect_grammar", "robotic_flow",
                        "lack_personality", "encyclopedic_tone", "uniform_sentences",
                        "predictable_vocabulary", "formal_rigidity"
                      ]
                    },
                    severity: {
                      type: "string",
                      enum: ["low", "medium", "high", "critical"]
                    },
                    description: {
                      type: "string",
                      maxLength: 80,
                      description: "Brief description of the issue"
                    },
                    text: {
                      type: "string",
                      maxLength: 100,
                      description: "EXACT quote from the original text (not paraphrased)"
                    },
                    startIndex: {
                      type: "integer",
                      minimum: 0
                    },
                    endIndex: {
                      type: "integer",
                      minimum: 0
                    },
                    confidence: {
                      type: "integer",
                      minimum: 0,
                      maximum: 100
                    },
                    suggestion: {
                      type: "string",
                      maxLength: 100,
                      description: "Brief suggestion for improvement"
                    }
                  },
                  required: ["type", "severity", "description", "text", "startIndex", "endIndex", "confidence", "suggestion"]
                }
              },
              metrics: {
                type: "object",
                properties: {
                  sentenceVariability: { type: "integer", minimum: 0, maximum: 100 },
                  vocabularyDiversity: { type: "integer", minimum: 0, maximum: 100 },
                  naturalFlow: { type: "integer", minimum: 0, maximum: 100 },
                  personalityPresence: { type: "integer", minimum: 0, maximum: 100 },
                  burstiness: { type: "integer", minimum: 0, maximum: 100 },
                  perplexity: { type: "integer", minimum: 0, maximum: 100 }
                },
                required: ["sentenceVariability", "vocabularyDiversity", "naturalFlow", "personalityPresence", "burstiness", "perplexity"]
              },
              recommendations: {
                type: "array",
                maxItems: 5,
                items: {
                  type: "string",
                  maxLength: 100
                }
              }
            },
            required: ["overallScore", "confidence", "summary", "flags", "metrics", "recommendations"]
          }
        }
      ],
      tool_choice: { type: "tool", name: "analyze_content" },
      max_tokens: maxTokens,
      temperature: 0.1, // Low temperature for consistent, structured output
      top_p: 0.9,
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
    
    // Calculate system prompt tokens (estimate based on our system prompt and tool schema)
    const systemPromptTokens = Math.ceil(800); // More accurate estimate for tool calling
    
    // Calculate user input tokens (exclude system prompt from billing)
    const userInputTokens = Math.max(0, inputTokens - systemPromptTokens);
    
    // Billable tokens = user input + output (excluding system overhead)
    const billableTokens = userInputTokens + outputTokens;
    
    // Extract the tool use result from Claude's response
    let analysisResult;
    
    try {
      // Claude tool calling returns content with tool_use blocks
      const content = data.content;
      if (!content || !Array.isArray(content)) {
        throw new Error("Invalid response format: missing content array");
      }
      
      // Find the tool_use block
      const toolUse = content.find(block => block.type === 'tool_use' && block.name === 'analyze_content');
      if (!toolUse || !toolUse.input) {
        throw new Error("Invalid response format: missing tool_use block with analyze_content");
      }
      
      // The tool input is already structured JSON - no parsing needed!
      analysisResult = toolUse.input;
      console.log('Successfully extracted structured analysis from tool calling');
      
    } catch (extractError) {
      console.error('Tool calling extraction failed:', extractError);
      console.error('Response data:', JSON.stringify(data, null, 2));
      
      // Fallback to text parsing if tool calling fails
      if (data.content && data.content[0] && data.content[0].text) {
        console.log('Falling back to text parsing...');
        
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
        
        try {
          analysisResult = JSON.parse(result);
          console.log('Successfully parsed fallback JSON');
        } catch (parseError) {
          console.error('Fallback JSON parsing also failed:', parseError);
          // Create minimal fallback response
          analysisResult = {
            overallScore: 0,
            confidence: "low",
            summary: "Analysis could not be completed due to response format issues",
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
              "Ensure text is properly formatted",
              "Contact support if issue persists"
            ]
          };
        }
      } else {
        // No content to parse - create minimal response
        analysisResult = {
          overallScore: 0,
          confidence: "low",
          summary: "No analysis content received from the AI model",
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
            "Contact support if issue persists"
          ]
        };
      }
    }

    // Ensure required fields exist and validate/correct indices
    if (!analysisResult.overallScore) analysisResult.overallScore = 0;
    if (!analysisResult.flags) analysisResult.flags = [];
    if (!analysisResult.metrics) analysisResult.metrics = {};
    if (!analysisResult.recommendations) analysisResult.recommendations = [];

    // Apply score manipulation if in force mode
    if (forceMode === 'low_score') {
      analysisResult = applyLowScoreMode(analysisResult, maxScore);
    }

    // Validate and correct flag indices for accurate text positioning
    analysisResult.flags = validateAndCorrectFlags(analysisResult.flags, cleanTextToAnalyze);

    // Return structured data with analysis results and usage info
    return JSON.stringify({
      analysis: analysisResult,
      originalText: cleanTextToAnalyze, // Return sanitized text
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
    
    // Create a proper fallback response structure
    const createErrorResponse = (summary: string, errorType?: string, metadata?: any) => ({
      analysis: {
        overallScore: 0,
        confidence: "low" as const,
        summary,
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
          "Ensure text is properly formatted",
          "Contact support if issue persists"
        ]
      },
      originalText: cleanTextToAnalyze,
      usage: {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        systemPromptTokens: 0,
        actualInputTokens: 0,
        actualTotalTokens: 0,
        estimatedWords: 0
      },
      error: errorType || (error instanceof Error ? error.message : 'Unknown error occurred'),
      ...(metadata && { metadata })
    });
    
    // Enhanced error handling with fast-fail throttling response
    if (error.name === 'ThrottlingException' || error.$metadata?.httpStatusCode === 429 || error.isThrottling) {
      return JSON.stringify(createErrorResponse(
        "Service is experiencing high demand. Please try again in a moment.",
        'ThrottlingException',
        {
          isThrottling: true,
          retryAfter: error.retryAfter || 30,
          fastFail: error.fastFail || false,
          retryable: true
        }
      ));
    }
    
    // Return general error response for other types of errors
    return JSON.stringify(createErrorResponse(
      "Analysis failed due to technical error. Please try again."
    ));
  }
};