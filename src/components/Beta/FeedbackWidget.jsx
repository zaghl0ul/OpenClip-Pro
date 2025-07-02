import React, { useState } from 'react';

import { AnimatePresence, ScaleIn } from '../Common/LightweightMotion';
import { 
  BugIcon, 
  LightbulbIcon, 
  HeartIcon, 
  MessageSquareIcon, 
  XIcon, 
  StarIcon, 
  SendIcon 
} from '../Common/icons';

const FeedbackWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    type: '',
    rating: 0,
    message: '',
    page: window.location.pathname
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const feedbackTypes = [
    { id: 'bug', label: 'Bug Report', icon: BugIcon, color: 'text-red-400' },
    { id: 'feature', label: 'Feature Request', icon: LightbulbIcon, color: 'text-yellow-400' },
    { id: 'general', label: 'General Feedback', icon: HeartIcon, color: 'text-green-400' }
  ];

  const handleSubmit = async () => {
    if (!feedbackData.message.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      // Track feedback submission
      if (window.gtag) {
        window.gtag('event', 'feedback_submitted', {
          event_category: 'engagement',
          event_label: feedbackData.type,
          value: feedbackData.rating
        });
      }
      
      // Simulate API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsSuccess(true);
      
      setTimeout(() => {
        setIsOpen(false);
        setIsSuccess(false);
        setFeedbackData({ type: '', rating: 0, message: '', page: window.location.pathname });
      }, 2000);
    } catch (error) {
      console.error('Feedback error:', error);
    }
    
    setIsSubmitting(false);
  };

  const handleTypeSelect = (type) => {
    setFeedbackData(prev => ({ ...prev, type }));
  };

  const handleRatingSelect = (rating) => {
    setFeedbackData(prev => ({ ...prev, rating }));
  };

  const handleMessageChange = (e) => {
    setFeedbackData(prev => ({ ...prev, message: e.target.value }));
  };

  return (
    <>
      {/* Feedback Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 p-3 bg-primary/20 hover:bg-primary/30 border border-primary/30 rounded-full text-primary transition-all duration-200 hover:scale-110 shadow-lg backdrop-blur-sm"
        title="Send Feedback"
      >
        <MessageSquareIcon size={24} className="w-6 h-6" />
      </button>

      {/* Feedback Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <ScaleIn className="glass-card w-full max-w-md p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Send Feedback</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                >
                  <XIcon size={20} className="w-5 h-5" />
                </button>
              </div>

              {isSuccess ? (
                <div className="text-center py-8">
                  <div size={64} className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
                    <HeartIcon size={32} className="w-8 h-8 text-green-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">Thank You!</h4>
                  <p className="text-gray-400">Your feedback has been submitted successfully.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Feedback Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      What type of feedback is this?
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {feedbackTypes.map((type) => {
                        const Icon = type.icon;
                        return (
                          <button
                            key={type.id}
                            onClick={() => handleTypeSelect(type.id)}
                            className={`p-3 rounded-lg border transition-all ${
                              feedbackData.type === type.id
                                ? 'border-primary bg-primary/20 text-primary'
                                : 'border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300'
                            }`}
                          >
                            <Icon className={`w-5 h-5 mx-auto mb-1 ${type.color}`} />
                            <span className="text-xs block">{type.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Rating */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      How would you rate your experience?
                    </label>
                    <div className="flex justify-center gap-1">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => handleRatingSelect(rating)}
                          className={`p-2 rounded transition-colors ${
                            feedbackData.rating >= rating
                              ? 'text-yellow-400'
                              : 'text-gray-500 hover:text-gray-400'
                          }`}
                        >
                          <StarIcon size={24} className="w-6 h-6 fill-current" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Your feedback
                    </label>
                    <textarea
                      value={feedbackData.message}
                      onChange={handleMessageChange}
                      placeholder="Tell us what you think..."
                      className="w-full h-32 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmit}
                    disabled={!feedbackData.type || !feedbackData.message.trim() || isSubmitting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div size={16} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <SendIcon size={16} className="w-4 h-4" />
                        Send Feedback
                      </>
                    )}
                  </button>
                </div>
              )}
            </ScaleIn>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FeedbackWidget; 