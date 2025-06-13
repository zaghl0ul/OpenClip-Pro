import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAdaptiveUIStore = create(
  persist(
    (set, get) => ({
      // User interaction patterns
      userPatterns: {
        frequentTools: ['analyze', 'trim', 'export'], // Default order
        frequentRoutes: ['dashboard', 'projects'],
        timeInAreas: {
          sidebar: 0,
          header: 0,
          main: 0,
        },
        clickFrequency: {},
      },
      
      // UI adaptations based on user behavior
      adaptations: {
        sidebarCompact: false,
        toolPriorities: ['analyze', 'trim', 'export'],
        suggestedActions: [],
        interfaceMode: 'standard', // standard, focused, advanced
      },
      
      // Track time spent in different UI areas
      trackTimeInArea: (area) => {
        const startTime = Date.now();
        
        // Return cleanup function
        return () => {
          const endTime = Date.now();
          const timeSpent = endTime - startTime;
          
          set((state) => ({
            userPatterns: {
              ...state.userPatterns,
              timeInAreas: {
                ...state.userPatterns.timeInAreas,
                [area]: (state.userPatterns.timeInAreas[area] || 0) + timeSpent,
              },
            },
          }));
        };
      },
      
      // Track tool usage
      trackToolUsage: (toolId) => {
        set((state) => {
          const updatedFrequentTools = [...state.userPatterns.frequentTools];
          
          // Add tool to the list if not already present
          if (!updatedFrequentTools.includes(toolId)) {
            updatedFrequentTools.push(toolId);
          }
          
          return {
            userPatterns: {
              ...state.userPatterns,
              frequentTools: updatedFrequentTools,
            },
          };
        });
        
        // Update tool priorities based on usage
        const { userPatterns } = get();
        const toolCounts = {};
        
        userPatterns.frequentTools.forEach((tool) => {
          toolCounts[tool] = (toolCounts[tool] || 0) + 1;
        });
        
        const sortedTools = Object.keys(toolCounts).sort(
          (a, b) => toolCounts[b] - toolCounts[a]
        );
        
        set((state) => ({
          adaptations: {
            ...state.adaptations,
            toolPriorities: sortedTools,
          },
        }));
      },
      
      // Track navigation patterns
      trackNavigation: (route) => {
        set((state) => ({
          userPatterns: {
            ...state.userPatterns,
            frequentRoutes: [...state.userPatterns.frequentRoutes, route].slice(-10),
          },
        }));
      },
      
      // Track UI element clicks
      trackClick: (elementId, category) => {
        set((state) => {
          const key = `${category}:${elementId}`;
          return {
            userPatterns: {
              ...state.userPatterns,
              clickFrequency: {
                ...state.userPatterns.clickFrequency,
                [key]: (state.userPatterns.clickFrequency[key] || 0) + 1,
              },
            },
          };
        });
      },
      
      // Reset all tracking data
      resetTracking: () => {
        set({
          userPatterns: {
            frequentTools: [],
            frequentRoutes: [],
            timeInAreas: {
              sidebar: 0,
              header: 0,
              main: 0,
            },
            clickFrequency: {},
          },
          adaptations: {
            sidebarCompact: false,
            toolPriorities: ['analyze', 'trim', 'export'],
            suggestedActions: [],
            interfaceMode: 'standard',
          },
        });
      },
    }),
    {
      name: 'adaptive-ui-storage',
    }
  )
);

export default useAdaptiveUIStore; 