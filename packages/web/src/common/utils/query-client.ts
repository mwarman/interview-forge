import { QueryClient } from '@tanstack/react-query';

/**
 * Create a single instance of QueryClient to be used throughout the app.
 * This allows us to share cache and configuration across all components.
 * Configured with global defaults for query behavior and retry policy.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

/**
 * Centralized query key definitions for consistent cache management.
 * Functions that generate query keys based on parameters to avoid hardcoding strings throughout the app.
 */
export const queryKeys = {
  jobDescriptions: () => ['jobDescriptions'],
  jobDescription: (jdId: string) => ['jobDescription', jdId],
  sessions: (jdId: string) => ['sessions', jdId],
  session: (jdId: string, sessionId: string) => ['sessions', jdId, sessionId],
  plan: (jdId: string, sessionId: string) => ['plan', jdId, sessionId],
  scorecard: (jdId: string, sessionId: string) => ['scorecard', jdId, sessionId],
};
