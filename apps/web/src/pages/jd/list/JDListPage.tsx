import { JSX } from 'react';
import { Link } from 'react-router-dom';
import { FolderOpenIcon, PlusIcon } from 'lucide-react';

import { Button } from '@/common/components/shadcn/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/common/components/shadcn/empty';
import { Skeleton } from '@/common/components/shadcn/skeleton';
import { useGetJobDescriptions } from '@/pages/jd/list/api/useGetJobDescriptions';
import { JDCard } from '@/pages/jd/list/components/JDCard';

/**
 * JDListPage component displays a list of job descriptions fetched from GET /jds.
 * Shows a loading skeleton while fetching, an error state on failure, an empty state
 * with a CTA when no JDs exist, and a responsive card grid when JDs are available.
 *
 * @returns {JSX.Element} The JDListPage component.
 */
export const JDListPage = (): JSX.Element => {
  const { data: jobDescriptions, isLoading, isError } = useGetJobDescriptions();

  return (
    <div data-testid="job-list-page" className="mx-auto max-w-7xl space-y-6 px-4 py-4 md:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Job Descriptions</h1>
        <Button asChild data-testid="create-jd-button">
          <Link to="/jds/create">
            <PlusIcon />
            New Job Description
          </Link>
        </Button>
      </div>

      {isLoading && (
        <div data-testid="jd-list-skeleton" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      )}

      {isError && (
        <div
          data-testid="jd-list-error"
          className="border-destructive/30 text-destructive rounded-xl border p-6 text-center text-sm"
        >
          Failed to load job descriptions. Please try again.
        </div>
      )}

      {!isLoading && !isError && jobDescriptions?.length === 0 && (
        <Empty data-testid="jd-list-empty">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderOpenIcon />
            </EmptyMedia>
            <EmptyTitle>No Job Descriptions</EmptyTitle>
            <EmptyDescription>
              You haven't created any job descriptions yet. Get started by creating your first one.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild data-testid="empty-create-jd-button">
              <Link to="/jds/create">
                <PlusIcon />
                Create Job Description
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
      )}

      {!isLoading && !isError && jobDescriptions && jobDescriptions.length > 0 && (
        <div data-testid="jd-list-grid" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobDescriptions.map((jd) => (
            <JDCard key={jd.jdId} jd={jd} />
          ))}
        </div>
      )}
    </div>
  );
};
