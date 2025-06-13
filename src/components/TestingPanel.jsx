import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Play, RefreshCw } from 'lucide-react';
import authService from '../services/authService';
import apiClient from '../utils/apiClient';

const TestingPanel = ({ isOpen, onClose }) => {
  const [tests, setTests] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState(null);

  const testSuite = [
    {
      id: 'health',
      name: 'Backend Health Check',
      description: 'Test if backend is responding',
      test: async () => {
        const response = await fetch('http://localhost:8000/health');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      }
    },
    {
      id: 'auth-endpoints',
      name: 'Authentication Endpoints',
      description: 'Test auth endpoint availability',
      test: async () => {
        const endpoints = ['/api/auth/login', '/api/auth/register', '/api/auth/me'];
        const results = {};
        
        for (const endpoint of endpoints) {
          try {
            const response = await fetch(`http://localhost:8000${endpoint}`, {
              method: 'OPTIONS'
            });
            results[endpoint] = response.status < 500;
          } catch (error) {
            results[endpoint] = false;
          }
        }
        
        return results;
      }
    },
    {
      id: 'demo-login',
      name: 'Demo Account Login',
      description: 'Test login with demo credentials',
      test: async () => {
        const result = await authService.login({
          email: 'admin@openclippro.com',
          password: 'admin123!'
        });
        
        if (!result.success) {
          throw new Error(result.error || 'Login failed');
        }
        
        return result;
      }
    },
    {
      id: 'protected-endpoint',
      name: 'Protected Endpoint Access',
      description: 'Test accessing protected routes',
      test: async () => {
        if (!authService.isAuthenticated()) {
          throw new Error('Not authenticated');
        }
        
        const response = await apiClient.client.get('/api/auth/me');
        return response.data;
      }
    },
    {
      id: 'token-refresh',
      name: 'Token Refresh',
      description: 'Test token refresh mechanism',
      test: async () => {
        if (!authService.isAuthenticated()) {
          throw new Error('Not authenticated');
        }
        
        try {
          const newToken = await authService.refreshAccessToken();
          return { tokenRefreshed: !!newToken };
        } catch (error) {
          throw new Error('Token refresh failed: ' + error.message);
        }
      }
    },
    {
      id: 'registration',
      name: 'User Registration',
      description: 'Test new user registration',
      test: async () => {
        const testUser = {
          email: `test${Date.now()}@example.com`,
          password: 'TestPass123!',
          full_name: 'Test User'
        };
        
        const result = await authService.register(testUser);
        
        if (!result.success) {
          throw new Error(result.error || 'Registration failed');
        }
        
        return result;
      }
    }
  ];

  const runSingleTest = async (test) => {
    setCurrentTest(test.id);
    
    try {
      const startTime = Date.now();
      const result = await test.test();
      const duration = Date.now() - startTime;
      
      return {
        id: test.id,
        name: test.name,
        status: 'passed',
        duration,
        result
      };
    } catch (error) {
      return {
        id: test.id,
        name: test.name,
        status: 'failed',
        error: error.message,
        duration: Date.now() - Date.now()
      };
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTests([]);
    
    const results = [];
    
    for (const test of testSuite) {
      const result = await runSingleTest(test);
      results.push(result);
      setTests([...results]);
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setCurrentTest(null);
    setIsRunning(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Authentication Testing Panel
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Run comprehensive tests to verify authentication functionality
          </p>
        </div>

        <div className="p-6">
          <div className="flex gap-3 mb-6">
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg font-medium transition-colors"
            >
              {isRunning ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {isRunning ? 'Running Tests...' : 'Run All Tests'}
            </button>
            
            <button
              onClick={() => setTests([])}
              disabled={isRunning}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
            >
              Clear Results
            </button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {testSuite.map((test) => {
              const result = tests.find(t => t.id === test.id);
              const isCurrentlyRunning = currentTest === test.id;
              
              return (
                <div
                  key={test.id}
                  className={`p-4 border rounded-lg transition-all ${
                    isCurrentlyRunning
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : result
                      ? result.status === 'passed'
                        ? 'border-green-200 bg-green-50 dark:bg-green-900/20'
                        : 'border-red-200 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {isCurrentlyRunning ? (
                          <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                        ) : result ? (
                          getStatusIcon(result.status)
                        ) : (
                          <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                        )}
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {test.name}
                        </h3>
                        {result && (
                          <span className="text-xs text-gray-500">
                            {result.duration}ms
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {test.description}
                      </p>
                      
                      {result && result.error && (
                        <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded text-sm text-red-700 dark:text-red-300">
                          {result.error}
                        </div>
                      )}
                      
                      {result && result.result && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-500 cursor-pointer">
                            View Result
                          </summary>
                          <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1 overflow-auto">
                            {JSON.stringify(result.result, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                    
                    <button
                      onClick={() => runSingleTest(test).then(result => {
                        setTests(prev => {
                          const filtered = prev.filter(t => t.id !== test.id);
                          return [...filtered, result];
                        });
                      })}
                      disabled={isRunning}
                      className="ml-4 px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded transition-colors"
                    >
                      Run
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {tests.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                Test Summary
              </h3>
              <div className="flex gap-4 text-sm">
                <span className="text-green-600">
                  Passed: {tests.filter(t => t.status === 'passed').length}
                </span>
                <span className="text-red-600">
                  Failed: {tests.filter(t => t.status === 'failed').length}
                </span>
                <span className="text-gray-600">
                  Total: {tests.length}/{testSuite.length}
                </span>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TestingPanel;
