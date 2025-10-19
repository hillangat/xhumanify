/**
 * EXAMPLE FILE - refineHumanization Function Usage
 * 
 * This file demonstrates how to use the refineHumanization function
 * in a typical workflow. Copy these patterns into your actual application code.
 * 
 * Note: This file is for documentation purposes and may have TypeScript errors
 * when not in a proper React/Next.js environment.
 */

// Example usage of the refineHumanization function
// This shows how to use it after getting AI detection results

import { generateClient } from "aws-amplify/data";
import type { Schema } from "../amplify/data/resource";

const client = generateClient<Schema>();

// Example workflow: Original text → Humanize → Detect AI → Refine
export const exampleRefinementWorkflow = async () => {
  const originalText = `Hey everyone, So, we've been working from home for a while now, and it's been quite a ride. We've dealt with some pretty crazy stuff, but we've managed to keep things going smoothly. That's pretty impressive, if you ask me. Anyway, I've been thinking about this for a while, and I think it's time we get back to the office. Starting October 14, 2025 (yeah, that's a Monday), we're asking everyone to come back to HQ. I know it's a big change, but I think it'll be good for us. Being in the same place again will probably help us come up with ideas faster, work together better, and just... you know, feel more like a team. It's not that we can't do good work remotely, but there's something about being in the same room that tends to spark creativity and make things happen. I really appreciate how hard everyone's worked during this whole work-from-home period. It hasn't been easy, but you've all stepped up. I'm pretty sure that when we're all back together, we'll be able to do even better work. So, let's try to look at this as a positive thing. I think we've got some exciting times ahead of us. Together, I reckon we can achieve some pretty amazing stuff. Thanks for everything, Jonathan P.S. I know this is a big change. If you've got concerns, feel free to reach out to HR or your manager. We're all in this together.`;
  
  try {
    // Step 1: Humanize the original text
    console.log("Step 1: Humanizing original text...");
    const { data: humanizeResult, errors: humanizeErrors } = await client.queries.humanize({
      prompt: originalText,
      tone: "casual"
    });
    
    if (humanizeErrors) {
      console.error("Humanize errors:", humanizeErrors);
      return;
    }
    
    if (!humanizeResult) {
      console.error("No humanize result received");
      return;
    }
    
    const humanizedData = JSON.parse(humanizeResult);
    const humanizedText = humanizedData.content;
    console.log("Humanized text:", humanizedText);
    
    // Step 2: Run AI detection on the humanized text
    console.log("Step 2: Running AI detection on humanized text...");
    const { data: detectResult, errors: detectErrors } = await client.queries.detectAIContent({
      text: humanizedText
    });
    
    if (detectErrors) {
      console.error("Detection errors:", detectErrors);
      return;
    }
    
    if (!detectResult) {
      console.error("No detection result received");
      return;
    }
    
    const detectionData = JSON.parse(detectResult);
    console.log("AI Detection Results:", detectionData.analysis);
    
    // Step 3: If AI score is still high, refine the humanization
    if (detectionData.analysis.overallScore > 30) {
      console.log("Step 3: AI score still high, refining humanization...");
      
      const { data: refineResult, errors: refineErrors } = await client.queries.refineHumanization({
        detectAIResult: detectResult, // Pass the full detection result
        tone: "casual"
      });
      
      if (refineErrors) {
        console.error("Refinement errors:", refineErrors);
        return;
      }
      
      if (!refineResult) {
        console.error("No refinement result received");
        return;
      }
      
      const refinedData = JSON.parse(refineResult);
      const refinedText = refinedData.content;
      
      console.log("Final refined text:", refinedText);
      
      // Optional: Run detection again to verify improvement
      console.log("Step 4: Verifying refined text...");
      const { data: finalDetectResult } = await client.queries.detectAIContent({
        text: refinedText
      });
      
      if (finalDetectResult) {
        const finalDetectionData = JSON.parse(finalDetectResult);
        console.log("Final AI Detection Score:", finalDetectionData.analysis.overallScore);
        
        return {
          originalText,
          humanizedText,
          refinedText,
          originalScore: detectionData.analysis.overallScore,
          finalScore: finalDetectionData.analysis.overallScore,
          flagsFixed: detectionData.analysis.flags.length,
          usage: {
            humanizeUsage: humanizedData.usage,
            refineUsage: refinedData.usage
          }
        };
      }
    } else {
      console.log("AI score is acceptable, no refinement needed");
      return {
        originalText,
        humanizedText,
        refinedText: humanizedText, // Same as humanized
        originalScore: detectionData.analysis.overallScore,
        finalScore: detectionData.analysis.overallScore,
        flagsFixed: 0,
        usage: {
          humanizeUsage: humanizedData.usage,
          refineUsage: null
        }
      };
    }
    
  } catch (error) {
    console.error("Workflow error:", error);
    throw error;
  }
};

// Alternative: Direct refinement if you already have detection results
export const refineDetectedContent = async (detectAIResult: string, tone: string = "neutral") => {
  try {
    const { data: refineResult, errors } = await client.queries.refineHumanization({
      detectAIResult,
      tone
    });
    
    if (errors) {
      console.error("Refinement errors:", errors);
      return null;
    }
    
    if (!refineResult) {
      console.error("No refinement result received");
      return null;
    }
    
    const refinedData = JSON.parse(refineResult);
    return refinedData;
    
  } catch (error) {
    console.error("Refinement error:", error);
    throw error;
  }
};

// Example of the expected detectAIResult format that would be passed to refineHumanization
export const exampleDetectAIResult = {
  "analysis": {
    "overallScore": 65,
    "confidence": "medium",
    "summary": "The text shows some signs of AI-generated content, including generic phrasing, repetitive structures, and a lack of specific details.",
    "flags": [
      {
        "type": "generic_phrasing",
        "severity": "medium",
        "description": "Use of vague, non-specific language",
        "text": "it's been quite a ride",
        "startIndex": 68,
        "endIndex": 90,
        "confidence": 70,
        "suggestion": "Provide specific examples or challenges faced during work-from-home period",
        "originalSearchText": "it's been quite a ride"
      },
      {
        "type": "repetitive_structure",
        "severity": "low",
        "description": "Repeated use of 'I think' structure",
        "text": "I think it's time we get back to the office",
        "startIndex": 279,
        "endIndex": 322,
        "confidence": 60,
        "suggestion": "Vary sentence structures to sound more natural",
        "originalSearchText": "I think it's time we get back to the office"
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
      "Include more specific details and examples to increase authenticity",
      "Vary sentence structures and vocabulary to improve naturalness",
      "Reduce use of generic corporate phrases and buzzwords"
    ]
  },
  "originalText": "Hey everyone, So, we've been working from home...",
  "usage": {
    "inputTokens": 669,
    "outputTokens": 712,
    "totalTokens": 1381
  }
};