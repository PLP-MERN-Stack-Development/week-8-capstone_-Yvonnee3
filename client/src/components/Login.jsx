import React from 'react'
import { useState, useRef} from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'

const Login = () => {
  const formRef = useRef(null);
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useUser();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({ email: '', password: '' }); // Reset errors
    setIsLoading(true);

    const form = formRef.current;
    const email = form.email.value;
    const password = form.password.value;

    const result = await login(email, password);

    if (result.success) {
      navigate('/home');
    } else if (result.errors) {
      setErrors({
        email: result.errors.email || '',
        password: result.errors.password || '',
        general: result.errors.general || ''
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Welcome back! Please enter your credentials.
          </p>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="mt-8 space-y-6">
          {errors.general && (
            <div className="alert-danger">
              {errors.general}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                required
                disabled={isLoading}
                className="form-input"
                placeholder="Enter your email"
              />
              {errors.email && (
                <div className="form-error">{errors.email}</div>
              )}
            </div>

            <div>
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                disabled={isLoading}
                className="form-input"
                placeholder="Enter your password"
              />
              {errors.password && (
                <div className="form-error">{errors.password}</div>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3 text-base"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <div className="spinner mr-2 h-4 w-4"></div>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <a href="/register" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                Create one here
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login

