import { useState, useImperativeHandle, forwardRef } from 'react';
import { Card } from 'primereact/card';
import { Rating } from 'primereact/rating';
import { RadioButton } from 'primereact/radiobutton';
import { InputTextarea } from 'primereact/inputtextarea';
import { Divider } from 'primereact/divider';
import { TONE_OPTIONS, TONE_MATCH_OPTIONS, RATING_DESCRIPTIONS, FEEDBACK_CONSTANTS } from './constants/feedbackConstants';
import './UserFeedback.scss';

export interface UserFeedbackData {
  humanization_rating: number;
  tone_selected: string;
  tone_match: string;
  feedback_text: string; // Changed from optional to required with empty string default
  ease_of_use_rating: number;
  input_text_length: number;
}

export interface UserFeedbackRef {
  getFeedbackData: () => UserFeedbackData;
  isFormValid: () => boolean;
  submitFeedback: () => Promise<void>;
}

export interface UserFeedbackProps {
  onSubmit?: (feedback: UserFeedbackData) => Promise<void>; // Made onSubmit async to match usage
  originalContent?: string;
  disabled?: boolean;
  onCancel?: () => void; // Added missing onCancel prop
}

const UserFeedback = forwardRef<UserFeedbackRef, UserFeedbackProps>(
  ({ onSubmit, originalContent = '', disabled = false }, ref) => {
    const [feedback, setFeedback] = useState<UserFeedbackData>({
      humanization_rating: 0,
      tone_selected: '',
      tone_match: '',
      feedback_text: '',
      ease_of_use_rating: 0,
      input_text_length: originalContent.length,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const isFormValid = (): boolean => {
      return (
        feedback.humanization_rating > 0 &&
        feedback.tone_selected !== '' &&
        feedback.tone_match !== '' &&
        feedback.ease_of_use_rating > 0
      );
    };

    const handleSubmit = async (): Promise<void> => {
      if (!isFormValid()) return;

      setIsSubmitting(true);
      try {
        const feedbackData = {
          ...feedback,
          input_text_length: originalContent.length,
        };

        if (onSubmit) {
          await onSubmit(feedbackData);
        }
      } catch (error) {
        console.error('Error submitting feedback:', error);
      } finally {
        setIsSubmitting(false);
      }
    };

    useImperativeHandle(ref, () => ({
      getFeedbackData: () => ({
        ...feedback,
        input_text_length: originalContent.length,
      }),
      isFormValid,
      submitFeedback: handleSubmit,
    }));

    const updateFeedback = <K extends keyof UserFeedbackData>(field: K, value: UserFeedbackData[K]) => {
      setFeedback((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

    return (
      <Card className="user-feedback-card" title="We greatly value your feedback. Every response helps us enhance and refine our AI platform.">
        <div className="feedback-form">
          {/* Humanization Rating */}
          <div className="feedback-question">
            <h4>{RATING_DESCRIPTIONS.humanization.question}</h4>
            <Rating
              value={feedback.humanization_rating}
              onChange={(e) => updateFeedback('humanization_rating', e.value ?? 0)} // Added null check
              stars={FEEDBACK_CONSTANTS.starRating}
              cancel={false}
              disabled={disabled || isSubmitting}
              className="feedback-rating"
            />
            <small className="rating-help">{RATING_DESCRIPTIONS.humanization.help}</small>
          </div>

          <Divider />

          {/* Tone Selected */}
          <div className="feedback-question">
            <h4>What tone were you aiming for in your content?</h4>
            <div className="radio-group">
              {TONE_OPTIONS.map((tone) => (
                <div key={tone.key} className="flex align-items-center mb-2">
                  <RadioButton
                    inputId={tone.key}
                    name="tone_selected"
                    value={tone.key}
                    onChange={(e) => updateFeedback('tone_selected', e.value)}
                    checked={feedback.tone_selected === tone.key}
                    disabled={disabled || isSubmitting}
                  />
                  <label htmlFor={tone.key} className="ml-2">{tone.name}</label>
                </div>
              ))}
            </div>
          </div>

          <Divider />

          {/* Tone Match */}
          <div className="feedback-question">
            <h4>How well did the output match your desired tone?</h4>
            <div className="radio-group">
              {TONE_MATCH_OPTIONS.map((match) => (
                <div key={match.key} className="flex align-items-center mb-2">
                  <RadioButton
                    inputId={match.key}
                    name="tone_match"
                    value={match.key}
                    onChange={(e) => updateFeedback('tone_match', e.value)}
                    checked={feedback.tone_match === match.key}
                    disabled={disabled || isSubmitting}
                  />
                  <label htmlFor={match.key} className="ml-2">{match.name}</label>
                </div>
              ))}
            </div>
          </div>

          <Divider />

          {/* Ease of Use Rating */}
          <div className="feedback-question">
            <h4>{RATING_DESCRIPTIONS.easeOfUse.question}</h4>
            <Rating
              value={feedback.ease_of_use_rating}
              onChange={(e) => updateFeedback('ease_of_use_rating', e.value ?? 0)} // Added null check
              stars={FEEDBACK_CONSTANTS.starRating}
              cancel={false}
              disabled={disabled || isSubmitting}
              className="feedback-rating"
            />
            <small className="rating-help">{RATING_DESCRIPTIONS.easeOfUse.help}</small>
          </div>

          <Divider />

          {/* Additional Feedback */}
          <div className="feedback-question">
            <h4>
              Any additional feedback or suggestions? <span className="optional">(Optional)</span>
            </h4>
            <InputTextarea
              value={feedback.feedback_text}
              onChange={(e) => updateFeedback('feedback_text', e.target.value)}
              placeholder="Share your thoughts, suggestions, or any issues you encountered..."
              rows={4}
              maxLength={FEEDBACK_CONSTANTS.maxFeedbackLength}
              disabled={disabled || isSubmitting}
              className="feedback-textarea"
            />
            <div className="character-count">{feedback.feedback_text.length}/{FEEDBACK_CONSTANTS.maxFeedbackLength}</div>
          </div>

        </div>
      </Card>
    );
  }
);

export default UserFeedback;