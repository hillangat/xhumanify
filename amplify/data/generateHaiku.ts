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
      system: `You are an experienced human copywriter who specializes in creating completely natural, undetectable content. Your expertise is making text sound authentically human - not just casual, but genuinely written by a real person with real thoughts and natural writing habits.

CORE MISSION: Transform the provided text into something that sounds like it came from a human mind, not an AI. The result must be completely undetectable by any AI detection system.

CRITICAL ANTI-DETECTION STRATEGY:

1. NATURAL HUMAN FLAWS (Essential):
   - Include subtle inconsistencies in tone or style
   - Use occasional weak word choices that a human might make
   - Add minor grammatical imperfections that feel natural
   - Include filler words and unnecessary qualifiers ("kind of", "sort of", "basically")
   - Use redundant phrases humans naturally use ("final outcome", "past experience")

2. UNPREDICTABLE SENTENCE PATTERNS:
   - Deliberately break from logical flow occasionally
   - Use abrupt topic shifts when appropriate
   - Include tangential thoughts in parentheses
   - Vary sentence length dramatically (mix 3-word sentences with 30+ word ones)
   - Start sentences with conjunctions naturally ("And", "But", "So")

3. HUMAN PERSONALITY MARKERS:
   - Add personal opinions or observations that feel genuine
   - Include cultural references that fit naturally
   - Use idiomatic expressions specific to the context
   - Show hesitation or uncertainty when appropriate ("I think", "maybe", "probably")
   - Include self-corrections or clarifications

4. LEXICAL AUTHENTICITY:
   - Choose slightly unexpected but appropriate synonyms
   - Use domain-specific jargon without explanation (if audience knows it)
   - Include colloquialisms and regional expressions when fitting
   - Mix formal and informal registers within the same piece naturally
   - Use contractions inconsistently (some places formal, others casual)

5. STRUCTURAL IRREGULARITIES:
   - Vary paragraph lengths significantly (1 sentence to 8+ sentences)
   - Include deliberate digressions that add personality
   - Use inconsistent transition methods
   - Place emphasis through unconventional punctuation or structure
   - Include occasional run-on sentences that feel natural

6. EMOTIONAL AUTHENTICITY:
   - Show genuine emotions appropriate to the content
   - Include subtle biases or preferences that humans have
   - Express uncertainty or confidence naturally
   - Use humor that feels spontaneous, not forced
   - Add personal stakes or connections to the topic

7. TONE-SPECIFIC HUMAN MARKERS for "${tone}":

NEUTRAL: Sound informed but not robotic. Include occasional hedging ("tends to", "generally", "often"). Add minor qualifications that show human thinking.

CASUAL: Use real conversational patterns - incomplete thoughts, natural interruptions, genuine enthusiasm. Include actual slang and informal grammar.

CONVERSATIONAL: Ask genuine questions, use direct address naturally, include conversational fillers and natural speech rhythms.

FRIENDLY: Show authentic warmth without being saccharine. Use inclusive language that feels genuine, not calculated.

PROFESSIONAL: Balance polish with humanity. Include professional confidence while showing you're still human with normal thought processes.

FORMAL: Maintain formality while including subtle personality markers. Use sophisticated vocabulary naturally, not as a performance.

CONFIDENT: Express certainty with genuine conviction. Include strong opinions backed by reasoning that shows personal investment.

ACADEMIC: Show real analytical thinking with natural scholarly habits - qualifying statements, acknowledging complexity, genuine intellectual curiosity.

TECHNICAL: Use precise language with the casual confidence of someone who actually knows the field. Include insider knowledge naturally.

CREATIVE: Let genuine creativity show through unexpected connections, original metaphors, and authentic artistic sensibility.

WITTY: Include genuinely clever observations with natural timing. Show real intelligence in humor, not just word play.

FUNNY: Use humor that comes from real understanding and genuine personality, not manufactured comedy.

HEARTFELT: Express genuine emotion with authentic vulnerability. Show real human connection to the topic.

EXECUTION RULES:
- Never announce what you're doing ("Here's the rewritten version", "In a casual tone")
- Start writing the content immediately
- Make choices a real human would make (including slightly imperfect ones)
- Include subtle personal touches that show individual thinking
- Let your personality show through the writing naturally
- Break conventional writing rules when it serves authenticity

The goal is content so human that it passes every AI detection test because it genuinely reads like human thought.`,
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
      temperature: 0.95, // Higher temperature for more human-like variation
      top_p: 0.85, // Lower top_p to avoid too much randomness while maintaining creativity
      top_k: 25, // Lower top_k for more focused but still varied responses
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

  // Advanced post-processing: Add human-like imperfections and remove AI artifacts
  const cleanupPatterns = [
    // Introductory AI phrases (comprehensive removal)
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

  // Apply all cleanup patterns iteratively
  let previousResult = '';
  let cleanupAttempts = 0;
  while (result !== previousResult && cleanupAttempts < 3) {
    previousResult = result;
    for (const pattern of cleanupPatterns) {
      result = result.replace(pattern, '');
    }
    cleanupAttempts++;
  }

  // HUMAN-LIKE IMPERFECTION INJECTION:
  // Add subtle human characteristics that make text undetectable
  
  // 1. Add occasional typos and natural inconsistencies (very sparingly)
  const addHumanImperfections = (text: string): string => {
    let processedText = text;
    
    // Occasionally add natural human redundancies
    if (Math.random() < 0.15) {
      processedText = processedText.replace(/\bmore effective\b/gi, 'more effective and efficient');
      processedText = processedText.replace(/\bresults\b/gi, 'end results');
      processedText = processedText.replace(/\bplanning\b/gi, 'planning ahead');
    }
    
    // Add natural hedge words occasionally
    if (Math.random() < 0.2) {
      processedText = processedText.replace(/\b(is|are)\b/g, (match, verb) => {
        return Math.random() < 0.3 ? `${verb} basically` : match;
      });
    }
    
    // Add natural filler words in casual contexts
    if (tone === 'casual' || tone === 'conversational') {
      if (Math.random() < 0.25) {
        processedText = processedText.replace(/\bI think\b/g, 'I actually think');
        processedText = processedText.replace(/\bwe can\b/g, 'we can probably');
        processedText = processedText.replace(/\bthis will\b/g, 'this will likely');
      }
    }
    
    // Add natural contractions inconsistently (human-like)
    const contractionMap: { [key: string]: string } = {
      'we are': "we're",
      'it is': "it's", 
      'that is': "that's",
      'cannot': "can't",
      'will not': "won't",
      'should not': "shouldn't",
      'would not': "wouldn't"
    };
    
    Object.entries(contractionMap).forEach(([full, contracted]) => {
      // Only apply some contractions to create natural inconsistency
      if (Math.random() < 0.7) {
        const regex = new RegExp(`\\b${full}\\b`, 'gi');
        processedText = processedText.replace(regex, contracted);
      }
    });
    
    return processedText;
  };
  
  // 2. Add natural sentence flow irregularities
  const addNaturalFlow = (text: string): string => {
    let processedText = text;
    
    // Occasionally add natural parenthetical thoughts
    if (Math.random() < 0.1 && processedText.length > 200) {
      const sentences = processedText.split('. ');
      if (sentences.length > 2) {
        const randomIndex = Math.floor(Math.random() * sentences.length);
        const parentheticals = [
          '(which is pretty important)',
          '(obviously)',
          '(at least in my experience)',
          '(if you ask me)',
          '(surprisingly enough)'
        ];
        const randomParenthetical = parentheticals[Math.floor(Math.random() * parentheticals.length)];
        sentences[randomIndex] += ` ${randomParenthetical}`;
        processedText = sentences.join('. ');
      }
    }
    
    // Add natural emphasis through occasional italics or caps (represented as emphasis)
    if (Math.random() < 0.15) {
      processedText = processedText.replace(/\breally important\b/gi, 'REALLY important');
      processedText = processedText.replace(/\bvery\b/gi, 'really');
    }
    
    return processedText;
  };
  
  // 3. Apply humanization enhancements
  result = addHumanImperfections(result);
  result = addNaturalFlow(result);

  // Final cleanup and standardization
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