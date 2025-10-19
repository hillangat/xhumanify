# 🔄 REFINE HUMANIZATION FUNCTION DOCUMENTATION

## Overview

The `refineHumanization` function is a specialized refinement tool that takes AI detection results and intelligently fixes detected flags to make content even more human-like. It's designed to be used as a second-pass refinement after the initial `humanize` function.

## Function Signature

```typescript
refineHumanization: a
  .query()
  .arguments({
    detectAIResult: a.string().required(), // JSON string from detectAIContent function
    tone: a.string()                       // Optional tone (defaults to "neutral")
  })
  .returns(a.string())                     // Same format as humanize function
```

## Purpose

**Primary Goal**: Take content that has been flagged by AI detection systems and refine it to eliminate ALL detected AI patterns while preserving meaning and enhancing human authenticity.

**Key Capabilities**:
- ✅ **Flag-Specific Corrections**: Addresses each detected flag individually
- ✅ **Precise Pattern Elimination**: Removes generic phrasing, repetitive structures, buzzwords
- ✅ **Advanced Humanization**: Adds genuine personality markers and human imperfections
- ✅ **Metric Optimization**: Targets specific improvements in sentence variability, vocabulary diversity, etc.
- ✅ **Tone Preservation**: Maintains the desired tone while enhancing authenticity

## Workflow Integration

### Recommended Usage Pattern:

```typescript
// 1. Humanize original content
const humanizedResult = await client.queries.humanize({
  prompt: originalText,
  tone: "casual"
});

// 2. Run AI detection on humanized content
const detectionResult = await client.queries.detectAIContent({
  text: JSON.parse(humanizedResult).content
});

// 3. If AI score is still high (>30%), refine the humanization
const detectionData = JSON.parse(detectionResult);
if (detectionData.analysis.overallScore > 30) {
  const refinedResult = await client.queries.refineHumanization({
    detectAIResult: detectionResult, // Pass the full detection result
    tone: "casual"
  });
}
```

## Input Format

The `detectAIResult` parameter expects the complete JSON string returned by the `detectAIContent` function:

```json
{
  "analysis": {
    "overallScore": 65,
    "confidence": "medium",
    "summary": "Analysis summary...",
    "flags": [
      {
        "type": "generic_phrasing",
        "severity": "medium",
        "description": "Use of vague, non-specific language",
        "text": "it's been quite a ride",
        "startIndex": 68,
        "endIndex": 90,
        "confidence": 70,
        "suggestion": "Provide specific examples...",
        "originalSearchText": "it's been quite a ride"
      }
    ],
    "metrics": {
      "sentenceVariability": 60,
      "vocabularyDiversity": 55,
      "naturalFlow": 70,
      "personalityPresence": 65,
      "burstiness": 50,
      "perplexity": 65
    },
    "recommendations": [
      "Include more specific details...",
      "Vary sentence structures..."
    ]
  },
  "originalText": "The original text...",
  "usage": { ... }
}
```

## Refinement Strategy

### 1. **Flag-Specific Corrections**
- **Generic Phrasing**: Replaces vague language with specific, concrete alternatives
- **Repetitive Structure**: Eliminates repeated sentence patterns and starters
- **Buzzword Heavy**: Removes corporate speak and replaces with natural language
- **Lack of Personality**: Injects genuine personality markers and specific details

### 2. **Metric Optimization Targets**
- **Sentence Variability**: >80% (from typical 60%)
- **Vocabulary Diversity**: >75% (from typical 55%)
- **Natural Flow**: >85% (from typical 70%)
- **Personality Presence**: >85% (from typical 65%)
- **Overall AI Score**: <20% (from initial scores of 65%+)

### 3. **Advanced Humanization Techniques**
- **Natural Imperfections**: Adds subtle human inconsistencies
- **Cognitive Markers**: Shows genuine thinking patterns and hesitations
- **Emotional Authenticity**: Includes real emotional undertones
- **Contextual Grounding**: Adds specific details and personal touches

## Output Format

Returns the same JSON structure as the `humanize` function:

```json
{
  "content": "The refined, human-like text with all flags addressed",
  "usage": {
    "inputTokens": 450,
    "outputTokens": 320,
    "totalTokens": 770,
    "systemPromptTokens": 800,
    "actualInputTokens": 1250,
    "actualTotalTokens": 1570,
    "estimatedWords": 592
  }
}
```

## Performance Expectations

### **Before Refinement** (Typical AI Detection Results):
- Overall AI Score: 65-85%
- Sentence Variability: 60%
- Vocabulary Diversity: 55%
- Natural Flow: 70%
- Personality Presence: 65%

### **After Refinement** (Expected Results):
- Overall AI Score: <20%
- Sentence Variability: >80%
- Vocabulary Diversity: >75%
- Natural Flow: >85%
- Personality Presence: >85%

## Use Cases

### **Primary Use Case**: Two-Pass Humanization
1. Use `humanize` for initial content transformation
2. Use `detectAIContent` to identify remaining AI patterns
3. Use `refineHumanization` to eliminate detected flags

### **Secondary Use Case**: Targeted Flag Correction
- When you have specific AI detection results from external tools
- For content that needs precise flag-by-flag refinement
- When targeting specific AI detection metrics

### **Quality Assurance Use Case**: Pre-Publication Refinement
- Final polish before publishing content
- Ensuring content passes strict AI detection systems
- Meeting high human authenticity standards

## Technical Implementation

### **Advanced System Prompt**:
- Flag-specific refinement instructions
- Metric optimization targets
- Tone-specific enhancement patterns
- Anti-detection optimization strategies

### **Processing Pipeline**:
1. **Flag Analysis**: Parse and prioritize detected flags
2. **Targeted Corrections**: Address each flag with specific techniques
3. **Metric Enhancement**: Optimize for target metrics
4. **Natural Flow**: Add human imperfections and authenticity markers
5. **Quality Validation**: Ensure output meets human authenticity standards

### **Token Management**:
- Estimated system prompt: ~800 tokens
- Billing based on user content only
- Similar pricing structure to `humanize` function

## Integration Examples

### **React Component Integration**:
```typescript
const handleRefineContent = async (detectionResults: string, tone: string) => {
  setLoading(true);
  try {
    const { data, errors } = await client.queries.refineHumanization({
      detectAIResult: detectionResults,
      tone
    });
    
    if (errors) {
      console.error("Refinement failed:", errors);
      return;
    }
    
    const refinedData = JSON.parse(data);
    setRefinedContent(refinedData.content);
    setUsageInfo(refinedData.usage);
    
  } catch (error) {
    console.error("Error refining content:", error);
  } finally {
    setLoading(false);
  }
};
```

### **Automated Quality Pipeline**:
```typescript
const ensureHighQuality = async (text: string, targetScore: number = 20) => {
  let currentText = text;
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    // Run detection
    const detection = await detectAIContent(currentText);
    const score = JSON.parse(detection).analysis.overallScore;
    
    if (score <= targetScore) {
      return { text: currentText, score, attempts };
    }
    
    // Refine if score is too high
    const refined = await refineHumanization(detection, "professional");
    currentText = JSON.parse(refined).content;
    attempts++;
  }
  
  return { text: currentText, score: null, attempts, status: "max_attempts_reached" };
};
```

## Best Practices

1. **Always use the full detectAIContent result** - don't parse or modify it before passing to refineHumanization
2. **Match the tone** - use the same tone for refinement as used in initial humanization
3. **Monitor usage** - refinement uses additional tokens, factor into cost calculations
4. **Validate results** - optionally run detectAIContent again to verify improvements
5. **Limit iterations** - avoid endless refinement loops; 2-3 passes maximum

## Comparison with Humanize Function

| Aspect | `humanize` | `refineHumanization` |
|--------|------------|---------------------|
| **Purpose** | Transform AI→Human | Fix specific AI flags |
| **Input** | Original text | AI detection results |
| **Approach** | General humanization | Targeted flag correction |
| **Use Case** | First-pass conversion | Second-pass refinement |
| **Precision** | Broad improvements | Surgical flag fixes |
| **Performance** | 65%→35% AI score | 65%→<20% AI score |

The `refineHumanization` function complements the `humanize` function perfectly, providing a sophisticated two-pass system for achieving the highest levels of human authenticity in AI-generated content.