import { JSX } from 'react';

/**
 * JDListPage component displays a list of job descriptions.
 *
 * @returns {JSX.Element} The JDListPage component.
 */
export const JDListPage = (): JSX.Element => {
  return (
    <div data-testid="job-list-page" className="mx-auto max-w-7xl space-y-6 px-4 py-4 md:px-6">
      <h1 className="text-2xl font-bold">Job Descriptions</h1>
    </div>
  );
};
