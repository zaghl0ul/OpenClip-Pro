import React, { useState } from 'react';
import apiClient from '../utils/apiClient';
import { useSettingsStore } from '../stores/settingsStore';
import { ScaleIn } from './Common/LightweightMotion';
import { 
  TrendingUpIcon, SparklesIcon, BrainIcon, XIcon, VideoIcon, SettingsIcon, 
  LoaderIcon, ZapIcon, ActivityIcon, CheckCircleIcon, PlayIcon, EyeIcon,
  AlertTriangleIcon, XCircleIcon, RefreshCwIcon, ClockIcon, CheckIcon,
  AlertCircleIcon, LinkIcon, TrashIcon, PlusIcon, SearchIcon, Grid3X3Icon,
  ListIcon, ArrowRightIcon, ChevronRightIcon, UploadIcon, DownloadIcon,
  ShareIcon, FileTextIcon, MoreVerticalIcon, EditIcon, UserIcon, BellIcon,
  HelpCircleIcon, MenuIcon, FolderIcon, FilmIcon, TargetIcon, PaletteIcon,
  VolumeXIcon, Volume2Icon, SkipBackIcon, SkipForwardIcon, PauseIcon,
  MaximizeIcon, ScissorsIcon, LayersIcon, TrendingDownIcon, StarIcon,
  MailIcon, SendIcon, UsersIcon, MessageSquareIcon, HomeIcon, YoutubeIcon,
  BarChart2Icon, KeyIcon, ShieldIcon, ArrowLeftIcon
} from '../Common/icons';

const TestingPanel = ({ isOpen, onClose }) => {
  const [tests, setTests] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState(null);
  const { apiKeys, testApiConnection } = useSettingsStore();

  const testSuite = [
    {
      id: 'backend-health',
      name: 'Backend Health Check',
      description: 'Test if backend server is responding',
      test: async () => {
        const response = await apiClient.healthCheck();
        return response;
      },
    },
    {
      id: 'auth-test',
      name: 'Authentication System',
      description: 'Test authentication endpoints',
      test: async () => {
        try {
          // Test if we can get current user (if logged in)
          const user = await apiClient.getCurrentUser();
          return { authenticated: true, user: user.email };
        } catch (error) {
          if (error.message.includes('401')) {
            return { authenticated: false, message: 'Not logged in (expected)' };
          }
          throw error;
        }
      },
    },
    {
      id: 'openai-connection',
      name: 'OpenAI API Connection',
      description: 'Test OpenAI API key and connection',
      test: async () => {
        if (!apiKeys.openai) {
          throw new Error('OpenAI API key not configured');
        }
        const result = await testApiConnection('openai');
        if (!result.success) {
          throw new Error(result.message);
        }
        return result;
      },
    },
    {
      id: 'gemini-connection',
      name: 'Google Gemini API Connection',
      description: 'Test Gemini API key and connection',
      test: async () => {
        if (!apiKeys.gemini) {
          throw new Error('Gemini API key not configured');
        }
        const result = await testApiConnection('gemini');
        if (!result.success) {
          throw new Error(result.message);
        }
        return result;
      },
    },
    {
      id: 'anthropic-connection',
      name: 'Anthropic API Connection',
      description: 'Test Anthropic API key and connection',
      test: async () => {
        if (!apiKeys.anthropic) {
          throw new Error('Anthropic API key not configured');
        }
        const result = await testApiConnection('anthropic');
        if (!result.success) {
          throw new Error(result.message);
        }
        return result;
      },
    },
    {
      id: 'lmstudio-connection',
      name: 'LM Studio Local Connection',
      description: 'Test connection to local LM Studio instance',
      test: async () => {
        const result = await testApiConnection('lmstudio');
        if (!result.success) {
          throw new Error(result.message);
        }
        return result;
      },
    },
    {
      id: 'database-connection',
      name: 'Database Connection',
      description: 'Test database connectivity',
      test: async () => {
        // Test by trying to fetch projects
        const projects = await apiClient.getProjects();
        return {
          connected: true,
          projectCount: projects.length,
          message: `Database accessible, ${projects.length} projects found`,
        };
      },
    },
    {
      id: 'file-upload',
      name: 'File Upload System',
      description: 'Test file upload capabilities',
      test: async () => {
        // Create a small test blob
        const testBlob = new Blob(['test'], { type: 'text/plain' });
        const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });

        try {
          const result = await apiClient.uploadFile(testFile);
          // Clean up test file
          if (result.id) {
            await apiClient.deleteFile(result.id);
          }
          return { uploadWorking: true, message: 'File upload system functional' };
        } catch (error) {
          throw new Error(`Upload failed: ${error.message}`);
        }
      },
    },
    {
      id: 'system-status',
      name: 'System Status Check',
      description: 'Check overall system health and metrics',
      test: async () => {
        const status = await apiClient.getSystemStatus();
        return status;
      },
    },
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
        result,
      };
    } catch (error) {
      return {
        id: test.id,
        name: test.name,
        status: 'failed',
        error: error.message,
        duration: Date.now() - Date.now(),
      };
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTests([]);
    setCurrentTest(null);

    const results = [];

    for (const test of testSuite) {
      try {
        const result = await runSingleTest(test);
        results.push(result);
        setTests([...results]);
      } catch (error) {
        results.push({
          id: test.id,
          name: test.name,
          status: 'failed',
          error: error.message,
          duration: 0,
        });
        setTests([...results]);
      }
    }

    setIsRunning(false);
    setCurrentTest(null);
  };

  const runSpecificTest = async (testId) => {
    const test = testSuite.find((t) => t.id === testId);
    if (!test) return;

    setIsRunning(true);

    try {
      const result = await runSingleTest(test);
      setTests((prevTests) => {
        const newTests = prevTests.filter((t) => t.id !== testId);
        return [...newTests, result];
      });
    } catch (error) {
      console.error('Test failed:', error);
    }

    setIsRunning(false);
    setCurrentTest(null);
  };

  const getTestStatus = (testId) => {
    const test = tests.find((t) => t.id === testId);
    if (!test) return 'pending';
    return test.status;
  };

  const getTestResult = (testId) => {
    return tests.find((t) => t.id === testId);
  };

  const getStatusIcon = (status, isRunning = false) => {
    if (isRunning) return <LoaderIcon size={20} className="w-5 h-5 animate-spin text-blue-400" />;

    switch (status) {
      case 'passed':
        return <CheckCircleIcon size={20} className="w-5 h-5 text-green-400" />;
      case 'failed':
        return <XIcon size={20} className="w-5 h-5 text-red-400" />;
      default:
        return <AlertTriangleIcon size={20} className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'passed':
        return 'text-green-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  if (!isOpen) return null;

  return (
    <ScaleIn>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div>
              <h2 className="text-xl font-semibold text-white">System Testing Panel</h2>
              <p className="text-gray-400 text-sm mt-1">
                Test backend connectivity, API integrations, and system health
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={runAllTests}
                disabled={isRunning}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white text-sm font-medium transition-colors"
              >
                {isRunning ? (
                  <LoaderIcon size={16} className="w-4 h-4 animate-spin" />
                ) : (
                  <PlayIcon size={16} className="w-4 h-4" />
                )}
                {isRunning ? 'Running Tests...' : 'Run All Tests'}
              </button>
              <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                ✕
              </button>
            </div>
          </div>

          {/* Test Results */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="space-y-4">
              {testSuite.map((test) => {
                const status = getTestStatus(test.id);
                const result = getTestResult(test.id);
                const isCurrentlyRunning = currentTest === test.id;

                return (
                  <div
                    key={test.id}
                    className="border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(status, isCurrentlyRunning)}
                        <div>
                          <h3 className="font-medium text-white">{test.name}</h3>
                          <p className="text-sm text-gray-400">{test.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {result && result.duration && (
                          <span className="text-xs text-gray-500">{result.duration}ms</span>
                        )}
                        <button
                          onClick={() => runSpecificTest(test.id)}
                          disabled={isRunning}
                          className="text-blue-400 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <RefreshCwIcon size={16} className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Test Result Details */}
                    {result && (
                      <div className="mt-3 pt-3 border-t border-gray-700">
                        <div className={`text-sm ${getStatusColor(result.status)}`}>
                          Status: {result.status.toUpperCase()}
                        </div>

                        {result.error && (
                          <div className="text-sm text-red-400 mt-1">Error: {result.error}</div>
                        )}

                        {result.result && typeof result.result === 'object' && (
                          <div className="text-sm text-gray-300 mt-2">
                            <pre className="bg-gray-800 p-2 rounded text-xs overflow-x-auto">
                              {JSON.stringify(result.result, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            {tests.length > 0 && (
              <div className="mt-6 p-4 bg-gray-800 rounded-lg">
                <h3 className="font-medium text-white mb-2">Test Summary</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-green-400">Passed: </span>
                    <span className="text-white">
                      {tests.filter((t) => t.status === 'passed').length}
                    </span>
                  </div>
                  <div>
                    <span className="text-red-400">Failed: </span>
                    <span className="text-white">
                      {tests.filter((t) => t.status === 'failed').length}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Total: </span>
                    <span className="text-white">{tests.length}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ScaleIn>
  );
};

export default TestingPanel;
