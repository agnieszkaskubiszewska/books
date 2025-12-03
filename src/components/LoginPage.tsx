import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { resetPassword, signInWithEmail, signUpWithEmail } from '../supabase';
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
  const [success, setSuccess] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const navigate = useNavigate();

  // Ensure default view is Login (no confirm password)
  React.useEffect(() => {
    setIsSignUp(false);
    setConfirmPassword('');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setIsLoading(false);
          return;
        }
        const emailTrimmed = email.trim();
const { user } = await signUpWithEmail(emailTrimmed, password, { firstName: name, lastName: surname });
if (user) {
setSuccess('Check your email for verification');
  setError('');
  setIsSignUp(false);
  setPassword('');
  setConfirmPassword('');
    }
      } else {
        const emailTrimmed = email.trim();
        const { user } = await signInWithEmail(emailTrimmed, password);
        if (user) {
          onLogin(emailTrimmed, password);
          navigate('/');
        }
      }
    } catch (err:any) {
    console.log('error in login page:', err);
      setError(err.message || 'There are some issues');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMessage('');
    setIsLoading(true);

    try {
      await resetPassword(resetEmail);
  setResetMessage('Sprawdź swoją pocztę email by zresetować hasło');
      setResetEmail('');
    } catch (err: any) {
      setResetMessage(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (showResetPassword) {
    return (
      <div className="login-page">
        <div className="login-container">
          <h2>Resetuj hasło</h2>
          <form onSubmit={handleResetPassword}>
            <div className="log-group">
              <input 
                type="email" 
                placeholder="Wpisz swoją pocztę email" 
                value={resetEmail} 
                onChange={(e) => setResetEmail(e.target.value)} 
                required
              />
            </div>
            {resetMessage && (
              <div className={`reset-message ${resetMessage.includes('Błąd') ? 'error' : 'success'}`}>
                {resetMessage}
              </div>
            )}
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Wysyłanie...' : 'Wyślij link do resetowania hasła'}
            </button>
          </form>
          <div className="log-form-footer">
            <button 
              type="button" 
              onClick={() => {
                setShowResetPassword(false);
                setResetMessage('');
                setResetEmail('');
              }}
              className="toggle-button"
            >
              Powrót do logowania
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <h2>{isSignUp ? 'Rejestracja' : 'Logowanie'}</h2>
        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <div className="log-group">
              <input type="text" placeholder="Imię" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required/>
              <input type="text" placeholder="Nazwisko" value={surname} onChange={(e) => setSurname(e.target.value)} autoComplete="surname" required/>
            </div>
          )}
          <div className="log-group">
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required/>
            <input type="password" placeholder="Hasło" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={isSignUp ? 'new-password' : 'current-password'} required/>
          </div>
          {isSignUp && (
            <div className="log-group">
              <input type="password" placeholder="Potwierdź hasło" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" required/>
            </div>
          )}
          {error && <div className="error-messages">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          <button type="submit" disabled={isLoading}>
        {isLoading ? 'Ładowanie...' : isSignUp ? 'Utwórz konto' : 'Zaloguj się'}
          </button>
        </form>
        <div className="log-form-footer">
          <button 
            type="button" 
            onClick={() => {
              setIsSignUp(!isSignUp); 
              setConfirmPassword('');
              setError('');
              setSuccess('');
            }}
            className="toggle-button"
          >
            {isSignUp ? 'Masz już konto?' : 'Nie masz jeszcze konta?'}
          </button>
          {!isSignUp && (
            <button 
              type="button" 
              onClick={() => {
                setShowResetPassword(true);
                setError('');
              }}
              className="forgot-password-link"
            >
              Zapomniałeś hasła?
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
