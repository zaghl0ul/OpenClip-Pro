import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Star, Bug, Lightbulb, Heart } from 'lucide-react';

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
    { id: 'bug', label: 'Bug Report', icon: Bug, color: 'text-red-400' },
    { id: 'feature', label: 'Feature Request', icon: Lightbulb, color: 'text-yellow-400' },
    { id: 'general', label: 'General Feedback', icon: Heart, color: 'text-green-400' }
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

  return (
    <>
      {/* Feedback Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-primary to-accent text-white p-4 rounded-full shadow-lg hover:scale-110 transition-all"
        whileHover={{ scale: 1.1 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 2 }}
      >
        <MessageSquare className="w-6 h-6" />
      </motion.button>

      {/* Feedback Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl w-full max-w-md border border-primary/20"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-6 h-6 text-primary" />
                  <h3 className="font-semibold text-white">Feedback</h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                {isSuccess ? (
                  <div className="text-center py-4">
                    <Heart className="w-16 h-16 text-green-400 mx-auto mb-4" />
                    <h4 className="text-white font-semibold mb-2">Thank you!</h4>
                    <p className="text-gray-400 text-sm">Your feedback helps us improve.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {!feedbackData.type ? (
                      <>
                        <h4 className="text-white font-medium mb-4">What type of feedback?</h4>
                        {feedbackTypes.map((type) => (
                          <button
                            key={type.id}
                            onClick={() => setFeedbackData(prev => ({ ...prev, type: type.id }))}
                            className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-700 hover:border-primary/50 text-left"
                          >
                            <type.icon className={`w-5 h-5 ${type.color}`} />
                            <span className="text-white">{type.label}</span>
                          </button>
                        ))}
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 mb-4">
                          <button
                            onClick={() => setFeedbackData(prev => ({ ...prev, type: '' }))}
                            className="text-gray-400 hover:text-white"
                          >
                            ←
                          </button>
                          <span className="text-white font-medium">
                            {feedbackTypes.find(t => t.id === feedbackData.type)?.label}
                          </span>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Rate your experience
                          </label>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => setFeedbackData(prev => ({ ...prev, rating: star }))}
                                className={`transition-colors ${
                                  star <= feedbackData.rating ? 'text-yellow-400' : 'text-gray-600'
                                }`}
                              >
                                <Star className="w-6 h-6 fill-current" />
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Tell us more
                          </label>
                          <textarea
                            value={feedbackData.message}
                            onChange={(e) => setFeedbackData(prev => ({ ...prev, message: e.target.value }))}
                            placeholder="Share your feedback..."
                            className="w-full h-24 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 resize-none"
                          />
                        </div>

                        <button
                          onClick={handleSubmit}
                          disabled={!feedbackData.message.trim() || isSubmitting}
                          className="w-full bg-gradient-to-r from-primary to-accent text-white px-4 py-3 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isSubmitting ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              Send Feedback
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FeedbackWidget; 