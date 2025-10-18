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

// ========== ADVANCED HUMANIZATION SYSTEM ==========

// Personality Profile Interface
interface PersonalityProfile {
  cognitiveStyle: 'analytical' | 'intuitive' | 'systematic' | 'creative';
  communicationPatterns: {
    parentheticalFrequency: number; // 0-1
    questionFrequency: number; // 0-1
    emphasisStyle: 'italics' | 'caps' | 'repetition' | 'punctuation';
    transitionPreferences: string[];
  };
  linguisticFingerprint: {
    favoriteFillers: string[]; // "basically", "actually", "sort of"
    contractionConsistency: number; // 0-1 (how consistently they use contractions)
    sentenceLengthVariation: number; // standard deviation preference
    vocabularyLevel: 'colloquial' | 'mixed' | 'formal' | 'technical';
  };
  emotionalMarkers: {
    vulnerabilityLevel: number; // 0-1
    enthusiasmStyle: 'understated' | 'moderate' | 'effusive';
    hesitationPatterns: string[]; // "I think", "maybe", "kind of"
  };
}

// Situational Context Interface
interface SituationalContext {
  timeContext: 'morning-fresh' | 'midday-focused' | 'afternoon-tired' | 'evening-reflective';
  pressureLevel: 'relaxed' | 'moderate' | 'urgent';
  audienceRelationship: 'formal' | 'collegial' | 'friendly' | 'intimate';
  writingEnvironment: 'focused' | 'distracted' | 'collaborative';
  mentalState: 'clear' | 'working-through' | 'confident' | 'uncertain';
}

// Generate Dynamic Personality Profile
const generatePersonalityProfile = (tone: string, contentLength: number): PersonalityProfile => {
  // Base profiles with randomization for each tone
  const baseProfiles: { [key: string]: Partial<PersonalityProfile> } = {
    casual: {
      cognitiveStyle: Math.random() > 0.5 ? 'intuitive' : 'creative',
      communicationPatterns: {
        parentheticalFrequency: 0.2 + Math.random() * 0.3,
        questionFrequency: 0.15 + Math.random() * 0.2,
        emphasisStyle: ['repetition', 'punctuation'][Math.floor(Math.random() * 2)] as 'repetition' | 'punctuation',
        transitionPreferences: ['So', 'Anyway', 'But here\'s the thing', 'Actually', 'Plus']
      },
      linguisticFingerprint: {
        favoriteFillers: ['basically', 'actually', 'sort of', 'kind of', 'like'],
        contractionConsistency: 0.3 + Math.random() * 0.4, // More inconsistent
        sentenceLengthVariation: 0.7 + Math.random() * 0.3,
        vocabularyLevel: 'colloquial'
      },
      emotionalMarkers: {
        vulnerabilityLevel: 0.4 + Math.random() * 0.4,
        enthusiasmStyle: Math.random() > 0.5 ? 'moderate' : 'effusive',
        hesitationPatterns: ['I think', 'maybe', 'probably', 'I guess']
      }
    },
    professional: {
      cognitiveStyle: Math.random() > 0.5 ? 'analytical' : 'systematic',
      communicationPatterns: {
        parentheticalFrequency: 0.1 + Math.random() * 0.2,
        questionFrequency: 0.05 + Math.random() * 0.15,
        emphasisStyle: 'italics',
        transitionPreferences: ['Furthermore', 'Additionally', 'However', 'Therefore', 'Subsequently']
      },
      linguisticFingerprint: {
        favoriteFillers: ['certainly', 'indeed', 'particularly', 'specifically'],
        contractionConsistency: 0.7 + Math.random() * 0.2, // More consistent
        sentenceLengthVariation: 0.4 + Math.random() * 0.3,
        vocabularyLevel: 'formal'
      },
      emotionalMarkers: {
        vulnerabilityLevel: 0.2 + Math.random() * 0.3,
        enthusiasmStyle: 'understated',
        hesitationPatterns: ['it appears', 'it seems', 'potentially', 'likely']
      }
    },
    conversational: {
      cognitiveStyle: Math.random() > 0.5 ? 'intuitive' : 'creative',
      communicationPatterns: {
        parentheticalFrequency: 0.25 + Math.random() * 0.25,
        questionFrequency: 0.2 + Math.random() * 0.25,
        emphasisStyle: ['caps', 'repetition'][Math.floor(Math.random() * 2)] as 'caps' | 'repetition',
        transitionPreferences: ['You know what?', 'Here\'s the thing', 'Oh, and', 'By the way']
      },
      linguisticFingerprint: {
        favoriteFillers: ['you know', 'right?', 'obviously', 'clearly', 'honestly'],
        contractionConsistency: 0.2 + Math.random() * 0.3,
        sentenceLengthVariation: 0.8 + Math.random() * 0.2,
        vocabularyLevel: 'mixed'
      },
      emotionalMarkers: {
        vulnerabilityLevel: 0.5 + Math.random() * 0.3,
        enthusiasmStyle: 'moderate',
        hesitationPatterns: ['I mean', 'you know?', 'sort of', 'kinda']
      }
    }
  };

  // Default neutral profile
  const neutralProfile: PersonalityProfile = {
    cognitiveStyle: ['analytical', 'systematic'][Math.floor(Math.random() * 2)] as 'analytical' | 'systematic',
    communicationPatterns: {
      parentheticalFrequency: 0.15 + Math.random() * 0.2,
      questionFrequency: 0.1 + Math.random() * 0.15,
      emphasisStyle: 'italics',
      transitionPreferences: ['However', 'Additionally', 'Furthermore', 'Meanwhile']
    },
    linguisticFingerprint: {
      favoriteFillers: ['generally', 'typically', 'often', 'usually'],
      contractionConsistency: 0.5 + Math.random() * 0.3,
      sentenceLengthVariation: 0.5 + Math.random() * 0.3,
      vocabularyLevel: 'mixed'
    },
    emotionalMarkers: {
      vulnerabilityLevel: 0.3 + Math.random() * 0.3,
      enthusiasmStyle: 'moderate',
      hesitationPatterns: ['perhaps', 'possibly', 'it seems', 'tends to']
    }
  };

  const profile = baseProfiles[tone] || {};
  return { ...neutralProfile, ...profile } as PersonalityProfile;
};

// Generate Situational Context
const generateSituationalContext = (tone: string, textLength: number): SituationalContext => {
  const contexts: { [key: string]: Partial<SituationalContext> } = {
    casual: {
      timeContext: ['morning-fresh', 'evening-reflective'][Math.floor(Math.random() * 2)] as 'morning-fresh' | 'evening-reflective',
      pressureLevel: 'relaxed',
      audienceRelationship: 'friendly',
      writingEnvironment: Math.random() > 0.5 ? 'focused' : 'distracted',
      mentalState: ['clear', 'working-through'][Math.floor(Math.random() * 2)] as 'clear' | 'working-through'
    },
    professional: {
      timeContext: ['midday-focused', 'morning-fresh'][Math.floor(Math.random() * 2)] as 'midday-focused' | 'morning-fresh',
      pressureLevel: textLength > 500 ? 'moderate' : 'relaxed',
      audienceRelationship: 'collegial',
      writingEnvironment: 'focused',
      mentalState: 'confident'
    },
    conversational: {
      timeContext: 'evening-reflective',
      pressureLevel: 'relaxed',
      audienceRelationship: 'friendly',
      writingEnvironment: Math.random() > 0.7 ? 'collaborative' : 'focused',
      mentalState: ['clear', 'working-through'][Math.floor(Math.random() * 2)] as 'clear' | 'working-through'
    }
  };

  const defaultContext: SituationalContext = {
    timeContext: 'midday-focused',
    pressureLevel: 'moderate',
    audienceRelationship: 'collegial',
    writingEnvironment: 'focused',
    mentalState: 'clear'
  };

  const context = contexts[tone] || {};
  return { ...defaultContext, ...context } as SituationalContext;
};

// Build Advanced System Prompt with Layered Context
const buildAdvancedSystemPrompt = (
  tone: string, 
  personality: PersonalityProfile, 
  situation: SituationalContext
): string => {
  return `You are writing as someone with these authentic characteristics:

COGNITIVE STYLE: You think ${personality.cognitiveStyle}ally, which naturally shows in how you structure and present your thoughts.

CURRENT SITUATION: You're writing this during ${situation.timeContext.replace('-', ' ')}, feeling ${situation.pressureLevel} about timing, addressing a ${situation.audienceRelationship} audience. Your mental state is ${situation.mentalState} - ${situation.mentalState === 'working-through' ? 'you\'re figuring some things out as you write and it shows in your natural thinking process' : 'you have clarity on what you want to communicate'}.

NATURAL WRITING PATTERNS:
- You naturally include parenthetical thoughts about ${Math.round(personality.communicationPatterns.parentheticalFrequency * 100)}% of the time
- You engage readers with questions about ${Math.round(personality.communicationPatterns.questionFrequency * 100)}% of the time
- Your favorite transitions: ${personality.communicationPatterns.transitionPreferences.join(', ')}
- When uncertain, you naturally use: ${personality.emotionalMarkers.hesitationPatterns.join(', ')}

EMOTIONAL AUTHENTICITY:
- Vulnerability level: ${personality.emotionalMarkers.vulnerabilityLevel > 0.7 ? 'high (you openly admit uncertainties and show genuine human doubt)' : personality.emotionalMarkers.vulnerabilityLevel > 0.4 ? 'moderate (sometimes uncertain, sometimes confident)' : 'low (generally confident but still human)'}
- Enthusiasm style: ${personality.emotionalMarkers.enthusiasmStyle}

LINGUISTIC FINGERPRINT:
- Contraction usage: ${personality.linguisticFingerprint.contractionConsistency > 0.7 ? 'very consistent' : personality.linguisticFingerprint.contractionConsistency > 0.4 ? 'somewhat inconsistent (natural human variation)' : 'quite inconsistent (very human-like)'}
- Vocabulary: ${personality.linguisticFingerprint.vocabularyLevel}
- Natural filler words: ${personality.linguisticFingerprint.favoriteFillers.join(', ')}

CRITICAL INSTRUCTION: Write naturally as this specific person would, showing their genuine thought process, personality quirks, and emotional state. Make it so authentically human that it's impossible to detect as AI-generated because it genuinely reflects real human psychology and individual writing patterns.

Transform the provided text using a ${tone} voice while naturally embodying all these characteristics. Never announce what you're doing - just write as this person would.`;
};

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

  // Generate personality and situational context
  const personality = generatePersonalityProfile(tone, prompt.length);
  const situation = generateSituationalContext(tone, prompt.length);
  const advancedSystemPrompt = buildAdvancedSystemPrompt(tone, personality, situation);

  // Configure model invocation
  const input = {
    modelId: process.env.MODEL_ID,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      system: `${advancedSystemPrompt}

CORE MISSION: Transform the provided text into something that sounds like it came from a human mind, not an AI. The result must be completely undetectable by any AI detection system.

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
  
  // Calculate system prompt tokens (estimate based on our advanced system prompt)
  // Our enhanced system prompt is approximately 2500-3000 characters = ~625-750 tokens
  const systemPromptTokens = Math.ceil(750); // Conservative estimate for personality-driven prompt
  
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

  // ADVANCED HUMANIZATION POST-PROCESSING:
  // Apply personality-specific patterns and cognitive markers
  
  // 1. Apply personality-specific communication patterns
  const applyPersonalityPatterns = (text: string, personality: PersonalityProfile): string => {
    let processedText = text;
    
    // Apply parenthetical thought injection based on personality
    if (Math.random() < personality.communicationPatterns.parentheticalFrequency) {
      const parentheticals = [
        '(which makes sense)',
        '(at least in my experience)',
        '(if you ask me)',
        '(obviously)',
        '(surprisingly enough)',
        '(I think)',
        '(honestly)',
        '(to be fair)'
      ];
      
      const sentences = processedText.split('. ');
      if (sentences.length > 2) {
        const targetSentence = Math.floor(Math.random() * sentences.length);
        const parenthetical = parentheticals[Math.floor(Math.random() * parentheticals.length)];
        sentences[targetSentence] += ` ${parenthetical}`;
        processedText = sentences.join('. ');
      }
    }
    
    // Apply emphasis style based on personality
    if (personality.communicationPatterns.emphasisStyle === 'repetition') {
      processedText = processedText.replace(/\breally important\b/gi, 'really, really important');
      processedText = processedText.replace(/\bvery\b/gi, 'very, very');
    } else if (personality.communicationPatterns.emphasisStyle === 'caps') {
      processedText = processedText.replace(/\bimportant\b/gi, 'IMPORTANT');
      processedText = processedText.replace(/\bresults\b/gi, 'RESULTS');
    }
    
    // Apply transition preferences
    const transitions = personality.communicationPatterns.transitionPreferences;
    if (transitions.length > 0 && Math.random() < 0.3) {
      const sentences = processedText.split('. ');
      if (sentences.length > 2) {
        const randomTransition = transitions[Math.floor(Math.random() * transitions.length)];
        const insertIndex = Math.floor(sentences.length / 2);
        sentences[insertIndex] = `${randomTransition}, ${sentences[insertIndex].toLowerCase()}`;
        processedText = sentences.join('. ');
      }
    }
    
    return processedText;
  };
  
  // 2. Inject cognitive authenticity markers
  const injectCognitiveMarkers = (text: string, personality: PersonalityProfile, situation: SituationalContext): string => {
    let processedText = text;
    
    // Add metacognitive markers based on mental state
    if (situation.mentalState === 'working-through') {
      const thinkingMarkers = [
        'Let me think about this...',
        'Actually, what I mean is...',
        'Now that I think about it...',
        'Here\'s how I see it...',
        'Wait, let me rephrase that...'
      ];
      
      if (Math.random() < 0.25) {
        const randomMarker = thinkingMarkers[Math.floor(Math.random() * thinkingMarkers.length)];
        const sentences = processedText.split('. ');
        const insertIndex = Math.floor(sentences.length * 0.3) + Math.floor(Math.random() * Math.floor(sentences.length * 0.4));
        if (insertIndex < sentences.length) {
          sentences[insertIndex] = `${randomMarker} ${sentences[insertIndex]}`;
          processedText = sentences.join('. ');
        }
      }
    }
    
    // Add uncertainty markers based on vulnerability level
    if (personality.emotionalMarkers.vulnerabilityLevel > 0.5) {
      personality.emotionalMarkers.hesitationPatterns.forEach(pattern => {
        if (Math.random() < 0.12) {
          const regex = new RegExp(`\\b(I believe|I feel|I think|This is)\\b`, 'gi');
          processedText = processedText.replace(regex, `${pattern} $1`);
        }
      });
    }
    
    return processedText;
  };
  
  // 3. Apply linguistic fingerprinting
  const applyLinguisticFingerprint = (text: string, personality: PersonalityProfile): string => {
    let processedText = text;
    
    // Apply filler words based on personality
    if (Math.random() < 0.3) {
      const fillers = personality.linguisticFingerprint.favoriteFillers;
      const randomFiller = fillers[Math.floor(Math.random() * fillers.length)];
      
      // Insert filler words naturally
      processedText = processedText.replace(/\b(is|are)\b/g, (match, verb) => {
        return Math.random() < 0.2 ? `${verb} ${randomFiller}` : match;
      });
    }
    
    // Apply contraction consistency
    const contractionMap: { [key: string]: string } = {
      'we are': "we're",
      'it is': "it's", 
      'that is': "that's",
      'cannot': "can't",
      'will not': "won't",
      'should not': "shouldn't",
      'would not': "wouldn't",
      'do not': "don't",
      'does not': "doesn't"
    };
    
    Object.entries(contractionMap).forEach(([full, contracted]) => {
      if (Math.random() < personality.linguisticFingerprint.contractionConsistency) {
        const regex = new RegExp(`\\b${full}\\b`, 'gi');
        processedText = processedText.replace(regex, contracted);
      }
    });
    
    return processedText;
  };
  
  // 4. Add subtle human imperfections (legacy function enhanced)
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
  
  // 3. Apply advanced humanization pipeline
  result = applyPersonalityPatterns(result, personality);
  result = injectCognitiveMarkers(result, personality, situation);
  result = applyLinguisticFingerprint(result, personality);
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