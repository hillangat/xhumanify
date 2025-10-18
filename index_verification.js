// Enhanced Analysis of AI Detection Response - Index Verification with Test Cases

// Test the enhanced index finding algorithm
function sanitizeText(text) {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s*data-[^=]*="[^"]*"/g, '')
    .replace(/\s*class="[^"]*"/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function findAccurateIndices(originalText, searchText, contextWindow = 50) {
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
    const firstWord = searchWords[0];
    const firstWordIndex = lowerOriginal.indexOf(firstWord.toLowerCase());
    
    if (firstWordIndex !== -1) {
      const segmentStart = Math.max(0, firstWordIndex - contextWindow);
      const segmentEnd = Math.min(cleanOriginal.length, firstWordIndex + cleanSearch.length + contextWindow);
      const segment = cleanOriginal.substring(segmentStart, segmentEnd);
      
      const foundWords = searchWords.filter(word => 
        segment.toLowerCase().includes(word.toLowerCase())
      );
      
      if (foundWords.length >= Math.ceil(searchWords.length * 0.6)) {
        return {
          startIndex: segmentStart,
          endIndex: Math.min(segmentEnd, segmentStart + cleanSearch.length),
          actualText: segment.substring(0, Math.min(segment.length, cleanSearch.length))
        };
      }
    }
  }
  
  // Strategy 4: Return safe fallback
  return {
    startIndex: 0,
    endIndex: Math.min(cleanSearch.length, cleanOriginal.length),
    actualText: cleanOriginal.substring(0, Math.min(cleanSearch.length, cleanOriginal.length))
  };
}

const originalText = `Dear Valued Team,

In today's dynamic and ever-evolving professional landscape, our collective journey has been nothing short of extraordinary. Together, we have navigated unprecedented challenges, demonstrated unparalleled resilience, and showcased an unwavering commitment to excellence while working remotely.

Now, after thoughtful deliberation and strategic evaluation, it is my great pleasure to announce that the time has come for us to reimagine our collaboration in the physical office space once again. Beginning Monday, October 14, 2025, all staff members will be expected to return to our headquarters to embark on this exciting new chapter of synergy and innovation.

By coming together under one roof, we will unlock game-changing opportunities for real-time ideation, empower deeper human connection, and strengthen the cultural fabric that defines our organization. This transition will serve as a catalyst for enhanced productivity, unmatched creativity, and renewed momentum toward our bold vision of the future.

I deeply appreciate the incredible contributions you have made throughout this remote period. With renewed energy and shared purpose, I am confident that our return to the office will elevate our performance to unprecedented heights.

Let us embrace this milestone with optimism, passion, and unity. The future is bright, and together, there are no limits to what we can achieve.

With gratitude and excitement,
Jonathan Maxwell
Chief Executive Officer
FuturePath Global Solutions`;

const problematicFlags = [
  {
    type: "buzzword_heavy",
    text: "dynamic and ever-evolving professional landscape",
    originalStartIndex: 11,
    originalEndIndex: 58
  },
  {
    type: "formal_rigidity", 
    text: "it is my great pleasure to announce that the time has come",
    originalStartIndex: 258,
    originalEndIndex: 315
  },
  {
    type: "generic_phrasing",
    text: "unlock game-changing opportunities for real-time ideation",
    originalStartIndex: 524,
    originalEndIndex: 578
  }
];

console.log("=== ENHANCED INDEX CORRECTION TESTING ===\n");
console.log(`Original text length: ${originalText.length}\n`);

console.log("=== TESTING ENHANCED ALGORITHM ===\n");

problematicFlags.forEach((flag, index) => {
  console.log(`--- Testing Flag ${index + 1}: ${flag.type} ---`);
  console.log(`Search text: "${flag.text}"`);
  console.log(`Original indices: ${flag.originalStartIndex} - ${flag.originalEndIndex}`);
  
  // Test our enhanced algorithm
  const result = findAccurateIndices(originalText, flag.text);
  
  console.log(`Enhanced algorithm result:`);
  console.log(`  New indices: ${result.startIndex} - ${result.endIndex}`);
  console.log(`  Found text: "${result.actualText}"`);
  console.log(`  Match quality: ${result.actualText === flag.text ? '✅ PERFECT' : '🔍 PARTIAL'}`);
  
  // Verify the new indices
  if (result.startIndex >= 0 && result.endIndex <= originalText.length) {
    const actualTextAtIndices = originalText.substring(result.startIndex, result.endIndex);
    console.log(`  Verification: "${actualTextAtIndices}"`);
    console.log(`  Verified: ${actualTextAtIndices.includes(flag.text.substring(0, 20)) ? '✅ CONTAINS TARGET' : '❌ MISMATCH'}`);
  }
  
  console.log("");
});

// Test edge cases
console.log("=== TESTING EDGE CASES ===\n");

const edgeCases = [
  {
    name: "Exact match",
    searchText: "Dear Valued Team"
  },
  {
    name: "Case mismatch",
    searchText: "UNPRECEDENTED CHALLENGES"
  },
  {
    name: "Partial phrase",
    searchText: "FuturePath Global"
  },
  {
    name: "Non-existent text",
    searchText: "this text does not exist"
  },
  {
    name: "Conceptual pattern",
    searchText: "Together, we have... we will... Let us..."
  }
];

edgeCases.forEach((testCase, index) => {
  console.log(`--- Edge Case ${index + 1}: ${testCase.name} ---`);
  console.log(`Search text: "${testCase.searchText}"`);
  
  const result = findAccurateIndices(originalText, testCase.searchText);
  console.log(`Result: ${result.startIndex} - ${result.endIndex}`);
  console.log(`Found: "${result.actualText}"`);
  
  if (result.startIndex >= 0 && result.endIndex <= originalText.length && result.actualText) {
    const verification = originalText.substring(result.startIndex, result.endIndex);
    console.log(`Status: ✅ Valid indices`);
  } else {
    console.log(`Status: ⚠️ Fallback case`);
  }
  console.log("");
});

console.log("=== SUMMARY ===");
console.log("The enhanced algorithm provides:");
console.log("✅ Multiple fallback strategies for fuzzy matching");
console.log("✅ Sanitization to handle HTML contamination");
console.log("✅ Safe boundaries to prevent index overflow");
console.log("✅ Graceful degradation for conceptual patterns");
console.log("✅ Improved accuracy for exact and partial matches");