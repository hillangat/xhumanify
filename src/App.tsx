import React, { useState, useEffect } from 'react';
import { get } from '@aws-amplify/api';
import { signIn, signOut, getCurrentUser } from '@aws-amplify/auth';
import { fetchAuthSession } from '@aws-amplify/core';
import './App.css'; // Optional: for styling

const App: React.FC = () => {
  const [iamResponse, setIamResponse] = useState<string | null>(null);
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
      setIamResponse(null);
      setCognitoResponse(null);
    } catch (err) {
      console.error('Sign-out error:', err);
      setError('Failed to sign out.');
    }
  };

  // Function to call the IAM-authenticated /ai endpoint
  const fetchIAMData = async () => {
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
        path: '/ai',
        options: {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        },
      });
      const { body } = await restOperation.response;
      const response = await body.json();
      setIamResponse(JSON.stringify(response, null, 2));
    } catch (err) {
      console.error('Error fetching IAM data:', err);
      setError('Failed to fetch IAM data. Please ensure you are signed in.');
    } finally {
      setLoading(false);
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
            Authorization: `Bearer ${jwtToken}`,
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
            <h2>IAM Authenticated API (/ai)</h2>
            <button onClick={fetchIAMData} disabled={loading}>
              {loading ? 'Loading...' : 'Call IAM API'}
            </button>
            {iamResponse && (
              <pre style={{ textAlign: 'left', background: '#f4f4f4', padding: '10px' }}>
                {iamResponse}
              </pre>
            )}
          </div>

          <div>
            <h2>Cognito Authenticated API (/cognito-auth-path)</h2>
            <button onClick={fetchCognitoData} disabled={loading}>
              {loading ? 'Loading...' : 'Call Cognito API'}
            </button>
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