import { describe, expect, it } from 'vitest';

import { render, screen } from '@/test/test-utils';
import { SkeletonLoaderBlock } from './SkeletonLoaderBlock';

describe('SkeletonLoaderBlock', () => {
  it('should render successfully', () => {
    // Arrange
    const title = 'Loading...';
    const description = 'Please wait while we load the content.';
    const icon = <span data-testid="loader-icon">🔄</span>;

    // Act
    render(<SkeletonLoaderBlock title={title} description={description} icon={icon} />);

    // Assert
    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.getByText(description)).toBeInTheDocument();
    expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    // Arrange
    const title = 'Loading...';
    const customClassName = 'custom-class';

    // Act
    render(<SkeletonLoaderBlock title={title} className={customClassName} />);

    // Assert
    expect(screen.getByTestId('skeleton-loader-block')).toHaveClass(customClassName);
  });

  it('should use the provided testId', () => {
    // Arrange
    const title = 'Loading...';
    const testId = 'custom-test-id';

    // Act
    render(<SkeletonLoaderBlock title={title} testId={testId} />);

    // Assert
    expect(screen.getByTestId(testId)).toBeInTheDocument();
  });
});
