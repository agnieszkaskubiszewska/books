import React, { useState } from 'react';

interface LoginPageProps {
  onLogin: (email: string, password: string) => void;
  onBack: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Symulacja logowania (w przyszłości będzie API call)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (email && password) {
        onLogin(email, password);
      } else {
        setError('Proszę wypełnić wszystkie pola');
      }
    } catch (err) {
      setError('Wystąpił błąd podczas logowania');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Pusty modal - tylko obrys */}
      </div>
    </div>
  );
};

export default LoginPage;
