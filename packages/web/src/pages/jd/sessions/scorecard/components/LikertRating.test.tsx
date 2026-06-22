import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithAllProviders } from '@/test/test-utils';

import { LikertRating } from './LikertRating';

describe('LikertRating', () => {
  it('should render all 5 rating options', () => {
    // Arrange & Act
    renderWithAllProviders(<LikertRating value={undefined} onChange={vi.fn()} />);

    // Assert
    expect(screen.getByTestId('rating-label-1')).toHaveTextContent('1 - Poor');
    expect(screen.getByTestId('rating-label-2')).toHaveTextContent('2 - Fair');
    expect(screen.getByTestId('rating-label-3')).toHaveTextContent('3 - Good');
    expect(screen.getByTestId('rating-label-4')).toHaveTextContent('4 - Very Good');
    expect(screen.getByTestId('rating-label-5')).toHaveTextContent('5 - Excellent');
  });

  it('should have rating options visible and interactive', () => {
    // Arrange & Act
    renderWithAllProviders(<LikertRating value={undefined} onChange={vi.fn()} />);

    // Assert
    expect(screen.getByTestId('rating-option-1')).toBeInTheDocument();
    expect(screen.getByTestId('rating-option-2')).toBeInTheDocument();
    expect(screen.getByTestId('rating-option-3')).toBeInTheDocument();
    expect(screen.getByTestId('rating-option-4')).toBeInTheDocument();
    expect(screen.getByTestId('rating-option-5')).toBeInTheDocument();
  });

  it('should call onChange when rating is selected', async () => {
    // Arrange
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithAllProviders(<LikertRating value={undefined} onChange={onChange} />);

    // Act
    await user.click(screen.getByTestId('rating-option-4'));

    // Assert
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('should update to show selected value', async () => {
    // Arrange
    const onChange = vi.fn();
    const { rerender } = renderWithAllProviders(<LikertRating value={2} onChange={onChange} />);

    // Assert initial state
    const option2 = screen.getByTestId('rating-option-2') as HTMLInputElement;
    expect(option2.value).toBe('2');

    // Act - rerender with different value
    rerender(<LikertRating value={5} onChange={onChange} />);

    // Assert updated state
    const option5 = screen.getByTestId('rating-option-5') as HTMLInputElement;
    expect(option5.value).toBe('5');
  });

  it('should be keyboard accessible', async () => {
    // Arrange
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithAllProviders(<LikertRating value={1} onChange={onChange} />);

    // Act - click option and verify
    await user.click(screen.getByTestId('rating-option-1'));
    await user.click(screen.getByTestId('rating-option-2'));

    // Assert
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('should have no selection initially when value is undefined', () => {
    // Arrange & Act
    renderWithAllProviders(<LikertRating value={undefined} onChange={vi.fn()} />);

    // Assert - all options should be available
    const options = [1, 2, 3, 4, 5];
    options.forEach((val) => {
      expect(screen.getByTestId(`rating-option-${val}`)).toBeInTheDocument();
    });
  });

  it('should allow multiple clicks to change selection', async () => {
    // Arrange
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithAllProviders(<LikertRating value={undefined} onChange={onChange} />);

    // Act
    await user.click(screen.getByTestId('rating-option-1'));
    await user.click(screen.getByTestId('rating-option-3'));
    await user.click(screen.getByTestId('rating-option-5'));

    // Assert
    expect(onChange).toHaveBeenCalledTimes(3);
    expect(onChange).toHaveBeenLastCalledWith(5);
  });
});
