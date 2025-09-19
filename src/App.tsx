import type { Schema } from '../amplify/data/resource';
import { useState } from 'react';
import { generateClient } from 'aws-amplify/api';
import './App.scss';
// import { FaPlay } from "react-icons/fa";
// <button type='submit' onClick={handleButtonClick} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
//                 <FaPlay size={32} />
//               </button>

const client = generateClient<Schema>();

export default function App() {
  const [prompt, setPrompt] = useState<string>('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const sendPrompt = async () => {
    const { data, errors } = await client.queries.generateHaiku({
      prompt
    });

    if (!errors) {
      setAnswer(data);
      setPrompt('');
    } else {
      console.log(errors);
    }
  };

  const handleButtonClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    await sendPrompt();
  };

  return (
    <>
      <main>
        <section className='header-section'>
          <div>
            <h1>Header Section</h1>
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
              />
            </form>
          </div>
          <div className='processed-content'>
            <pre>Alright, here's my attempt at humanizing that text: Oof, I feel you on that whole "stiff, robotic AI text" thing. It's like trying to force a robot to write a heartfelt love letter—the result is just awkward and impersonal, you know? But hey, that's where we come in to save the day. Our little team has this special knack for taking that cold, lifeless AI-generated junk and giving it a serious makeover. We smooth out all the rough edges, rework the phrasing, and inject it with some good old-fashioned human personality. By the time we're done, your words will sound like they're straight from the mind of a real, breathing person—not some soulless machine. So if you've got a piece that needs to sound authentic and natural, just send it our way. We'll work our magic and make sure it reads like it was written by a quirky, passionate human (rather than a robot trying to impersonate one). That way, you can publish or submit your work without worrying that it'll raise any eyebrows. Trust me, your readers will be none the wiser.</pre>
          </div>
        </section>
        {answer}
      </main>
    </>
  );
}