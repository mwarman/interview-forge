import { JSX, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon, PlusIcon, UsersIcon } from 'lucide-react';

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
import { useGetSessions } from '@/pages/jd/sessions/list/api/useGetSessions';
import { NewSessionDialog } from '@/pages/jd/sessions/list/components/NewSessionDialog';
import { SessionCard } from '@/pages/jd/sessions/list/components/SessionCard';

/**
 * JDSessionsPage component - displays all sessions for a given job description.
 * Fetches sessions from GET /jds/:jdId/sessions. Shows loading skeleton, error state,
 * empty state with CTA, and a scrollable list of session cards.
 * Includes a "New Session" button that opens a dialog to create a new session.
 * On successful session creation, navigates to the session plan page (M3).
 *
 * @returns {JSX.Element} The JDSessionsPage component
 */
export const JDSessionsPage = (): JSX.Element => {
  const { jdId } = useParams<{ jdId: string }>();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: sessions, isLoading, isError } = useGetSessions(jdId ?? '');

  const handleSessionCreated = (sessionId: string) => {
    setDialogOpen(false);
    // TODO: M3 - navigate to plan generation page once implemented
    navigate(`/jds/${jdId}/sessions/${sessionId}/plan`);
  };

  return (
    <div data-testid="jd-sessions-page" className="mx-auto max-w-7xl space-y-6 px-4 py-4 md:px-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => navigate('/jds')}
          data-testid="back-button"
          aria-label="Back to Job Descriptions"
        >
          <ArrowLeftIcon />
        </Button>
        <h1 className="flex-1 text-2xl font-bold">Sessions</h1>
        <Button onClick={() => setDialogOpen(true)} data-testid="new-session-button">
          <PlusIcon />
          New Session
        </Button>
      </div>

      {isLoading && (
        <div data-testid="sessions-skeleton" className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      )}

      {isError && (
        <div
          data-testid="sessions-error"
          className="border-destructive/30 text-destructive rounded-xl border p-6 text-center text-sm"
        >
          Failed to load sessions. Please try again.
        </div>
      )}

      {!isLoading && !isError && sessions?.length === 0 && (
        <Empty data-testid="sessions-empty">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UsersIcon />
            </EmptyMedia>
            <EmptyTitle>No Sessions Yet</EmptyTitle>
            <EmptyDescription>No interview sessions have been created for this job description yet.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setDialogOpen(true)} data-testid="empty-new-session-button">
              <PlusIcon />
              New Session
            </Button>
          </EmptyContent>
        </Empty>
      )}

      {!isLoading && !isError && sessions && sessions.length > 0 && (
        <div data-testid="sessions-list" className="space-y-3">
          {sessions.map((session) => (
            <SessionCard key={session.sessionId} session={session} />
          ))}
        </div>
      )}

      {jdId && (
        <NewSessionDialog jdId={jdId} open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={handleSessionCreated} />
      )}
    </div>
  );
};
