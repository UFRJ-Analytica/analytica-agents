import React from 'react';
import {
  AnalyticsDashboard,
  AnalyticsSalesAnalysis,
  AnalyticsGeography,
} from './pages';
import { withNavigationWatcher } from './contexts/navigation';
import { Navigate } from 'react-router-dom';

const routes = [
  {
    path: '/analytics-dashboard',
    element: AnalyticsDashboard,
  },
  {
    path: '/analytics-sales-analysis',
    element: AnalyticsSalesAnalysis,
  },
  {
    path: '/analytics-geography',
    element: AnalyticsGeography,
  }
];

const redirects = [
  { from: '/analytics-sales-report', to: '/analytics-sales-analysis' },
];

const redirectRoutes = redirects.map(({ from, to }) => ({
  path: from,
  element: <Navigate to={to} replace />,
}));

export const appRoutes = [
  ...routes.map((route) => ({
    ...route,
    element: withNavigationWatcher(route.element, route.path),
  })),
  ...redirectRoutes,
];
