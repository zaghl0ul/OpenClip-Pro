import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Send,
  Sparkles,
  Clock,
  Target,
  TrendingUp,
  Users,
  MessageSquare,
  BarChart3,
  Brain,
} from 'lucide-react';

const AnalysisPrompt = ({ onAnalyze, isAnalyzing = false, className = '', initialPrompt = '' }) => {
  const [prompt, setPrompt] = useState(initialPrompt || '');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState('openai');

  useEffect(() => {
    if (initialPrompt && initialPrompt !== prompt) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  const aiProviders = [
    {
      id: 'openai',
      name: 'OpenAI GPT-4 Vision',
      description: 'Best for detailed content analysis',
    },
    {
      id: 'anthropic',
      name: 'Anthropic Claude',
      description: 'Best for nuanced understanding',
    },
    {
      id: 'gemini',
      name: 'Google Gemini',
      description: 'Best for visual elements',
    },
    {
      id: 'lmstudio',
      name: 'LM Studio (Local)',
      description: 'Privacy-focused local AI models',
    },
  ];

  const analysisTemplates = [
    {
      id: 'engagement',
      title: 'Engagement Analysis',
      description: 'Analyze viewer engagement and retention patterns',
      icon: TrendingUp,
      prompt:
        'Analyze the engagement patterns in this video. Focus on moments where viewers are most engaged, drop-off points, and suggest improvements for better retention.',
    },
    {
      id: 'content',
      title: 'Content Quality',
      description: 'Evaluate content structure and delivery',
      icon: Target,
      prompt:
        'Evaluate the content quality of this video. Analyze the structure, pacing, clarity of message, and provide suggestions for improvement.',
    },
    {
      id: 'audience',
      title: 'Audience Insights',
      description: 'Understand your target audience better',
      icon: Users,
      prompt:
        'Provide insights about the target audience for this video. Analyze who would be most interested in this content and suggest ways to better reach them.',
    },
    {
      id: 'performance',
      title: 'Performance Metrics',
      description: 'Comprehensive performance analysis',
      icon: BarChart3,
      prompt:
        'Analyze the overall performance of this video. Include metrics interpretation, comparison with similar content, and actionable recommendations.',
    },
    {
      id: 'storytelling',
      title: 'Storytelling Analysis',
      description: 'Evaluate narrative structure and flow',
      icon: MessageSquare,
      prompt:
        'Analyze the storytelling elements in this video. Evaluate the narrative structure, emotional arc, and suggest improvements for better storytelling.',
    },
    {
      id: 'timing',
      title: 'Timing & Pacing',
      description: 'Optimize video timing and pacing',
      icon: Clock,
      prompt:
        'Analyze the timing and pacing of this video. Identify segments that are too fast or slow, and suggest optimal pacing for better viewer experience.',
    },
  ];

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setPrompt(template.prompt);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (prompt.trim() && onAnalyze) {
      onAnalyze(prompt.trim(), selectedProvider);
    }
  };

  const handleCustomPrompt = () => {
    setSelectedTemplate(null);
    setPrompt('');
  };

  return (
    <div className={`glass-shine rounded-lg p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-5 h-5 text-green-400" />
        <h3 className="text-lg font-semibold text-white">AI Video Analysis</h3>
      </div>

      {/* AI Provider Selection */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-white/80 mb-3">Select AI Provider</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {aiProviders.map((provider) => (
            <motion.button
              key={provider.id}
              type="button"
              onClick={() => setSelectedProvider(provider.id)}
              className={`p-3 rounded-lg border text-left transition-all ${
                selectedProvider === provider.id
                  ? 'border-blue-500 bg-blue-500/20 text-white'
                  : 'border-white/20 bg-white/5 text-white/80 hover:border-white/30 hover:bg-white/10'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-start gap-2">
                <Brain
                  className={`w-4 h-4 mt-0.5 ${
                    selectedProvider === provider.id ? 'text-blue-400' : 'text-white/60'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{provider.name}</div>
                  <div className="text-xs opacity-75 mt-1">{provider.description}</div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Analysis Templates */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-white/80 mb-3">Quick Analysis Templates</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {analysisTemplates.map((template) => {
            const IconComponent = template.icon;
            return (
              <motion.button
                key={template.id}
                type="button"
                onClick={() => handleTemplateSelect(template)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  selectedTemplate?.id === template.id
                    ? 'border-green-500 bg-green-500/20 text-white'
                    : 'border-white/20 bg-white/5 text-white/80 hover:border-white/30 hover:bg-white/10'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-start gap-2">
                  <IconComponent
                    className={`w-4 h-4 mt-0.5 ${
                      selectedTemplate?.id === template.id ? 'text-green-400' : 'text-white/60'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{template.title}</div>
                    <div className="text-xs opacity-75 mt-1">{template.description}</div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Custom Prompt Section */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="analysis-prompt" className="text-sm font-medium text-white/80">
              Analysis Prompt
            </label>
            {selectedTemplate && (
              <button
                type="button"
                onClick={handleCustomPrompt}
                className="text-xs text-green-400 hover:text-green-300 transition-colors"
              >
                Write custom prompt
              </button>
            )}
          </div>

          <textarea
            id="analysis-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what you'd like to analyze about this video..."
            className="w-full h-32 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            disabled={isAnalyzing}
          />
        </div>

        {selectedTemplate && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-500/10 border border-green-500/30 rounded-lg p-3"
          >
            <div className="flex items-start gap-2">
              <selectedTemplate.icon className="w-4 h-4 text-green-400 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-green-300">
                  Using template: {selectedTemplate.title}
                </div>
                <div className="text-xs text-green-400/80 mt-1">{selectedTemplate.description}</div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-xs text-white/50">
            Using:{' '}
            <span className="text-blue-400">
              {aiProviders.find((p) => p.id === selectedProvider)?.name}
            </span>
          </div>

          <motion.button
            type="submit"
            disabled={!prompt.trim() || isAnalyzing}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Analyze Video
              </>
            )}
          </motion.button>
        </div>
      </form>

      {/* Analysis Tips */}
      <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
        <h5 className="text-sm font-medium text-white/80 mb-2">💡 Analysis Tips</h5>
        <ul className="text-xs text-white/60 space-y-1">
          <li>• Be specific about what aspects you want to analyze</li>
          <li>• Mention your target audience or goals for better insights</li>
          <li>• Ask for actionable recommendations, not just observations</li>
          <li>• Consider asking about specific timestamps or segments</li>
          <li>• Different AI providers have different strengths</li>
        </ul>
      </div>
    </div>
  );
};

export default AnalysisPrompt;
