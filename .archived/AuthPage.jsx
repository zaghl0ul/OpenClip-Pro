import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, User, Eye, EyeOff, CheckCircle, XCircle, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import authService from '../services/authService';

const AuthPage = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    confirm_password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Development bypass function
  const handleBypassAuth = () => {
    const mockUser = {
      id: 'dev-user-123',
      email: 'developer@openclippro.com',
      full_name: 'Development User',
      roles: ['user', 'admin'],
      is_active: true,
      created_at: new Date().toISOString()
    };

    // Store mock data in localStorage for consistency
    localStorage.setItem('access_token', 'dev-bypass-token-' + Date.now());
    localStorage.setItem('user_data', JSON.stringify(mockUser));
    
    toast.success('🚀 Development mode activated!');
    onLogin(mockUser);
  };

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    // Backend requires: min 8 chars, uppercase, lowercase, number, special char
    const minLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return {
      isValid: minLength && hasUpper && hasLower && hasNumber && hasSpecial,
      requirements: {
        minLength,
        hasUpper,
        hasLower,
        hasNumber,
        hasSpecial
      }
    };
  };

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!isLogin) {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        newErrors.password = 'Password does not meet requirements';
      }
    }

    // Registration-specific validation
    if (!isLogin) {
      if (!formData.full_name.trim()) {
        newErrors.full_name = 'Full name is required';
      }

      if (formData.password !== formData.confirm_password) {
        newErrors.confirm_password = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        const result = await authService.login({
          email: formData.email,
          password: formData.password
        });

        if (result.success) {
          toast.success('Login successful!');
          onLogin(result.user);
        } else {
          toast.error(result.error || 'Login failed');
          setErrors({ general: result.error });
        }
      } else {
        const result = await authService.register({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name
        });

        if (result.success) {
          toast.success('Registration successful! Please login.');
          setIsLogin(true);
          setFormData({ 
            email: formData.email, 
            password: '', 
            full_name: '', 
            confirm_password: '' 
          });
          setErrors({});
        } else {
          toast.error(result.error || 'Registration failed');
          setErrors({ general: result.error });
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.error('Connection failed. Please check if the backend is running.');
      setErrors({ general: 'Connection failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: '' }));
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({ email: '', password: '', full_name: '', confirm_password: '' });
    setErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const passwordValidation = !isLogin ? validatePassword(formData.password) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 py-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center"
          >
            <Lock className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            OpenClip Pro
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            AI-powered video clipping platform
          </p>
        </div>

        {/* Quick Access Button */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <button
            onClick={handleBypassAuth}
            className="w-full py-4 px-6 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 flex items-center justify-center gap-3"
          >
            <Zap className="w-5 h-5" />
            🚀 Skip Auth - Jump Right In!
          </button>
          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">
            Development mode - bypass authentication for testing
          </p>
        </motion.div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-500 dark:text-gray-400">
              or login normally
            </span>
          </div>
        </div>

        {/* Form Card */}
        <motion.div 
          layout
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/30 p-8"
        >
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {isLogin ? 'Sign in to your account' : 'Join OpenClip Pro today'}
            </p>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {errors.general && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2"
              >
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-700 dark:text-red-300">{errors.general}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name - Registration only */}
            <AnimatePresence>
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1"
                >
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 dark:bg-gray-700 dark:text-white ${
                        errors.full_name
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      placeholder="Enter your full name"
                    />
                  </div>
                  {errors.full_name && (
                    <p className="text-xs text-red-600 dark:text-red-400">{errors.full_name}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 dark:bg-gray-700 dark:text-white ${
                    errors.email
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-600 dark:text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 dark:bg-gray-700 dark:text-white ${
                    errors.password
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-600 dark:text-red-400">{errors.password}</p>
              )}

              {/* Password Requirements - Registration only */}
              <AnimatePresence>
                {!isLogin && formData.password && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-xs space-y-1"
                  >
                    <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">Password Requirements:</p>
                    {Object.entries({
                      minLength: 'At least 8 characters',
                      hasUpper: 'One uppercase letter',
                      hasLower: 'One lowercase letter',
                      hasNumber: 'One number',
                      hasSpecial: 'One special character (!@#$%^&*)'
                    }).map(([key, label]) => (
                      <div key={key} className="flex items-center gap-2">
                        {passwordValidation?.requirements[key] ? (
                          <CheckCircle className="w-3 h-3 text-green-500" />
                        ) : (
                          <XCircle className="w-3 h-3 text-red-500" />
                        )}
                        <span className={passwordValidation?.requirements[key] ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}>
                          {label}
                        </span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Confirm Password - Registration only */}
            <AnimatePresence>
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1"
                >
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirm_password"
                      value={formData.confirm_password}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 dark:bg-gray-700 dark:text-white ${
                        errors.confirm_password
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirm_password && (
                    <p className="text-xs text-red-600 dark:text-red-400">{errors.confirm_password}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          {/* Toggle Mode */}
          <div className="mt-6 text-center">
            <button
              onClick={toggleMode}
              className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
              🚀 Demo Account:
            </h4>
            <div className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
              <p><strong>Email:</strong> admin@openclippro.com</p>
              <p><strong>Password:</strong> admin123!</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
