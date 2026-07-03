import { JSX } from 'react';

import { cn } from '@/common/utils/css';
import { Skeleton } from '@/common/components/shadcn/skeleton';

interface SkeletonLoaderBlockProps {
  /**
   * Title for the loader
   */
  title: string;
  /**
   * Optional description for the loader
   */
  description?: string;
  /**
   * Optional icon for the loader
   */
  icon?: React.ReactNode;
  /**
   * Optional className for additional styling
   */
  className?: string;
  /**
   * Optional test ID for testing
   */
  testId?: string;
}

/**
 * SkeletonLoaderBlock component - displays a non-blocking loading indicator
 * while the content is being loaded. Shows an animated skeleton with descriptive label.
 *
 * @param title - Title for the loader
 * @param description - Optional description for the loader
 * @param icon - Optional icon for the loader
 * @param testId - Optional test ID for testing
 * @returns {JSX.Element} The SkeletonLoaderBlock component
 */
export const SkeletonLoaderBlock = ({
  title,
  description,
  icon,
  className,
  testId = 'skeleton-loader-block',
}: SkeletonLoaderBlockProps): JSX.Element => {
  return (
    <Skeleton
      className={cn('flex h-72 flex-col items-center justify-center gap-2 rounded-lg p-4', className)}
      data-testid={testId}
    >
      {icon}
      <div>
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="text-muted-foreground mt-2 text-sm">{description}</p>
      </div>
    </Skeleton>
  );
};
