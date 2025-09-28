import type { Schema } from '../amplify/data/resource';
import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import './App.scss';
import { FaSpinner, FaCheck, FaRegCopy, FaTimes, FaGooglePlay } from 'react-icons/fa';
import { ProgressSpinner } from 'primereact/progressspinner';
import { MdHourglassEmpty } from 'react-icons/md';
import EmptyContent from './EmptyContent';
import { Button } from 'primereact/button';
import { ButtonGroup } from 'primereact/buttongroup';
import { Dialog } from 'primereact/dialog';
import Header from './Header';

const client = generateClient<Schema>();

export default function App() {
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

  const sendPrompt = async () => {
    setIsRunning(true);
    setAnswer(null);
    setAnimatedWordCount(0);
    try {
      const { data, errors } = await client.queries.generateHaiku({
        prompt
      });
      if (!errors) {
        setAnswer(data);
        
        // Save to history
        if (data) {
          try {
            await client.models.UserContentHistory.create({
              originalContent: prompt,
              processedContent: data,
              createdAt: new Date().toISOString()
            });
          } catch (historyError) {
            console.error('Failed to save to history:', historyError);
          }
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
    } catch (error) {
      console.error('Failed to save to history:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelSave = () => {
    setShowSaveDialog(false);
    setDescription('');
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
      <Header />
      <main>
        <section className='title-section'>
          <div className='title-text'>
            <h1>Humanify AI Generated Content</h1>
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
              </div>
              <div className='action-bar-right'>
                <ButtonGroup>
                  <Button
                    label={copiedRaw ? 'Copied' : 'Copy'}
                    outlined={!copiedRaw}
                    severity={copiedRaw ? 'success' : undefined}
                    icon={copiedRaw ? <FaCheck /> : <FaRegCopy />}
                    onClick={handleCopyRawClick}
                    disabled={!prompt}
                  />
                  <Button
                    label='Reset'
                    outlined
                    icon={<FaTimes />}
                    onClick={handleResetClick}
                    disabled={!prompt}
                  />
                  <Button
                    label='Humanify'
                    loading={isRunning}
                    loadingIcon={<FaSpinner className='spin' />}
                    icon={<FaGooglePlay />}
                    onClick={handleButtonClick}
                    disabled={!prompt || isRunning}
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
                    label={copiedProcessed ? 'Copied' : 'Copy'}
                    outlined={!copiedProcessed}
                    severity={copiedProcessed ? 'success' : undefined}
                    icon={copiedProcessed ? <FaCheck /> : <FaRegCopy />}
                    onClick={handleCopyProcessedClick}
                    disabled={!answer}
                  />
                  <Button
                    label='Save'
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
                  subtitle={isRunning ? 'Please wait while we humanify your content.' : 'Processed Content will appear here after a successful processing.'}
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
    </>
  );
}