import { JSX } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { Layout } from '@/common/layouts/Layout';
import { JDListPage } from '@/pages/jd/list/JDListPage';

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
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
