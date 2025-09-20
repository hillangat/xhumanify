import type { Schema } from '../amplify/data/resource';
import { useState } from 'react';
import { generateClient } from 'aws-amplify/api';
import './App.scss';
import IconTextButton from './IconTextButton';
import { FaPlay, FaUser, FaSpinner, FaCheck, FaRegCopy, FaFilePdf } from 'react-icons/fa';
import { MdHourglassEmpty } from 'react-icons/md';
import EmptyContent from './EmptyContent';
import { Button } from 'primereact/button';
// import { FaPlay } from "react-icons/fa";
// <button type='submit' onClick={handleButtonClick} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
//                 <FaPlay size={32} />
//               </button>

const client = generateClient<Schema>();

export default function App() {
  const [prompt, setPrompt] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const handleCopyClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (answer) {
      try {
        await navigator.clipboard.writeText(answer);
        setCopied(true);
        setTimeout(() => setCopied(false), 5000);
      } catch (err) {
        console.log('Copy failed', err);
      }
    }
  };

  return (
    <>
      <main>
        <section className='header-section'>
          <div className='header-title-left p-text-primary'>XHumanify</div>
          <div className='header-title-right'>
            <span className="user-icon-circle">
              <FaUser />
            </span>
          </div>
        </section>
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
                <p><strong>{prompt?.length ?? 0 }</strong> Words</p>
              </div>
              <div className='action-bar-right'>
                <Button
                  label={copied ? "Copied" : "Copy"}
                  outlined
                  icon={copied ? <FaCheck /> : <FaRegCopy />}
                  onClick={handleCopyClick}
                  disabled={!answer}
                />
                <Button
                  label='Humanify'
                  outlined
                  icon={<FaPlay />}
                  onClick={handleButtonClick}
                  disabled={!prompt}
                />
              </div>
            </div>
            <form>
              <textarea
                placeholder={isFocused ? '' : 'Enter Your Text Here...'}
                name='prompt'
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                rows={6}
                style={{ width: '100%', padding: '8px', fontSize: '16px', resize: 'none' }}
                disabled={isRunning}
              />
            </form>
          </div>
          <div className='processed-content'>
            <div className='action-bar'>
              <div className='action-bar-left'>
                <p><strong>{answer?.length ?? 0 }</strong> Words</p>
              </div>
              <div className='action-bar-right'>
                <Button
                  label={copied ? "Copied" : "Copy"}
                  outlined
                  icon={copied ? <FaCheck /> : <FaRegCopy />}
                  onClick={handleCopyClick}
                  disabled={!answer}
                />
                <Button
                  label='Download'
                  outlined
                  icon={<FaFilePdf />}
                  onClick={handleButtonClick}
                  disabled={!prompt}
                />
              </div>
            </div>
            {answer ? (
              <pre>{answer}</pre>
            ) : (
              <EmptyContent
                icon={<MdHourglassEmpty size={35} />}
                title="No Processed Content"
                subtitle="Processed Content will appear here after a successful processing."
              />
            )}
          </div>
        </section>
      </main>
    </>
  );
}