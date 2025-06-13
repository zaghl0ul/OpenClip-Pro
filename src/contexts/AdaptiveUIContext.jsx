import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import useAdaptiveUIStore from '../stores/adaptiveUIStore';

// Create the context
const AdaptiveUIContext = createContext({
  createAdaptiveClickHandler: () => () => {},
  trackTimeInArea: () => () => {},
  adaptivePreferences: {
    theme: 'dark',
    animationLevel: 'reduced',
    interactionStyle: 'standard',
  },
  updatePreference: () => {},
});

// Provider component
export const AdaptiveUIProvider = ({ children }) => {
  const adaptiveUIStore = useAdaptiveUIStore();
  const [adaptivePreferences, setAdaptivePreferences] = useState({
    theme: 'dark',
    animationLevel: 'reduced',
    interactionStyle: 'standard',
  });

  // Function to update a specific preference
  const updatePreference = useCallback((key, value) => {
    setAdaptivePreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // Create a click handler that can be used to track user interactions
  const createAdaptiveClickHandler = useCallback((elementId, category) => {
    return () => {
      // Track the click in the store
      adaptiveUIStore.trackClick(elementId, category);
      console.log(`Adaptive UI: ${category} element "${elementId}" clicked`);
    };
  }, [adaptiveUIStore]);

  // Track time spent in different areas of the UI
  const trackTimeInArea = useCallback((area) => {
    return adaptiveUIStore.trackTimeInArea(area);
  }, [adaptiveUIStore]);

  // Initialize from store if needed
  useEffect(() => {
    // Any initialization logic can go here
  }, []);

  const value = {
    adaptivePreferences,
    updatePreference,
    createAdaptiveClickHandler,
    trackTimeInArea,
  };

  return (
    <AdaptiveUIContext.Provider value={value}>
      {children}
    </AdaptiveUIContext.Provider>
  );
};

// Custom hook to use the context
export const useAdaptiveUI = () => {
  const context = useContext(AdaptiveUIContext);
  if (context === undefined) {
    throw new Error('useAdaptiveUI must be used within an AdaptiveUIProvider');
  }
  return context;
};

export default AdaptiveUIContext; 