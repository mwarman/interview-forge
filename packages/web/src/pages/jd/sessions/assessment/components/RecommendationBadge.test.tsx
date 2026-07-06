import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { RecommendationBadge } from './RecommendationBadge';

describe('RecommendationBadge', () => {
  it('should render STRONG_HIRE recommendation with green styling', () => {
    // Arrange & Act
    render(<RecommendationBadge recommendation="STRONG_HIRE" />);

    // Assert
    const badge = screen.getByTestId('recommendation-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('STRONG HIRE');
    expect(badge).toHaveClass('bg-green-100', 'text-green-800', 'border-green-300');
  });

  it('should render HIRE recommendation with teal styling', () => {
    // Arrange & Act
    render(<RecommendationBadge recommendation="HIRE" />);

    // Assert
    const badge = screen.getByTestId('recommendation-badge');
    expect(badge).toHaveTextContent('HIRE');
    expect(badge).toHaveClass('bg-teal-100', 'text-teal-800', 'border-teal-300');
  });

  it('should render NO_HIRE recommendation with orange styling', () => {
    // Arrange & Act
    render(<RecommendationBadge recommendation="NO_HIRE" />);

    // Assert
    const badge = screen.getByTestId('recommendation-badge');
    expect(badge).toHaveTextContent('NO HIRE');
    expect(badge).toHaveClass('bg-orange-100', 'text-orange-800', 'border-orange-300');
  });

  it('should render STRONG_NO_HIRE recommendation with red styling', () => {
    // Arrange & Act
    render(<RecommendationBadge recommendation="STRONG_NO_HIRE" />);

    // Assert
    const badge = screen.getByTestId('recommendation-badge');
    expect(badge).toHaveTextContent('STRONG NO HIRE');
    expect(badge).toHaveClass('bg-red-100', 'text-red-800', 'border-red-300');
  });

  it('should use custom test ID when provided', () => {
    // Arrange & Act
    render(<RecommendationBadge recommendation="HIRE" testId="custom-badge" />);

    // Assert
    expect(screen.getByTestId('custom-badge')).toBeInTheDocument();
  });
});
