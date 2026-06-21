import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { SessionStatusBadge } from './SessionStatusBadge';

describe('SessionStatusBadge', () => {
  describe('Status Variant Mapping', () => {
    it('should render outline variant for PLAN_PENDING status', () => {
      // Arrange & Act
      render(<SessionStatusBadge status="PLAN_PENDING" />);

      // Assert
      const badge = screen.getByTestId('session-status-badge');
      expect(badge).toBeInTheDocument();
      // outline variant has border styling
      expect(badge).toHaveClass('border-border');
    });

    it('should render outline variant for PLAN_GENERATING status', () => {
      // Arrange & Act
      render(<SessionStatusBadge status="PLAN_GENERATING" />);

      // Assert
      const badge = screen.getByTestId('session-status-badge');
      expect(badge).toHaveClass('border-border');
    });

    it('should render outline variant for PLAN_GENERATED status', () => {
      // Arrange & Act
      render(<SessionStatusBadge status="PLAN_GENERATED" />);

      // Assert
      const badge = screen.getByTestId('session-status-badge');
      expect(badge).toHaveClass('border-border');
    });

    it('should render destructive variant for PLAN_ERROR status', () => {
      // Arrange & Act
      render(<SessionStatusBadge status="PLAN_ERROR" />);

      // Assert
      const badge = screen.getByTestId('session-status-badge');
      expect(badge).toHaveClass('text-destructive');
    });

    it('should render secondary variant for PLAN_APPROVED status', () => {
      // Arrange & Act
      render(<SessionStatusBadge status="PLAN_APPROVED" />);

      // Assert
      const badge = screen.getByTestId('session-status-badge');
      expect(badge).toHaveClass('bg-secondary');
    });

    it('should render secondary variant for SCORED status', () => {
      // Arrange & Act
      render(<SessionStatusBadge status="SCORED" />);

      // Assert
      const badge = screen.getByTestId('session-status-badge');
      expect(badge).toHaveClass('bg-secondary');
    });

    it('should render outline variant for ASSESS_GENERATING status', () => {
      // Arrange & Act
      render(<SessionStatusBadge status="ASSESS_GENERATING" />);

      // Assert
      const badge = screen.getByTestId('session-status-badge');
      expect(badge).toHaveClass('border-border');
    });

    it('should render destructive variant for ASSESS_ERROR status', () => {
      // Arrange & Act
      render(<SessionStatusBadge status="ASSESS_ERROR" />);

      // Assert
      const badge = screen.getByTestId('session-status-badge');
      expect(badge).toHaveClass('text-destructive');
    });

    it('should render default variant for ASSESSED status', () => {
      // Arrange & Act
      render(<SessionStatusBadge status="ASSESSED" />);

      // Assert
      const badge = screen.getByTestId('session-status-badge');
      expect(badge).toBeInTheDocument();
      // default variant renders without special variant classes
      expect(badge).not.toHaveClass('bg-secondary');
      expect(badge).not.toHaveClass('text-destructive');
      expect(badge).not.toHaveClass('border-border');
    });

    it('should render default variant for COMPLETE status', () => {
      // Arrange & Act
      render(<SessionStatusBadge status="COMPLETE" />);

      // Assert
      const badge = screen.getByTestId('session-status-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).not.toHaveClass('bg-secondary');
      expect(badge).not.toHaveClass('text-destructive');
      expect(badge).not.toHaveClass('border-border');
    });

    it('should render outline variant for unknown status', () => {
      // Arrange & Act
      render(<SessionStatusBadge status="UNKNOWN_STATUS" />);

      // Assert
      const badge = screen.getByTestId('session-status-badge');
      expect(badge).toHaveClass('border-border');
    });
  });

  describe('Status Label Mapping', () => {
    it('should display "Plan Pending" for PLAN_PENDING status', () => {
      // Arrange & Act
      render(<SessionStatusBadge status="PLAN_PENDING" />);

      // Assert
      expect(screen.getByText('Plan Pending')).toBeInTheDocument();
    });

    it('should display "Generating Plan" for PLAN_GENERATING status', () => {
      // Arrange & Act
      render(<SessionStatusBadge status="PLAN_GENERATING" />);

      // Assert
      expect(screen.getByText('Generating Plan')).toBeInTheDocument();
    });

    it('should display "Plan Generated" for PLAN_GENERATED status', () => {
      // Arrange & Act
      render(<SessionStatusBadge status="PLAN_GENERATED" />);

      // Assert
      expect(screen.getByText('Plan Generated')).toBeInTheDocument();
    });

    it('should display "Plan Error" for PLAN_ERROR status', () => {
      // Arrange & Act
      render(<SessionStatusBadge status="PLAN_ERROR" />);

      // Assert
      expect(screen.getByText('Plan Error')).toBeInTheDocument();
    });

    it('should display "Plan Approved" for PLAN_APPROVED status', () => {
      // Arrange & Act
      render(<SessionStatusBadge status="PLAN_APPROVED" />);

      // Assert
      expect(screen.getByText('Plan Approved')).toBeInTheDocument();
    });

    it('should display "Scored" for SCORED status', () => {
      // Arrange & Act
      render(<SessionStatusBadge status="SCORED" />);

      // Assert
      expect(screen.getByText('Scored')).toBeInTheDocument();
    });

    it('should display "Generating Assessment" for ASSESS_GENERATING status', () => {
      // Arrange & Act
      render(<SessionStatusBadge status="ASSESS_GENERATING" />);

      // Assert
      expect(screen.getByText('Generating Assessment')).toBeInTheDocument();
    });

    it('should display "Assessment Error" for ASSESS_ERROR status', () => {
      // Arrange & Act
      render(<SessionStatusBadge status="ASSESS_ERROR" />);

      // Assert
      expect(screen.getByText('Assessment Error')).toBeInTheDocument();
    });

    it('should display "Assessed" for ASSESSED status', () => {
      // Arrange & Act
      render(<SessionStatusBadge status="ASSESSED" />);

      // Assert
      expect(screen.getByText('Assessed')).toBeInTheDocument();
    });

    it('should display "Complete" for COMPLETE status', () => {
      // Arrange & Act
      render(<SessionStatusBadge status="COMPLETE" />);

      // Assert
      expect(screen.getByText('Complete')).toBeInTheDocument();
    });

    it('should display status value for unknown status', () => {
      // Arrange & Act
      render(<SessionStatusBadge status="UNKNOWN_STATUS" />);

      // Assert
      expect(screen.getByText('UNKNOWN_STATUS')).toBeInTheDocument();
    });
  });

  describe('Test ID Prop', () => {
    it('should use custom testId when provided', () => {
      // Arrange & Act
      render(<SessionStatusBadge status="PLAN_PENDING" testId="custom-badge" />);

      // Assert
      expect(screen.getByTestId('custom-badge')).toBeInTheDocument();
    });

    it('should use default testId when not provided', () => {
      // Arrange & Act
      render(<SessionStatusBadge status="PLAN_PENDING" />);

      // Assert
      expect(screen.getByTestId('session-status-badge')).toBeInTheDocument();
    });
  });

  describe('Badge Rendering', () => {
    it('should render Badge component', () => {
      // Arrange & Act
      render(<SessionStatusBadge status="PLAN_PENDING" />);

      // Assert
      const badge = screen.getByTestId('session-status-badge');
      expect(badge).toBeInTheDocument();
      expect(badge.tagName).toBe('SPAN');
    });

    it('should display correct text and variant combination', () => {
      // Arrange & Act
      render(<SessionStatusBadge status="PLAN_ERROR" />);

      // Assert
      expect(screen.getByText('Plan Error')).toBeInTheDocument();
      const badge = screen.getByTestId('session-status-badge');
      expect(badge).toHaveClass('text-destructive');
    });
  });
});
