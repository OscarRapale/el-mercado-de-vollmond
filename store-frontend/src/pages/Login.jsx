import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Login = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [csrfReady, setCsrfReady] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/products');
    }
  }, [isAuthenticated, navigate]);

  // Initialize CSRF token when component mounts
  useEffect(() => {
    const initCSRF = async () => {
      try {
        // This request will set the CSRF cookie
        await axios.get('http://127.0.0.1:8000/api/csrf/', {
          withCredentials: true,
        });
        setCsrfReady(true);
      } catch (error) {
        console.error('Failed to initialize CSRF:', error);
        setError('Failed to initialize secure connection. Please refresh the page.');
      }
    };

    initCSRF();
  }, []);

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!credentials.username.trim()) {
      setError('Username is required');
      return;
    }
    if (!credentials.password) {
      setError('Password is required');
      return;
    }

    setError('');
    setLoading(true);

    const result = await login(credentials);

    if (result.success) {
      navigate('/products');
    } else {
      setError(result.error || 'Login failed. Please check your credentials.');
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h2>Welcome Back</h2>
          <p>Sign in to your account</p>
        </div>
        
        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              placeholder="Enter your username"
              autoComplete="username"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !csrfReady}
            className="login-btn"
          >
            {loading ? 'Signing in...' : !csrfReady ? 'Initializing...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Don't have an account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: linear-gradient(135deg, #1a1a1a 0%, #0f2626 100%);
        }

        .login-container {
          width: 100%;
          max-width: 420px;
          background: #faf9f7;
          border-radius: 12px;
          padding: 2.5rem;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
        }

        .login-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .login-header h2 {
          font-size: 1.75rem;
          color: #1a1a1a;
          margin-bottom: 0.5rem;
        }

        .login-header p {
          color: #6b7280;
          font-size: 0.95rem;
        }

        .login-error {
          padding: 0.875rem 1rem;
          margin-bottom: 1.5rem;
          background: #fef2f2;
          color: #dc2626;
          border-radius: 8px;
          font-size: 0.9rem;
          border-left: 4px solid #dc2626;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-size: 0.9rem;
          font-weight: 500;
          color: #1a1a1a;
        }

        .form-group input {
          padding: 0.875rem 1rem;
          border: 1px solid #e8e6e3;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s, box-shadow 0.2s;
          background: #fff;
        }

        .form-group input:focus {
          outline: none;
          border-color: #c9a96e;
          box-shadow: 0 0 0 3px rgba(201, 169, 110, 0.15);
        }

        .form-group input:disabled {
          background: #f5f4f2;
          cursor: not-allowed;
        }

        .form-group input::placeholder {
          color: #9ca3af;
        }

        .login-btn {
          margin-top: 0.5rem;
          padding: 1rem;
          background: #1a1a1a;
          color: #faf9f7;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, transform 0.2s;
        }

        .login-btn:hover:not(:disabled) {
          background: #333;
          transform: translateY(-1px);
        }

        .login-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
          transform: none;
        }

        .login-footer {
          margin-top: 1.5rem;
          text-align: center;
          padding-top: 1.5rem;
          border-top: 1px solid #e8e6e3;
        }

        .login-footer p {
          color: #6b7280;
          font-size: 0.9rem;
        }

        .login-footer a {
          color: #8b2635;
          font-weight: 500;
          text-decoration: none;
        }

        .login-footer a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default Login;
