import { JSX } from 'react';
import { Outlet, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon } from 'lucide-react';

import { Button } from '@/common/components/shadcn/button';
import { Skeleton } from '@/common/components/shadcn/skeleton';
import { useGetSession } from '@/common/api/useGetSession';

export const SessionLayout = (): JSX.Element => {
  const navigate = useNavigate();
  const { jdId, sessionId } = useParams<{ jdId: string; sessionId: string }>();
  const { data: session, isLoading } = useGetSession(jdId ?? '', sessionId ?? '');

  const handleBackClick = () => {
    if (jdId) {
      navigate(`/jds/${jdId}/sessions`);
    } else {
      navigate(-1);
    }
  };

  return (
    <div data-testid="session-layout" className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6">
      {/* Session Layout Header */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="justify-start"
          onClick={handleBackClick}
          data-testid="back-button"
          aria-label="Go back"
        >
          <ArrowLeftIcon className="size-5" />
          <span className="sr-only">Go back to session list</span>
        </Button>
        {isLoading ? (
          <Skeleton className="h-8 w-64" />
        ) : (
          <h1 className="flex-1 text-2xl font-bold">Session for {session?.candidateName}</h1>
        )}
      </div>

      {/* Session Layout Content Area */}
      <div data-testid="session-layout-content" className="no-scrollbar flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
};
