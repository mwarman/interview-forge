import { JSX } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { Layout } from '@/common/layouts/Layout';
import { JDListPage } from '@/pages/jd/list/JDListPage';
import { JDCreatePage } from '@/pages/jd/create/JDCreatePage';
import { JDSessionsPage } from '@/pages/jd/sessions/list/JDSessionsPage';
import { PlanPage } from '@/pages/jd/sessions/plan/PlanPage';
import { ScorecardPage } from '@/pages/jd/sessions/scorecard/ScorecardPage';
import { SessionDetailPage } from '@/pages/jd/sessions/detail/SessionDetailPage';
import { AssessmentPage } from '@/pages/jd/sessions/assessment/AssessmentPage';

/**
 * The Router component defines the routing structure of the application using React Router.
 * All routes are nested under the Layout route, which provides the shared app shell
 * (persistent navigation menu, theme toggle, and page content outlet).
 *
 * @returns {JSX.Element} The Router component with defined routes.
 */
export const Router = (): JSX.Element => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/jds" replace />} />
          <Route path="/jds" element={<JDListPage />} />
          <Route path="/jds/create" element={<JDCreatePage />} />
          <Route path="/jds/:jdId/sessions" element={<JDSessionsPage />} />
          <Route path="/jds/:jdId/sessions/:sessionId/plan" element={<PlanPage />} />
          <Route path="/jds/:jdId/sessions/:sessionId/scorecard" element={<ScorecardPage />} />
          <Route path="/jds/:jdId/sessions/:sessionId/assessment" element={<AssessmentPage />} />
          <Route path="/jds/:jdId/sessions/:sessionId/detail" element={<SessionDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
