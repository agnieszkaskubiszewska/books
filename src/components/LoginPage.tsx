import React, { useState } from 'react';
import { signInWithEmail, signUpWithEmail } from '../supabase';
import '../styles/login.css';

interface LoginPageProps {
  onLogin: (email: string, password: string) => void;
  onBack: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    console.log('isSignUp', isSignUp);
    console.log('email', email);
    console.log('password', password);

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setIsLoading(false);
          return;
        }
        //rejestracja 
const { user } = await signUpWithEmail(email, password);
      if (user) {
        setError('Bravo! You set up new account');
        setIsSignUp(false);
      }
    } else {
      //LOGOWANIE
      const { user } = await signInWithEmail(email, password);
      if (user) {
        onLogin(email, password);
      }
    }
    } catch (err:any) {
      console.log('bład :', err);
setError(err.message || 'There are some issues');
    } finally {
  setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h2>{isSignUp ? 'Rejestracja' : 'Logowanie'}</h2>
    <form onSubmit={ handleSubmit}>
<div className="log-group">
  <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required/>
</div>
<div className="log-group">
<input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required/>
</div> 
<div className="log-group">
<input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required={isSignUp}/>
</div>
{error && <div className="error-messages">{error}</div>}
<button type="submit" disabled={isLoading}>
{isLoading ? 'Loading...' : isSignUp ? 'Create Account' : 'Login'}
</button>
    </form>
<div className="log-form-footer">
<button type="button" onClick={() =>{setIsSignUp(!isSignUp); setConfirmPassword('')}}
  className="toggle-button">

  {isSignUp ? 'Masz juz konto człowieku' : 'Nie masz jeszcze konta'}
  </button>
</div>
      </div>
    </div>
  );
};

export default LoginPage;
