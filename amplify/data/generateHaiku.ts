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

export const handler: Schema["generateHaiku"]["functionHandler"] = async (
  event,
  context
) => {
  // Extract user prompt and tone
  const prompt = event.arguments.prompt;
  const tone = event.arguments.tone || "neutral";

  // Validate tone against allowed values
  const validTones = [
    "neutral",
    "casual",
    "conversational",
    "friendly",
    "professional",
    "formal",
    "confident",
    "academic",
    "technical",
    "creative",
    "witty",
    "funny",
    "heartfelt"
  ];

  if (!validTones.includes(tone)) {
    throw new Error(`Invalid tone. Please select from: ${validTones.join(", ")}`);
  }

  const inputTokenEstimate = Math.ceil(prompt.length / 4);
  const maxTokens = Math.floor(Math.min(inputTokenEstimate * 1.5, 6000));

  // Configure model invocation
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
              text: `Take this content and rewrite it with a ${tone} voice. Make it sound completely natural and human - like something a real person would write. Keep the same meaning but express it in your own words. Use the tool to provide your response:\n\n${prompt}`,
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
  
  // Extract token usage from Bedrock response
  const usage = data.usage || {};
  const inputTokens = usage.input_tokens || 0;
  const outputTokens = usage.output_tokens || 0;
  const totalTokens = inputTokens + outputTokens;
  
  // Calculate system prompt tokens (estimate based on our enhanced system prompt)
  // Our system prompt is approximately 1800-2200 characters = ~450-550 tokens
  const systemPromptTokens = Math.ceil(500); // Conservative estimate for enhanced prompt
  
  // Calculate user input tokens (exclude system prompt from billing)
  const userInputTokens = Math.max(0, inputTokens - systemPromptTokens);
  
  // Billable tokens = user input + output (excluding system overhead)
  const billableTokens = userInputTokens + outputTokens;
  
  // Extract result from tool calling response
  let result = '';
  if (data.content && data.content[0]) {
    if (data.content[0].type === 'tool_use' && data.content[0].input) {
      // Tool calling response
      result = data.content[0].input.humanized_text || '';
    } else if (data.content[0].text) {
      // Fallback to regular text response
      result = data.content[0].text;
    }
  }
  
  result = result.trim();

  // Advanced post-processing: Remove AI-like patterns and artifacts
  const cleanupPatterns = [
    // Introductory AI phrases (more comprehensive)
    /^Here is the text rewritten.*?[:\n]\s*/i,
    /^Here's the text rewritten.*?[:\n]\s*/i,
    /^Here is the rewritten.*?[:\n]\s*/i,
    /^Here's the rewritten.*?[:\n]\s*/i,
    /^Here is.*?rewritten.*?[:\n]\s*/i,
    /^Here's.*?rewritten.*?[:\n]\s*/i,
    /^The rewritten text.*?[:\n]\s*/i,
    /^Rewritten text.*?[:\n]\s*/i,
    /^The text rewritten.*?[:\n]\s*/i,
    /^In a \w+ tone.*?[:\n]\s*/i,
    /^Using a \w+ tone.*?[:\n]\s*/i,
    /^With a \w+ tone.*?[:\n]\s*/i,
    /^Rewritten in a \w+ tone.*?[:\n]\s*/i,
    /^I'll rewrite.*?[:\n]\s*/i,
    /^Let me rewrite.*?[:\n]\s*/i,
    /^I can rewrite.*?[:\n]\s*/i,
    /^Taking.*?${tone}.*?tone.*?[:\n]\s*/i,
    /^.*?${tone}.*?version.*?[:\n]\s*/i,
    
    // Meta-commentary patterns
    /^\s*\(.*?rewritten.*?\)\s*/i,
    /^\s*\[.*?rewritten.*?\]\s*/i,
    /^\s*\*.*?rewritten.*?\*\s*/i,
    
    // Leading punctuation artifacts and formatting
    /^[:\-\*\•]\s*/,
    /^\d+\.\s*/, // Remove numbered list formatting
    /^[-\*\+]\s*/, // Remove bullet points
    
    // Concluding AI patterns (expanded)
    /\s*That's it[!\.]*$/i,
    /\s*End of rewritten text[!\.]*$/i,
    /\s*Hope this helps[!\.]*$/i,
    /\s*Does this work[?!\.]*$/i,
    /\s*Let me know if.*$/i,
    /\s*Is this what you.*$/i,
    /\s*\(.*?tone.*?\)\s*$/i,
    /\s*\[.*?${tone}.*?\]\s*$/i,
    /\s*---+\s*$/,
    
    // Surrounding quotes and formatting artifacts
    /^["'`]|["'`]$/g,
    /^\s*```[\w]*\s*|\s*```\s*$/g, // Remove code block markers
    /^\s*>\s*|\s*<\s*$/g, // Remove quote markers
  ];

  // Apply all cleanup patterns iteratively (some may create new matches)
  let previousResult = '';
  let cleanupAttempts = 0;
  while (result !== previousResult && cleanupAttempts < 3) {
    previousResult = result;
    for (const pattern of cleanupPatterns) {
      result = result.replace(pattern, '');
    }
    cleanupAttempts++;
  }

  // Additional humanization post-processing
  result = result
    .trim()
    // Remove excessive spacing
    .replace(/\n{3,}/g, '\n\n')
    .replace(/ {2,}/g, ' ')
    // Fix common AI-like formatting issues
    .replace(/\.{2,}/g, '...')
    .replace(/!{2,}/g, '!')
    .replace(/\?{2,}/g, '?')
    // Remove trailing/leading whitespace from each line
    .split('\n')
    .map((line: string) => line.trim())
    .join('\n')
    .trim();

  // Final safety check - ensure we don't have empty result
  if (!result || result.length < 10) {
    // Fallback - return original with minimal processing if cleanup went too far
    result = data.content[0].text.trim().replace(/^["'`]|["'`]$/g, '');
  }

  // Return structured data with content and usage info
  return JSON.stringify({
    content: result,
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
};