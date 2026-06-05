// src/test/test-utils.tsx
import { ThemeProvider } from '@/common/providers/ThemeProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, renderHook, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

/**
 * Creates a new QueryClient instance for testing purposes.
 * @returns A new QueryClient instance.
 */
export const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
};

/**
 * Renders a React component with a query client, theme provider, and router for testing purposes.
 * Ensures that components relying on routing (NavLink, useNavigate, etc.) and theme context work correctly.
 * @param ui The React element to render.
 * @param options Options for rendering.
 * @returns The result of the render.
 */
export const renderWithAllProviders = (ui: React.ReactElement, options?: Omit<RenderOptions, 'wrapper'>) => {
  const queryClient = createTestQueryClient();
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>{children}</ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};

/**
 * Renders a React hook with a query client, theme provider, and router for testing purposes.
 * Ensures that hooks relying on routing (useNavigate, etc.) and theme context work correctly.
 * @param hook The hook to render.
 * @returns The result of the renderHook.
 */
export const renderHookWithAllProviders = <TProps, TResult>(hook: (props: TProps) => TResult) => {
  const queryClient = createTestQueryClient();
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>{children}</ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );

  return renderHook(hook, { wrapper: Wrapper });
};

export * from '@testing-library/react';
