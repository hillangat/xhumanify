// Tone options for feedback and content processing
export const TONE_OPTIONS = [
  { key: 'professional', name: 'Professional' },
  { key: 'casual', name: 'Casual' },
  { key: 'friendly', name: 'Friendly' },
  { key: 'formal', name: 'Formal' },
  { key: 'creative', name: 'Creative' },
  { key: 'technical', name: 'Technical' },
  { key: 'conversational', name: 'Conversational' },
  { key: 'academic', name: 'Academic' },
];

// Tone match quality options for feedback
export const TONE_MATCH_OPTIONS = [
  { key: 'perfect_match', name: 'Perfect Match' },
  { key: 'very_close', name: 'Very Close' },
  { key: 'somewhat_close', name: 'Somewhat Close' },
  { key: 'not_very_close', name: 'Not Very Close' },
  { key: 'not_at_all', name: 'Not At All' },
];

// Rating scale descriptions
export const RATING_DESCRIPTIONS = {
  humanization: {
    help: '1 = Poor, 5 = Excellent',
    question: 'How do you rate our humanification of your content?'
  },
  easeOfUse: {
    help: '1 = Very Difficult, 5 = Very Easy',
    question: 'How would you rate the ease of use of our platform?'
  }
};

// Feedback form constants
export const FEEDBACK_CONSTANTS = {
  maxFeedbackLength: 500,
  maxDescriptionLength: 250,
  starRating: 5
};

// Type definitions for tone options
export interface ToneOption {
  key: string;
  name: string;
}

export interface ToneMatchOption {
  key: string;
  name: string;
}

// Helper function to get tone option by key
export const getToneOptionByKey = (key: string): ToneOption | undefined => {
  return TONE_OPTIONS.find(option => option.key === key);
};

// Helper function to get tone match option by key
export const getToneMatchOptionByKey = (key: string): ToneMatchOption | undefined => {
  return TONE_MATCH_OPTIONS.find(option => option.key === key);
};