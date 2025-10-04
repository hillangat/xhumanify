import type { Schema } from '../amplify/data/resource';
import { useState, useEffect, useRef } from 'react';
import { generateClient } from 'aws-amplify/data';
import './App.scss';
import { FaSpinner, FaCheck, FaRegCopy, FaTimes, FaGooglePlay } from 'react-icons/fa';
import { ProgressSpinner } from 'primereact/progressspinner';
import { MdHourglassEmpty } from 'react-icons/md';
import EmptyContent from './EmptyContent';
import { Button } from 'primereact/button';
import { ButtonGroup } from 'primereact/buttongroup';
import { Dialog } from 'primereact/dialog';
import { Menu } from 'primereact/menu';
import { Toast } from 'primereact/toast';
import UserFeedback, { UserFeedbackRef } from './UserFeedback';
import { TONE_OPTIONS } from './constants/feedbackConstants';
import { VscFeedback } from "react-icons/vsc";
import { useSubscription } from './contexts/SubscriptionContext';
import UsageDisplay from './components/UsageDisplay';

export default function App() {
  const client = generateClient<Schema>();
  const { trackUsage, checkUsageLimit, canUseService, currentTier } = useSubscription();
  
  const [prompt, setPrompt] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [copiedProcessed, setCopiedProcessed] = useState(false);
  const [animatedWordCount, setAnimatedWordCount] = useState(0);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [selectedTone, setSelectedTone] = useState<string>('neutral');
  const toast = useRef<Toast>(null);
  const feedbackRef = useRef<UserFeedbackRef>(null);
  const toneMenuRef = useRef<Menu>(null);

  // Configure tone menu items
  const toneMenuItems = TONE_OPTIONS.map(tone => ({
    label: tone.name,
    icon: 'pi pi-palette',
    className: selectedTone === tone.key ? 'selected-tone-item' : '',
    command: () => {
      setSelectedTone(tone.key);
    }
  }));

  // Helper to get display name from key
  const getSelectedToneDisplayName = () => {
    const selectedToneOption = TONE_OPTIONS.find(tone => tone.key === selectedTone);
    return selectedToneOption ? selectedToneOption.name : 'Neutral';
  };

  const sendPrompt = async () => {
    // Check usage limit before sending
    if (!checkUsageLimit(prompt)) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Usage Limit Exceeded',
        detail: `This request would exceed your ${currentTier} plan limits. Please upgrade your plan or wait until next month.`,
        life: 5000
      });
      return;
    }

    if (!canUseService) {
      toast.current?.show({
        severity: 'error',
        summary: 'Usage Limit Reached',
        detail: `You have reached your ${currentTier} plan limit. Please upgrade your plan.`,
        life: 5000
      });
      return;
    }

    setIsRunning(true);
    setAnswer(null);
    setAnimatedWordCount(0);
    try {
      const { data, errors } = await client.queries.generateHaiku({
        prompt,
        tone: selectedTone
      }, {
        authMode: 'apiKey'
      });
      if (!errors) {
        setAnswer(data);
        // Track usage after successful response
        if (data) {
          await trackUsage(prompt, data);
        }
      } else {
        console.log(errors);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleButtonClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    await sendPrompt();
  };

  const handleCopyRawClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (prompt) {
      try {
        await navigator.clipboard.writeText(prompt);
        setCopiedRaw(true);
        setTimeout(() => setCopiedRaw(false), 5000);
      } catch (err) {
        console.log('Copy failed', err);
      }
    }
  };

  const handleCopyProcessedClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (answer) {
      try {
        await navigator.clipboard.writeText(answer);
        setCopiedProcessed(true);
        setTimeout(() => setCopiedProcessed(false), 5000);
      } catch (err) {
        console.log('Copy failed', err);
      }
    }
  };

  const handleResetClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setPrompt('');
    setAnswer('');
  };

  const handleSave = async () => {
    if (!prompt || !answer) {
      console.error('Cannot save: missing prompt or answer');
      return;
    }
    setIsSaving(true);
    try {
      await client.models.UserContentHistory.create({
        originalContent: prompt,
        processedContent: answer,
        description: description.trim() || undefined,
        createdAt: new Date().toISOString()
      });
      setShowSaveDialog(false);
      setDescription('');
      toast.current?.show({
        severity: 'success',
        summary: 'Saved!',
        detail: 'Successfully saved content.',
        life: 3000
      });
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Save Failed',
        detail: 'Unable to save content. Please try again.',
        life: 3000
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelSave = () => {
    setShowSaveDialog(false);
    setDescription('');
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackRef.current || !feedbackRef.current.isFormValid()) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Incomplete Form',
        detail: 'Please fill in all required fields.',
        life: 3000
      });
      return;
    }

    if (!prompt || !answer) {
      toast.current?.show({
        severity: 'error',
        summary: 'Feedback Failed',
        detail: 'Missing content to provide feedback on',
        life: 5000
      });
      return;
    }

    setIsSubmittingFeedback(true);
    
    try {
      const feedbackData = feedbackRef.current.getFeedbackData();
      
      // Add timestamp, processing time, and content data
      const completeFeedback = {
        ...feedbackData,
        timestamp: new Date().toISOString(),
        processing_time_ms: Math.floor(Math.random() * 3000) + 1000, // You can track actual processing time
        originalContent: prompt,
        processedContent: answer
      };

      console.log('Feedback Data to Submit:', completeFeedback);
      
      // Save to your backend
      await client.models.UserFeedback.create(completeFeedback);
      
      toast.current?.show({
        severity: 'success',
        summary: 'Feedback Submitted!',
        detail: 'Thank you for your valuable feedback.',
        life: 4000
      });
      
      setShowFeedbackDialog(false);
      
    } catch (error) {
      console.error('Error submitting feedback:', error);
      
      toast.current?.show({
        severity: 'error',
        summary: 'Submission Failed',
        detail: 'Unable to submit feedback. Please try again.',
        life: 5000
      });
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleFeedbackCancel = () => {
    setShowFeedbackDialog(false);
  };

  const countWords = (text: string | null | undefined) => {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  // Animation effect for word count
  useEffect(() => {
    if (answer && !isRunning) {
      const targetCount = countWords(answer);
      const duration = 1000; // 1 second animation
      const steps = 30; // Number of animation steps
      const increment = targetCount / steps;
      const stepDuration = duration / steps;

      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        const currentCount = Math.min(Math.round(increment * currentStep), targetCount);
        setAnimatedWordCount(currentCount);

        if (currentStep >= steps || currentCount >= targetCount) {
          setAnimatedWordCount(targetCount);
          clearInterval(timer);
        }
      }, stepDuration);

      return () => clearInterval(timer);
    } else if (!answer) {
      setAnimatedWordCount(0);
    }
  }, [answer, isRunning]);

  return (
    <>
      <main>
        <section className='title-section'>
          <div className='title-text'>
            <h1>Humanize AI Generated Content</h1>
            <h4>Give AI content a human touch with the most advanced tool.</h4>
          </div>
          <div className='title-introduction'>
            <p>Turn stiff, robotic AI text into writing that feels genuinely human. Our tool smooths out the rough edges of AI-generated content, reshaping it into clear, natural, and authentic language that won’t raise red flags. With us, your words will sound like they came straight from a real person—so you can publish or submit your work with confidence.</p>
          </div>
        </section>
        <section className='content-section'>
          <div className='raw-content'>
            <div className='action-bar'>
              <div className='action-bar-left'>
                <p><strong>{countWords(prompt)}</strong> Words</p>
                {!canUseService && <span style={{ color: '#dc3545', fontSize: '12px' }}>• Usage limit reached</span>}
                {prompt && !checkUsageLimit(prompt) && <span style={{ color: '#ff6b35', fontSize: '12px' }}>• Request too large for your plan</span>}
              </div>
              <div className='action-bar-right'>
                <UsageDisplay compact />
                <ButtonGroup>
                  <Menu 
                    ref={toneMenuRef} 
                    model={toneMenuItems} 
                    popup 
                    className="tone-menu"
                    id="tone_menu"
                    appendTo={document.body}
                    autoZIndex={true}
                    baseZIndex={3000}
                  />
                  <Button 
                    label={getSelectedToneDisplayName()}
                    icon="pi pi-angle-down"
                    iconPos="right"
                    onClick={(e) => toneMenuRef.current?.toggle(e)}
                    outlined
                    size="small"
                    aria-controls="tone_menu"
                    aria-haspopup
                  />
                  <Button
                    label={copiedRaw ? 'Copied' : ''}
                    outlined={!copiedRaw}
                    severity={copiedRaw ? 'success' : undefined}
                    icon={copiedRaw ? <FaCheck /> : <FaRegCopy />}
                    onClick={handleCopyRawClick}
                    disabled={!prompt}
                  />
                  <Button
                    label=''
                    outlined
                    icon={<FaTimes />}
                    onClick={handleResetClick}
                    disabled={!prompt}
                  />
                  <Button
                    label='Humanize'
                    loading={isRunning}
                    loadingIcon={<FaSpinner className='spin' />}
                    icon={<FaGooglePlay />}
                    onClick={handleButtonClick}
                    disabled={!prompt || isRunning || !canUseService || (!!prompt && !checkUsageLimit(prompt))}
                  />
                </ButtonGroup>
              </div>
            </div>
            <form className='textarea-container'>
              <textarea
                placeholder={isFocused ? '' : 'Enter Your Text Here...'}
                name='prompt'
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                style={{ width: '100%', padding: '8px', fontSize: '16px', resize: 'none' }}
                disabled={isRunning}
              />
            </form>
          </div>
          <div className='processed-content'>
            <div className='action-bar'>
              <div className='action-bar-left'>
                <p><strong>{animatedWordCount}</strong> Words</p>
              </div>
              <div className='action-bar-right'>
                <ButtonGroup>
                  <Button
                    label={copiedProcessed ? 'Copied' : ''}
                    outlined={!copiedProcessed}
                    severity={copiedProcessed ? 'success' : undefined}
                    icon={copiedProcessed ? <FaCheck /> : <FaRegCopy />}
                    onClick={handleCopyProcessedClick}
                    disabled={!answer}
                  />
                  <Button
                    label=""
                    icon={<VscFeedback />}
                    onClick={() => setShowFeedbackDialog(true)}
                    disabled={!answer || !prompt}
                    outlined
                    className="feedback-button"
                  />
                  <Button
                    label=''
                    outlined
                    icon='pi pi-save'
                    onClick={() => setShowSaveDialog(true)}
                    disabled={!answer || !prompt}
                  />
                </ButtonGroup>
              </div>
            </div>
            <div className='content-container'>
              {answer ? (
                <pre>{answer}</pre>
              ) : (
                <EmptyContent
                  icon={isRunning ? <ProgressSpinner style={{ width: '45px', height: '45px' }} /> : <MdHourglassEmpty size={35} />}
                  title={isRunning ? 'Processing...' : 'No Processed Content'}
                  subtitle={isRunning ? 'Please wait while we humanize your content.' : 'Processed Content will appear here after a successful processing.'}
                />
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Save Description Dialog */}
      <Dialog
        header="Save Content"
        visible={showSaveDialog}
        onHide={handleCancelSave}
        footer={
          <div className="dialog-footer">
            <Button
              label="Cancel"
              outlined
              onClick={handleCancelSave}
              disabled={isSaving}
            />
            <Button
              label="Save"
              icon={isSaving ? "pi pi-spin pi-spinner" : "pi pi-save"}
              onClick={handleSave}
              disabled={isSaving}
              loading={isSaving}
            />
          </div>
        }
        modal
        className="save-dialog"
        style={{ width: '500px' }}
      >
        <div className="dialog-content">
          <div className="textarea-container">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description..."
              maxLength={250}
              rows={4}
              className="description-textarea"
              disabled={isSaving}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid var(--surface-border)',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical',
                minHeight: '100px'
              }}
            />
            <div className={`character-count ${description.length > 200 ? 'warning' : ''} ${description.length > 240 ? 'error' : ''}`} style={{
              textAlign: 'right',
              marginTop: '8px',
              fontSize: '12px',
              color: 'var(--text-color-secondary)'
            }}>
              {description.length}/250
            </div>
          </div>
        </div>
      </Dialog>

      {/* User Feedback Dialog */}
      <Dialog
        header="Share Your Feedback"
        visible={showFeedbackDialog}
        onHide={() => !isSubmittingFeedback && handleFeedbackCancel()}
        footer={
          <div className="dialog-footer">
            <Button
              label="Cancel"
              outlined
              onClick={handleFeedbackCancel}
              disabled={isSubmittingFeedback}
            />
            <Button
              label={isSubmittingFeedback ? "Submitting..." : "Submit Feedback"}
              onClick={handleFeedbackSubmit}
              disabled={isSubmittingFeedback}
              loading={isSubmittingFeedback}
              icon="pi pi-send"
            />
          </div>
        }
        modal
        className="feedback-dialog"
        style={{ width: '90vw', maxWidth: '700px' }}
        closable={!isSubmittingFeedback}
      >
        <UserFeedback
          ref={feedbackRef}
          originalContent={prompt}
          disabled={isSubmittingFeedback}
        />
      </Dialog>
      
      {/* Toast Notifications */}
      <Toast ref={toast} position="top-right" />
    </>
  );
}