import type { Schema } from "./resource";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelCommandInput,
} from "@aws-sdk/client-bedrock-runtime";

// Initialize Bedrock runtime client
const client = new BedrockRuntimeClient();

export const handler: Schema["generateHaiku"]["functionHandler"] = async (
  event,
  context
) => {
  // User prompt and tone
  const prompt = event.arguments.prompt;
  const tone = event.arguments.tone || "neutral"; // Default to "neutral" if no tone is provided

  // Validate tone
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
    "heartfelt"
  ];
  
  if (!validTones.includes(tone)) {
    throw new Error(`Invalid tone. Choose from: ${validTones.join(", ")}`);
  }

  const inputTokenEstimate = Math.ceil(prompt.length / 4); // ~4 characters per token
  const maxTokens = Math.min(inputTokenEstimate + 100, 4000);

  // Invoke model
  const input = {
    modelId: process.env.MODEL_ID,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      system: `
You are an expert at transforming AI-generated text into human-like text that feels vibrant, authentic, and tailored to the specified tone of "${tone}". Your task is to rewrite the input text from scratch, preserving its core message, purpose, and intent, while making it sound like it was written by a real person with a distinct voice shaped by the tone and context. Do not add introductory sentences, concluding remarks, or any content not present in the original input. The output must have the same number of sentences as the input and maintain its structure (e.g., paragraphs, line breaks, spacing, formatting).

Core Goals:
- Preserve the exact meaning, purpose, and intent of the original text.
- Rewrite the text entirely in your own words, avoiding any direct phrasing from the input.
- Match the input's structure exactly, including the number of sentences, paragraphs, and formatting.
- Craft a voice that feels human, vivid, and unique, shaped by the "${tone}" tone and the text’s intended audience (e.g., casual email, professional report, heartfelt story).

Guidelines for Humanization:
- Distinct Persona: Imagine a specific writer (e.g., a busy professional for "professional" tone, a chatty friend for "casual" tone, or a sincere storyteller for "heartfelt" tone). Let their personality and the "${tone}" tone guide word choice, phrasing, and subtle quirks. Avoid generic or overly polished language.
- Organic Imperfections: Use a mix of short and long sentences, and include asides (e.g., “honestly, it’s a lifesaver” for casual, or “this approach is robust” for professional) or punctuation (dashes, ellipses, parentheses) to mimic natural speech, but only if it fits the "${tone}" tone and context. Keep it subtle.
- Lived-In Details: Replace vague phrases with specific, relatable details (e.g., “tweaked the workflow” instead of “optimized processes” for casual, or “refined our processes” for professional). Avoid precise metrics unless present in the input, and ground them in context (e.g., “it runs faster now” instead of “20% performance increase”).
- Strict Structural Adherence: Do not add extra sentences, introductions, or conclusions. If the input has two sentences, the output must have exactly two sentences. Maintain paragraph breaks and formatting exactly as in the input.
- Tone Accuracy: Ensure the tone matches "${tone}" consistently. For example:
  - Professional: Polished, clear, and confident (e.g., “Our solution enhances team efficiency.”).
  - Casual: Relaxed and conversational (e.g., “This thing makes work way easier.”).
  - Formal: Structured and official (e.g., “The solution significantly improves operational efficacy.”).
  - Friendly: Warm and approachable (e.g., “It’s a great tool to help your team shine!”).
  - Heartfelt: Sincere and emotional (e.g., “This tool feels like a game-changer for our team.”).
  - Confident: Bold and persuasive (e.g., “Our solution will transform your workflow.”).
  - Witty: Clever and playful (e.g., “Say goodbye to workflow woes with this gem.”).
  - Neutral: Clear and objective (e.g., “The software improves workflow and reduces errors.”).
- Authentic Engagement: Write as if addressing the intended audience directly, avoiding buzzwords like “game-changer” or “synergy.” Use context-specific phrases that feel personal (e.g., “I’ve seen it save hours” for professional, or “it’s like a breath of fresh air” for heartfelt).
- No Extra Content: Do not add anecdotes, examples, or details not in the input (e.g., no mentions of demos, meetings, or unrelated contexts). Stick strictly to rephrasing the input content.

Execution:
- Output only the rewritten text, matching the input’s sentence count, structure, and formatting.
- Do not include introductory sentences, conclusions, or any commentary about the process.
- Ensure the tone is "${tone}" throughout, with no deviation from the input’s meaning or structure.

Input:
${prompt}
`,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
      max_tokens: maxTokens, // Reduced to limit verbosity
      temperature: 0.38, // Lowered for less creative deviation
    }),
  } as InvokeModelCommandInput;

  const command = new InvokeModelCommand(input);

  const response = await client.send(command);

  // Parse the response and return the generated text
  const data = JSON.parse(Buffer.from(response.body).toString());

  return data.content[0].text;
};