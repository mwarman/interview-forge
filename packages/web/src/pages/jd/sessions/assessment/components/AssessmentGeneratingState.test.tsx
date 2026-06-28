import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { AssessmentGeneratingState } from './AssessmentGeneratingState';

describe('AssessmentGeneratingState', () => {
  it('should render loading state with default test ID', () => {
    // Arrange & Act
    render(<AssessmentGeneratingState />);

    // Assert
    expect(screen.getByTestId('assessment-generating-state')).toBeInTheDocument();
    expect(screen.getByText('Generating assessment…')).toBeInTheDocument();
    expect(screen.getByText('This may take a few moments. Please wait.')).toBeInTheDocument();
  });

  it('should render loading state with custom test ID', () => {
    // Arrange & Act
    render(<AssessmentGeneratingState testId="custom-generating-state" />);

    // Assert
    expect(screen.getByTestId('custom-generating-state')).toBeInTheDocument();
  });
});
