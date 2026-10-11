import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { About } from './About';

describe('About', () => {
  describe('rendering', () => {
    it('should render about button with Info icon', () => {
      // Arrange & Act
      render(<About />);

      // Assert
      const button = screen.getByRole('button', { name: /About this project/ });
      expect(button).toBeTruthy();
    });

    it('should have correct aria-label', () => {
      // Arrange & Act
      render(<About />);

      // Assert
      const button = screen.getByRole('button', { name: /About this project/ });
      expect(button.getAttribute('aria-label')).toBe('About this project');
    });

    it('should have correct title attribute', () => {
      // Arrange & Act
      render(<About />);

      // Assert
      const button = screen.getByRole('button', { name: /About this project/ });
      expect(button.getAttribute('title')).toBe('About this project');
    });

    it('should render screen reader only text', () => {
      // Arrange & Act
      render(<About />);

      // Assert
      const srText = screen.getByText('About this project');
      expect(srText.className).toContain('sr-only');
    });
  });

  describe('sheet interaction', () => {
    it('should open sheet when about button is clicked', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<About />);

      // Act
      const button = screen.getByRole('button', { name: /About this project/ });
      await user.click(button);

      // Assert
      expect(screen.getByText('About Interview Forge')).toBeTruthy();
    });

    it('should display sheet title and description', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<About />);

      // Act
      const button = screen.getByRole('button', { name: /About this project/ });
      await user.click(button);

      // Assert
      expect(screen.getByText('About Interview Forge')).toBeTruthy();
      expect(screen.getByText('An AI-powered portfolio project')).toBeTruthy();
    });

    it('should display main project description', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<About />);

      // Act
      const button = screen.getByRole('button', { name: /About this project/ });
      await user.click(button);

      // Assert
      expect(
        screen.getByText(/This portfolio project is a human-in-the-loop AI agent that transforms a job description/),
      ).toBeTruthy();
    });

    it('should describe use of Amazon Bedrock', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<About />);

      // Act
      const button = screen.getByRole('button', { name: /About this project/ });
      await user.click(button);

      // Assert
      expect(screen.getByText(/Amazon Bedrock/)).toBeTruthy();
    });

    it('should describe AI agent features', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<About />);

      // Act
      const button = screen.getByRole('button', { name: /About this project/ });
      await user.click(button);

      // Assert
      expect(screen.getByText(/human-in-the-loop/)).toBeTruthy();
      expect(screen.getAllByText(/AI agent/)).toBeTruthy();
    });

    it('should provide GitHub repository information', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<About />);

      // Act
      const button = screen.getByRole('button', { name: /About this project/ });
      await user.click(button);

      // Assert
      expect(
        screen.getByText(/The project is available on GitHub, where you can find the source code and documentation/),
      ).toBeTruthy();
    });

    it('should display GitHub repository link', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<About />);

      // Act
      const button = screen.getByRole('button', { name: /About this project/ });
      await user.click(button);

      // Assert
      const link = screen.getByRole('link', { name: /GitHub repository/ });
      expect(link).toBeTruthy();
      expect(link.getAttribute('href')).toBe('https://github.com/mwarman/interview-forge');
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    });

    it('should display close button', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<About />);

      // Act
      const button = screen.getByRole('button', { name: /About this project/ });
      await user.click(button);

      // Assert
      const closeButton = screen.getByRole('button', { name: /Close/ });
      expect(closeButton).toBeTruthy();
    });

    it('should close sheet when close button is clicked', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<About />);

      // Act
      const button = screen.getByRole('button', { name: /About this project/ });
      await user.click(button);

      // Assert sheet is open
      expect(screen.getByText('About Interview Forge')).toBeTruthy();

      // Act - click close button
      const closeButton = screen.getByRole('button', { name: /Close/ });
      await user.click(closeButton);

      // Assert sheet is closed
      const sheetTitle = screen.queryByText('About Interview Forge');
      expect(sheetTitle).toBeNull();
    });
  });

  describe('link accessibility', () => {
    it('should have correct link styling classes', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<About />);

      // Act
      const button = screen.getByRole('button', { name: /About this project/ });
      await user.click(button);

      // Assert
      const link = screen.getByRole('link', { name: /GitHub repository/ });
      expect(link.className).toContain('text-blue-500');
      expect(link.className).toContain('underline');
    });
  });
});
