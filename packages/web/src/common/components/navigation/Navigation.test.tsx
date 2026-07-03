import { describe, it, expect } from 'vitest';
import { Routes, Route, useLocation, MemoryRouter } from 'react-router-dom';

import { render, screen } from '@/test/test-utils';

import { Navigation } from './Navigation';

// Component to display current location for testing routing
const LocationDisplay = () => {
  const location = useLocation();
  return <div data-testid="current-location">{location.pathname}</div>;
};

describe('Navigation', () => {
  const renderNavigationWithRouting = (path = '/') => {
    return render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/" element={<Navigation />} />
          <Route path="/jds" element={<Navigation />} />
          <Route path="/jds/:jdId" element={<Navigation />} />
          <Route path="/jds/:jdId/sessions" element={<Navigation />} />
        </Routes>
        <LocationDisplay />
      </MemoryRouter>,
    );
  };

  describe('happy path', () => {
    it('should render successfully', () => {
      // Arrange & Act
      renderNavigationWithRouting();

      // Assert
      expect(screen.getByTestId('nav-jobs-link')).toBeInTheDocument();
    });

    it('should display Jobs and Sessions links', () => {
      // Arrange & Act
      renderNavigationWithRouting('/jds/123/sessions');

      // Assert
      expect(screen.getByText('Jobs')).toBeInTheDocument();
      expect(screen.getByText('Sessions')).toBeInTheDocument();
    });

    it('should have correct hrefs', () => {
      // Arrange & Act
      renderNavigationWithRouting('/jds/123/sessions');

      // Assert
      const jobsLink = screen.getByTestId('nav-jobs-link') as HTMLAnchorElement;
      const sessionsLink = screen.getByTestId('nav-sessions-link') as HTMLAnchorElement;

      expect(jobsLink.href).toContain('/jds');
      expect(sessionsLink.href).toContain('/sessions');
    });
  });

  describe('accessibility', () => {
    it('should have semantic anchor elements', () => {
      // Arrange & Act
      renderNavigationWithRouting('/jds/123/sessions');

      // Assert
      const jobsLink = screen.getByTestId('nav-jobs-link');
      const sessionsLink = screen.getByTestId('nav-sessions-link');

      expect(jobsLink.tagName).toBe('A');
      expect(sessionsLink.tagName).toBe('A');
    });

    it('should maintain navigation menu structure', () => {
      // Arrange & Act
      renderNavigationWithRouting('/jds/123/sessions');

      // Assert
      const navigationLinks = screen.getAllByRole('link');
      expect(navigationLinks.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('link navigation', () => {
    it('jobs link should be navigable', () => {
      // Arrange & Act
      renderNavigationWithRouting();
      const jobsLink = screen.getByTestId('nav-jobs-link');

      // Assert
      expect(jobsLink).toHaveAttribute('href');
      expect((jobsLink as HTMLAnchorElement).href).toContain('/jds');
    });

    it('sessions link should be navigable', () => {
      // Arrange & Act
      renderNavigationWithRouting('/jds/123/sessions');
      const sessionsLink = screen.getByTestId('nav-sessions-link');

      // Assert
      expect(sessionsLink).toHaveAttribute('href');
      expect((sessionsLink as HTMLAnchorElement).href).toContain('/jds');
    });
  });
});
