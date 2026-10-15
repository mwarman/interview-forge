import { JSX } from 'react';
import { NavLink, useLocation, useParams } from 'react-router-dom';

import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from '@/common/components/shadcn/navigation-menu';

/**
 * Navigation component - renders the main navigation menu with links to Jobs and Search pages.
 * Active links are highlighted using React Router's NavLink.
 * Uses shadcn NavigationMenu component with responsive design.
 */
export const Navigation = (): JSX.Element => {
  const location = useLocation();
  const { jdId } = useParams<{ jdId: string }>();

  const isSessionsPathActive = location.pathname.includes('/sessions');

  return (
    <NavigationMenu>
      <NavigationMenuList className="gap-2">
        {/* Jobs Link */}
        <NavigationMenuItem>
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <NavLink to="/jds" data-testid="nav-jobs-link">
              Jobs
            </NavLink>
          </NavigationMenuLink>
        </NavigationMenuItem>

        {isSessionsPathActive && (
          <NavigationMenuItem>
            <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
              <NavLink to={`/jds/${jdId}/sessions`} data-testid="nav-sessions-link">
                Sessions
              </NavLink>
            </NavigationMenuLink>
          </NavigationMenuItem>
        )}
      </NavigationMenuList>
    </NavigationMenu>
  );
};
