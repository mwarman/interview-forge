import { describe, expect, it } from 'vitest';

import { render, screen } from '@testing-library/react';

import { JDListPage } from './JDListPage';

describe('JDListPage', () => {
  it('should render the job list page', () => {
    // Arrange and Act
    render(<JDListPage />);

    // Assert
    expect(screen.getByTestId('job-list-page')).toBeInTheDocument();
  });
});
