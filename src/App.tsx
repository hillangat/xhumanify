import React, { useState, useEffect } from 'react';
import { get, post } from '@aws-amplify/api';
import { signIn, signOut, getCurrentUser } from '@aws-amplify/auth';
import { fetchAuthSession } from '@aws-amplify/core';
import './App.css'; // Optional: for styling

const App: React.FC = () => {
  // Remove unused setIamResponse
  const [postText, setPostText] = useState<string>('');
  const [cognitoResponse, setCognitoResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkUser = async () => {
      try {
        await getCurrentUser();
        setIsAuthenticated(true);
      } catch {
        console.log('User not authenticated');
        setIsAuthenticated(false);
      }
    };
    checkUser();
  }, []);

  // Handle sign-in
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await signIn({ username, password });
      setIsAuthenticated(true);
      setUsername('');
      setPassword('');
    } catch (err) {
      console.error('Sign-in error:', err);
      setError('Failed to sign in. Please check your credentials.');
    }
  };

  // Handle sign-out
  const handleSignOut = async () => {
    setError(null);
    try {
      await signOut();
      setIsAuthenticated(false);
      setCognitoResponse(null);
    } catch (err) {
      console.error('Sign-out error:', err);
      setError('Failed to sign out.');
    }
  };

  // Function to call the Cognito-authenticated /cognito-auth-path endpoint
  const fetchCognitoData = async () => {
    setLoading(true);
    setError(null);
    try {
      const session = await fetchAuthSession();
      const jwtToken = session.tokens?.idToken?.toString();
      if (!jwtToken) {
        throw new Error('No ID token found in session');
      }
      const restOperation = get({
        apiName: 'myRestApi',
        path: '/cognito-auth-path',
        options: {
          headers: {
            Authorization: jwtToken,
          },
        },
      });
      const { body } = await restOperation.response;
      const response = await body.json();
      setCognitoResponse(JSON.stringify(response, null, 2));
    } catch (err) {
      console.error('Error fetching Cognito data:', err);
      setError('Failed to fetch Cognito data. Please ensure you are signed in.');
    } finally {
      setLoading(false);
    }
  };

  const postCognitoData = async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      const session = await fetchAuthSession();
      const jwtToken = session.tokens?.idToken?.toString();
      if (!jwtToken) {
        throw new Error('No ID token found in session');
      }
      const restOperation = post({
        apiName: 'myRestApi',
        path: '/cognito-auth-path',
        options: {
          body: data,
          headers: {
            Authorization: jwtToken,
          },
        },
      });
      const { body } = await restOperation.response;
      const response = await body.json();
      setCognitoResponse(JSON.stringify(response, null, 2));
      console.log('POST call succeeded');
      console.log(response);
    } catch (e: any) {
      console.log('POST call failed: ', e?.response?.body ? JSON.parse(e.response.body) : e);
      setError('Failed to POST Cognito data. Please ensure you are signed in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <h1>Amplify Gen 2 API Demo</h1>

      {!isAuthenticated ? (
        <div>
          <h2>Sign In</h2>
          <form onSubmit={handleSignIn}>
            <div>
              <label>
                Username:
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </label>
            </div>
            <div>
              <label>
                Password:
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>
      ) : (
        <div>
          <button onClick={handleSignOut} disabled={loading}>
            Sign Out
          </button>
          <div>
            <h2>Cognito Authenticated API (/cognito-auth-path)</h2>
            <button onClick={fetchCognitoData} disabled={loading}>
              {loading ? 'Loading...' : 'Call Cognito API'}
            </button>
            <div style={{ margin: '20px 0' }}>
              <h3>Post to Cognito Endpoint</h3>
              <textarea
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="Enter text to post..."
                rows={4}
                style={{ width: '100%', padding: '10px', fontSize: '16px' }}
              />
              <button
                onClick={() => postCognitoData({ text: postText })}
                disabled={loading || !postText.trim()}
                style={{ marginTop: '10px' }}
              >
                {loading ? 'Posting...' : 'Post to Cognito API'}
              </button>
            </div>
            {cognitoResponse && (
              <pre style={{ textAlign: 'left', background: '#f4f4f4', padding: '10px' }}>
                {cognitoResponse}
              </pre>
            )}
          </div>
        </div>
      )}

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default App;