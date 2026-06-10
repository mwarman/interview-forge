import { JSX } from 'react';
import { useNavigate } from 'react-router-dom';

import { JobDescription } from '@interview-forge/shared';
import { Badge } from '@/common/components/shadcn/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/common/components/shadcn/card';
import { useGetSessions } from '@/pages/jd/sessions/list/api/useGetSessions';

interface JDCardProps {
  jd: JobDescription;
}

/**
 * Formats an ISO 8601 datetime string to a human-readable date.
 */
const formatCreatedAt = (createdAt: string): string => {
  return new Date(createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Formats a Unix epoch TTL timestamp to a human-readable countdown.
 * e.g. "Expires in 2d", "Expires in 47h", "Expired"
 */
export const formatTTLCountdown = (ttl: number): string => {
  const now = Math.floor(Date.now() / 1000);
  const diff = ttl - now;
  if (diff <= 0) return 'Expired';
  const totalHours = Math.floor(diff / 3600);
  const days = Math.floor(totalHours / 24);
  if (days > 0) return `Expires in ${days}d`;
  return `Expires in ${totalHours}h`;
};

/**
 * JDCard component - displays a single job description card with title, created date,
 * TTL expiry countdown, and session count. Navigates to the sessions page on click.
 *
 * @param jd - The JobDescription object to display
 * @returns {JSX.Element} The JDCard component
 */
export const JDCard = ({ jd }: JDCardProps): JSX.Element => {
  const navigate = useNavigate();
  const { data: sessions } = useGetSessions(jd.jdId);
  const sessionCount = sessions?.length ?? 0;

  const handleClick = () => {
    navigate(`/jds/${jd.jdId}/sessions`);
  };

  return (
    <Card
      className="hover:ring-primary/30 cursor-pointer transition-shadow"
      onClick={handleClick}
      data-testid="jd-card"
    >
      <CardHeader>
        <CardTitle data-testid="jd-card-title">{jd.title}</CardTitle>
        <CardDescription data-testid="jd-card-date">{formatCreatedAt(jd.createdAt)}</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <span data-testid="jd-card-ttl" className="text-muted-foreground text-sm">
          {formatTTLCountdown(jd.TTL)}
        </span>
        <Badge variant="secondary" data-testid="jd-card-session-count">
          {sessionCount} {sessionCount === 1 ? 'session' : 'sessions'}
        </Badge>
      </CardContent>
    </Card>
  );
};
