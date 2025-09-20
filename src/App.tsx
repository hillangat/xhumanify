import type { Schema } from '../amplify/data/resource';
import { useState } from 'react';
import { generateClient } from 'aws-amplify/api';
import './App.scss';
import { FaPlay, FaUser, FaSpinner, FaCheck, FaRegCopy, FaFilePdf, FaTimes, FaGooglePlay } from 'react-icons/fa';
import { MdHourglassEmpty } from 'react-icons/md';
import EmptyContent from './EmptyContent';
import { Button } from 'primereact/button';
// import { FaPlay } from 'react-icons/fa';
// <button type='submit' onClick={handleButtonClick} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
//                 <FaPlay size={32} />
//               </button>

const client = generateClient<Schema>();

export default function App() {
  const [prompt, setPrompt] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [copiedProcessed, setCopiedProcessed] = useState(false);

  const sendPrompt = async () => {
    setIsRunning(true);
    setAnswer(null);
    try {
      const { data, errors } = await client.queries.generateHaiku({
        prompt
      });
      if (!errors) {
        setAnswer(data);
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
  };

  const countWords = (text: string | null | undefined) => {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  return (
    <>
      <section className='header-section'>
        <div className='header-title-left p-text-primary'>XHumanify</div>
        <div className='header-title-right'>
          <span className='user-icon-circle'>
            <FaUser />
          </span>
        </div>
      </section>
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
                <p><strong>{countWords(answer)}</strong> Words</p>
              </div>
              <div className='action-bar-right'>
                <Button
                  label={copiedProcessed ? 'Copied' : 'Copy'}
                  outlined={!copiedProcessed}
                  severity={copiedProcessed ? 'success' : undefined}
                  icon={copiedProcessed ? <FaCheck /> : <FaRegCopy />}
                  onClick={handleCopyProcessedClick}
                  disabled={!answer}
                />
              </div>
            </div>
            <div className='content-container'>
              {answer ? (
                <pre>{answer}</pre>
              ) : (
                <EmptyContent
                  icon={<MdHourglassEmpty size={35} />}
                  title='No Processed Content'
                  subtitle='Processed Content will appear here after a successful processing.'
                />
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}