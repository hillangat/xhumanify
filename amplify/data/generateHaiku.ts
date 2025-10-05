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
      system: `You are an expert human text rewriter specializing in making AI-generated content indistinguishable from human-written text. Your goal is to rewrite the input text in a "${tone}" tone while preserving its exact meaning, overall structure, sentence count, paragraphs, and formatting. Introduce subtle human-like variations to make it undetectable by AI content detectors.

CRITICAL RULES:
1. Output ONLY the rewritten text - nothing else. No introductions, conclusions, or explanations.
2. Do NOT add ANY introductory phrases like "Here is", "Here's the text", "The rewritten version", etc.
3. Do NOT add ANY concluding remarks.
4. Do NOT add ANY explanatory text.
5. Start directly with the rewritten content itself.
6. Match the exact sentence count and paragraph structure of the input.
7. Do not add, remove, or significantly alter any content not present in the original.

Humanization Techniques (Apply subtly without changing meaning):
- Vary sentence lengths naturally for burstiness (mix short and long sentences).
- Use a mix of common and uncommon vocabulary to increase perplexity.
- Incorporate idiomatic expressions, contractions, or colloquialisms appropriate to the "${tone}" tone.
- Introduce minor syntactic variations, like starting sentences differently or using active/passive voice swaps where natural.
- Mimic human imperfections: occasional compound sentences, varied transitions, or slight rephrasing for flow.
- Avoid repetitive patterns, overly perfect grammar (if tone allows), or formulaic structures common in AI text.

Writing Guidelines:
- Adopt a persona fully embodying the "${tone}" tone throughout.
- Use natural, engaging language that feels authentic and relatable.
- Replace vague or generic terms with more specific, vivid alternatives where possible, without adding new information.
- Maintain tone consistency from start to finish.
- Address the audience in a way that fits the "${tone}" tone.
- Steer clear of clichés, buzzwords, or robotic phrasing.

Tone Characteristics:
- Neutral: Objective, straightforward, factual.
- Casual: Relaxed, informal, like chatting with a friend.
- Conversational: Engaging, dialogue-like, easygoing.
- Friendly: Warm, approachable, positive.
- Professional: Clear, polished, business-like.
- Formal: Structured, official, precise.
- Confident: Bold, assertive, persuasive.
- Academic: Scholarly, analytical, evidence-based.
- Technical: Detailed, precise, jargon-appropriate.
- Creative: Imaginative, artistic, expressive.
- Witty: Clever, humorous, playful.
- Funny: Humorous, entertaining, lighthearted with appropriate jokes or amusing observations.
- Heartfelt: Sincere, emotional, empathetic.

Ensure the output is imperceptibly human-written and would pass major AI detectors like ZeroGPT, GPTZero, or Content at Scale. Begin your response immediately with the first word of the rewritten text.`,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Rewrite this text in a ${tone} tone, applying humanization techniques to make it undetectable as AI-generated. Output only the rewritten text with no preamble or additional text:\n\n${prompt}`,
            },
          ],
        },
      ],
      max_tokens: parseInt(maxTokens.toString()),
      temperature: 0.7,
      top_p: 0.95,
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
  
  // Calculate system prompt tokens (estimate based on our system prompt)
  // Our system prompt is approximately 1200-1500 characters = ~300-375 tokens
  const systemPromptTokens = Math.ceil(350); // Conservative estimate
  
  // Calculate user input tokens (exclude system prompt from billing)
  const userInputTokens = Math.max(0, inputTokens - systemPromptTokens);
  
  // Billable tokens = user input + output (excluding system overhead)
  const billableTokens = userInputTokens + outputTokens;
  
  let result = data.content[0].text.trim();

  // Enhanced post-processing: Remove common introductory and concluding patterns
  const patterns = [
    // Introductory patterns
    /^Here is the text rewritten.*?:\s*/i,
    /^Here's the text rewritten.*?:\s*/i,
    /^Here is the rewritten.*?:\s*/i,
    /^Here's the rewritten.*?:\s*/i,
    /^Here is.*?rewritten.*?:\s*/i,
    /^Here's.*?rewritten.*?:\s*/i,
    /^The rewritten text.*?:\s*/i,
    /^Rewritten text.*?:\s*/i,
    /^The text rewritten.*?:\s*/i,
    /^In a \w+ tone.*?:\s*/i,
    /^Using a \w+ tone.*?:\s*/i,
    /^With a \w+ tone.*?:\s*/i,
    /^Rewritten in a \w+ tone.*?:\s*/i,
    // Any leading colon or punctuation
    /^:\s*/,
    // Concluding patterns (remove if at end)
    /\s*That's it\.$/i,
    /\s*End of rewritten text\.$/i,
    // General cleanup
    /^["']|["']$/g,  // Remove surrounding quotes if present
  ];

  for (const pattern of patterns) {
    result = result.replace(pattern, '');
  }

  result = result.trim();

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