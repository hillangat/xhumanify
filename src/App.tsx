import type { Schema } from '../amplify/data/resource';
import { useState, useEffect, useRef } from 'react';
import { generateClient } from 'aws-amplify/data';
import './App.scss';
import { ProgressSpinner } from 'primereact/progressspinner';
import EmptyContent from './EmptyContent';
import { Button } from 'primereact/button';
import { ButtonGroup } from 'primereact/buttongroup';
import { Dialog } from 'primereact/dialog';
import { Menu } from 'primereact/menu';
import { Toast } from 'primereact/toast';
import { ConfirmPopup, confirmPopup } from 'primereact/confirmpopup';
import UserFeedback, { UserFeedbackRef } from './UserFeedback';
import { TONE_OPTIONS } from './constants/feedbackConstants';
import { useSubscription } from './contexts/SubscriptionContext';
import UsageDisplay from './components/UsageDisplay';
import UsageBreakdownPopup from './components/UsageBreakdownPopup';
import FeaturePage from './components/FeaturePage';
import { getPlanLimits } from './config/plans';
import { FaGooglePlay } from 'react-icons/fa';

export default function App() {
  const client = generateClient<Schema>();
  const { trackUsage, trackUsageWithTokens, checkUsageLimit, canUseService, currentTier, loading, usageCount, usageLimit } = useSubscription();

  const [prompt, setPrompt] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);
  const [answer, setAnswer] = useState<string | null>(null);
  const [usageInfo, setUsageInfo] = useState<any>(null);
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
  const [showUsageBreakdown, setShowUsageBreakdown] = useState(false);
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
    // Prevent execution if usage data is still loading
    if (loading) {
      toast.current?.show({
        severity: 'info',
        summary: 'Loading',
        detail: 'Please wait while we load your usage data...',
        life: 3000
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
    setUsageInfo(null);
    setAnimatedWordCount(0);
    try {
      const { data, errors } = await client.queries.generateHaiku({
        prompt,
        tone: selectedTone
      }, {
        authMode: 'apiKey'
      });
      if (!errors && data) {
        try {
          // Parse the JSON response containing content and usage data
          const response = JSON.parse(data);
          const content = response.content;
          const usage = response.usage;

          setAnswer(content);
          setUsageInfo(usage);

          // Track usage with actual token data
          if (content && usage) {
            await trackUsageWithTokens(prompt, content, usage);
          }
        } catch (parseError) {
          // Fallback: treat as plain text (backward compatibility)
          console.warn('Response parsing failed, using as plain text:', parseError);
          setAnswer(data);
          // Use old tracking method as fallback
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

    // Check usage limit before sending and show confirmation if exceeded
    if (!checkUsageLimit(prompt)) {
      const inputWords = countWords(prompt);

      const currentPlanLimits = getPlanLimits(currentTier);
      const wouldExceedMonthly = (usageCount + inputWords) > usageLimit;
      const exceedsPerRequest = inputWords > currentPlanLimits.wordsPerRequest;

      let confirmMessage = '';

      if (exceedsPerRequest) {
        const limitText = currentPlanLimits.wordsPerRequest === 999999 ? 'unlimited' : `${currentPlanLimits.wordsPerRequest}-word`;
        confirmMessage = `Your input (${inputWords} words) exceeds the ${limitText} limit per request for ${currentTier} plan. Please split your content into smaller chunks or upgrade to Standard/Pro for unlimited words per request.`;
      } else if (wouldExceedMonthly) {
        const remaining = usageLimit - usageCount;
        confirmMessage = `This request (${inputWords} words) would exceed your monthly limit. You have ${remaining} words remaining. Please upgrade your plan or wait until next month.`;
      } else {
        confirmMessage = `This request would exceed your ${currentTier} plan limits. Please upgrade your plan or wait until next month.`;
      }

      confirmPopup({
        target: event.currentTarget,
        message: confirmMessage,
        icon: 'pi pi-exclamation-triangle',
        defaultFocus: 'accept',
        acceptClassName: 'p-button-danger',
        rejectClassName: 'p-button-outlined',
        acceptLabel: 'Upgrade Plan',
        rejectLabel: 'OK',
        style: { maxWidth: '450px' },
        accept: () => {
          // Navigate to upgrade page
          window.location.href = '/upgrade';
        },
        reject: () => {
          // User acknowledged, do nothing
        }
      });
      return;
    }

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
    setUsageInfo(null);
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

  // Track initial loading completion
  useEffect(() => {
    if (!loading && isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [loading, isInitialLoad]);

  return (
    <FeaturePage
      title="Humanize AI Content"
      subtitle="Transform AI Text into Authentic Human Writing"
      description="Give AI content a human touch with the most advanced tool. Turn stiff, robotic AI text into writing that feels genuinely human."
      icon="pi pi-sparkles"
      badge={currentTier ? {
        text: `${currentTier.charAt(0).toUpperCase() + currentTier.slice(1)} Plan`,
        severity: currentTier === 'free' ? 'info' : currentTier === 'lite' ? 'success' : currentTier === 'standard' ? 'warning' : 'danger'
      } : undefined}
      stats={[
        {
          label: "Current Plan",
          value: currentTier || "Loading",
          icon: "pi pi-star",
          color: "success"
        },
        {
          label: "Monthly Limit",
          value: usageLimit === 999999 ? "Unlimited" : usageLimit.toString(),
          icon: "pi pi-calendar",
          color: "primary"
        },
        {
          label: "Words Used",
          value: usageCount.toString(),
          icon: "pi pi-chart-bar",
          color: "info"
        },
        {
          label: "Available",
          value: usageLimit === 999999 ? "Unlimited" : Math.max(0, usageLimit - usageCount).toString(),
          icon: "pi pi-check-circle",
          color: usageLimit - usageCount > 1000 ? "success" : "warning"
        }
      ]}
      actions={[
        {
          label: "View History",
          icon: "pi pi-history",
          onClick: () => window.location.href = '/history',
          outlined: true
        },
        ...(currentTier !== 'pro' ? [{
          label: "Upgrade Plan",
          icon: "pi pi-star",
          onClick: () => window.location.href = '/upgrade',
          variant: "primary" as const
        }] : [])
      ]}
      className="app-main-page"
      loading={isInitialLoad && loading}
    >
      <Toast ref={toast} position="top-right" />
      <ConfirmPopup />

      <main className="app-content">
        {/* Main Action Bar */}
        <div className="main-action-bar">
          <div className="main-action-bar-content">
            <div className="action-group-left">
              <div className="tone-selector-wrapper">
                <i className="pi pi-palette tone-icon"></i>
                <span className="tone-label">Tone:</span>
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
                  className="tone-selection-button"
                  size="small"
                  aria-controls="tone_menu"
                  aria-haspopup
                />
              </div>
            </div>
            
            <div className="action-group-right">
              <UsageDisplay compact currentPrompt={prompt} />
            </div>
          </div>
        </div>

        <section className='content-section'>
          <div className='raw-content'>
            <div className='action-bar'>
              <div className='action-bar-left'>
                <p><strong>{countWords(prompt)}</strong> Words</p>
              </div>
              <div className='action-bar-right'>
                <ButtonGroup>
                  <Button
                    label={copiedRaw ? 'Copied' : ''}
                    outlined={!copiedRaw}
                    severity={copiedRaw ? 'success' : undefined}
                    icon={copiedRaw ? "pi pi-check" : "pi pi-copy"}
                    onClick={handleCopyRawClick}
                    disabled={!prompt}
                  />
                  <Button
                    label=''
                    outlined
                    icon="pi pi-times"
                    onClick={handleResetClick}
                    disabled={!prompt}
                  />
                  <Button
                    label='Humanize'
                    loading={isRunning}
                    loadingIcon="pi pi-spin pi-spinner"
                    icon={<FaGooglePlay />}
                    onClick={handleButtonClick}
                    disabled={loading || !prompt || isRunning || !canUseService}
                    severity={!canUseService ? 'danger' : undefined}
                    style={!canUseService || (!!prompt && !checkUsageLimit(prompt)) ? {
                      backgroundColor: '#f44336',
                      borderColor: '#f44336',
                      color: 'white'
                    } : undefined}
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
                    icon={copiedProcessed ? "pi pi-check" : "pi pi-copy"}
                    onClick={handleCopyProcessedClick}
                    disabled={!answer}
                  />
                  <Button
                    label=""
                    icon="pi pi-comment"
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
                <>
                  <pre>{answer}</pre>
                  {usageInfo && (
                    <div className="usage-summary" style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-color-secondary)',
                      marginTop: '1rem',
                      padding: '0.75rem',
                      background: 'var(--surface-100)',
                      borderLeft: '3px solid var(--primary-color)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <span style={{ fontWeight: '600' }}>💰 <strong>Usage Charged:</strong> {usageInfo.estimatedWords} words</span>
                        <div style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: '0.25rem' }}>
                          ({Math.ceil((usageInfo.inputTokens + usageInfo.outputTokens) / 1.3)} word equivalent)
                        </div>
                      </div>
                      <Button
                        label="Details"
                        icon="pi pi-info-circle"
                        onClick={() => setShowUsageBreakdown(true)}
                        outlined
                        size="small"
                        style={{ fontSize: '0.75rem' }}
                      />
                    </div>
                  )}
                </>
              ) : (
                <EmptyContent
                  icon={isRunning ? <ProgressSpinner style={{ width: '45px', height: '45px' }} /> : <i className="pi pi-hourglass" style={{ fontSize: '2.5rem', color: 'var(--text-color-secondary)' }}></i>}
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

      {/* Usage Breakdown Popup */}
      {usageInfo && (
        <UsageBreakdownPopup
          visible={showUsageBreakdown}
          onHide={() => setShowUsageBreakdown(false)}
          usageInfo={usageInfo}
          inputWords={countWords(prompt)}
          outputWords={countWords(answer)}
        />
      )}
    </FeaturePage>
  );
}