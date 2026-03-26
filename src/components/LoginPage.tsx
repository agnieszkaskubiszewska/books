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
          setError('Hasła nie są takie same');
          setIsLoading(false);
          return;
        }
        const emailTrimmed = email.trim();
        const { user } = await signUpWithEmail(emailTrimmed, password, { firstName: name, lastName: surname });
        if (user) {
          setSuccess('Sprawdź swoją pocztę i potwierdź rejestrację');
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
    } catch (err: any) {
      console.log('error in login page:', err);
      setError(err.message || 'Wystąpił błąd, spróbuj ponownie');
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
      setResetMessage(`Błąd: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (showResetPassword) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="login-header">
            <h2>Resetuj hasło</h2>
            <p>Wyślemy Ci link do zresetowania hasła</p>
          </div>

          <form className="login-form" onSubmit={handleResetPassword}>
            <div className="log-group">
              <label htmlFor="reset-email">Email</label>
              <input
                id="reset-email"
                type="email"
                placeholder="twoj@email.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
              />
            </div>

            {resetMessage && (
              <div className={`reset-message ${resetMessage.startsWith('Błąd') ? 'error' : 'success'}`}>
                {resetMessage}
              </div>
            )}

            <button type="submit" className="login-btn" disabled={isLoading}>
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
        <div className="login-header">
          <h2>{isSignUp ? 'Utwórz konto' : 'Zaloguj się'}</h2>
          <p>{isSignUp ? 'Dołącz do społeczności book\'ake' : 'Witaj z powrotem'}</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {isSignUp && (
            <div className="login-name-row">
              <div className="log-group">
                <label htmlFor="first-name">Imię</label>
                <input
                  id="first-name"
                  type="text"
                  placeholder="Jan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="given-name"
                  required
                />
              </div>
              <div className="log-group">
                <label htmlFor="last-name">Nazwisko</label>
                <input
                  id="last-name"
                  type="text"
                  placeholder="Kowalski"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  autoComplete="family-name"
                  required
                />
              </div>
            </div>
          )}

          <div className="log-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="twoj@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="log-group">
            <label htmlFor="password">Hasło</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              required
            />
          </div>

          {isSignUp && (
            <div className="log-group">
              <label htmlFor="confirm-password">Potwierdź hasło</label>
              <input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
          )}

          {error && <div className="error-message">{error}</div>}
          {success && <div className="reset-message success">{success}</div>}

          {!isSignUp && (
            <div className="login-forgot">
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
            </div>
          )}

          <button type="submit" className="login-btn" disabled={isLoading}>
            {isLoading ? 'Ładowanie...' : isSignUp ? 'Utwórz konto' : 'Zaloguj się'}
          </button>
        </form>

        <div className="login-footer">
          <p>
            {isSignUp ? 'Masz już konto? ' : 'Nie masz jeszcze konta? '}
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
              {isSignUp ? 'Zaloguj się' : 'Zarejestruj się'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
