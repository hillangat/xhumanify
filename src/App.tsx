import type { Schema } from '../amplify/data/resource';
import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import './App.scss';
import { FaUser, FaSpinner, FaCheck, FaRegCopy, FaTimes, FaGooglePlay } from 'react-icons/fa';
import { ProgressSpinner } from 'primereact/progressspinner';
import { MdHourglassEmpty } from 'react-icons/md';
import EmptyContent from './EmptyContent';
import { Button } from 'primereact/button';
import { ButtonGroup } from 'primereact/buttongroup';
import { Menubar } from 'primereact/menubar';
// import { FaPlay } from 'react-icons/fa';
// <button type='submit' onClick={handleButtonClick} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
//                 <FaPlay size={32} />
//               </button>

const client = generateClient<Schema>();

const menuItems = [
  {
    label: 'Home',
    icon: 'pi pi-home'
  },
  {
    label: 'Features',
    icon: 'pi pi-star'
  },
  {
    label: 'About',
    icon: 'pi pi-info-circle'
  },
  {
    label: 'Contact',
    icon: 'pi pi-envelope'
  }
];

export default function App() {
  const [prompt, setPrompt] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [copiedProcessed, setCopiedProcessed] = useState(false);
  const [animatedWordCount, setAnimatedWordCount] = useState(0);

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
      <div className="card">
        <Menubar 
          model={menuItems} 
          start={<div className="p-menubar-start"><strong>XHumanify</strong></div>}
          end={<div className="p-menubar-end"><FaUser style={{ fontSize: '1.2rem' }} /></div>}
        />
      </div>
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
    </>
  );
}