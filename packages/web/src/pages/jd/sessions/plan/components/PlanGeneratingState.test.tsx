import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';

import { renderWithAllProviders } from '@/test/test-utils';
import { PlanGeneratingState } from './PlanGeneratingState';

describe('PlanGeneratingState', () => {
  it('should render loading indicator with descriptive label', () => {
    // Arrange & Act
    renderWithAllProviders(<PlanGeneratingState />);

    // Assert
    expect(screen.getByTestId('plan-generating-state')).toBeInTheDocument();
    expect(screen.getByText('Generating your interview plan…')).toBeInTheDocument();
    expect(screen.getByText('This may take a few moments. Please wait.')).toBeInTheDocument();
  });

  it('should render skeleton loaders', () => {
    // Arrange & Act
    renderWithAllProviders(<PlanGeneratingState />);

    // Assert
    const skeletons = screen.getByTestId('plan-generating-state').querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBe(3);
  });

  it('should accept custom testId', () => {
    // Arrange & Act
    renderWithAllProviders(<PlanGeneratingState testId="custom-loading" />);

    // Assert
    expect(screen.getByTestId('custom-loading')).toBeInTheDocument();
  });
});
