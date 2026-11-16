import {
  Outlet,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  redirect,
} from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { AppShell } from '~/components/layouts/AppShell'
import { type MasterResourceKey } from '~/integrations/api'
import { queryClient } from '~/integrations/tanstack-query/root-provider'
import { authActions } from '~/lib/store/auth'
import {
  PermissionsPage,
  ProfilePage,
  RolesPage,
  UsersPage,
} from '~/pages/access/AccessPages'
import {
  ActivateAccountPage,
  ForgotPasswordPage,
  SignInPage,
  VerifyEmailPage,
} from '~/pages/auth/AuthPages'
import { DashboardPage } from '~/pages/dashboard/DashboardPage'
import { MASTER_CONFIGS, MasterResourcePage } from '~/pages/master/MasterResourcePage'
import { ProcurementMethodsPage } from '~/pages/master/ProcurementMethodsPage'
import { ProcurementCreatePage } from '~/pages/procurements/ProcurementCreatePage'
import { ProcurementDetailPage } from '~/pages/procurements/ProcurementDetailPage'
import { ProcurementEditPage } from '~/pages/procurements/ProcurementEditPage'
import { ProcurementListPage } from '~/pages/procurements/ProcurementListPage'

export interface RouterContext {
  queryClient: QueryClient
}

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: () => <Outlet />,
})

const signInRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sign-in',
  beforeLoad: () => {
    if (authActions.getToken()) {
      throw redirect({ to: '/' })
    }
  },
  component: SignInPage,
})

const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/forgot-password',
  component: ForgotPasswordPage,
})

const activateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/activate',
  component: ActivateAccountPage,
})

const verifyEmailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/verify-email',
  component: VerifyEmailPage,
})

const shellLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_shell',
  beforeLoad: () => {
    if (!authActions.getToken()) {
      throw redirect({ to: '/sign-in' })
    }
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
})

const dashboardRoute = createRoute({
  getParentRoute: () => shellLayoutRoute,
  path: '/',
  component: DashboardPage,
})

const procurementsRoute = createRoute({
  getParentRoute: () => shellLayoutRoute,
  path: '/procurements',
  component: ProcurementListPage,
})

const procurementCreateRoute = createRoute({
  getParentRoute: () => shellLayoutRoute,
  path: '/procurements/new',
  component: ProcurementCreatePage,
})

const procurementDetailRoute = createRoute({
  getParentRoute: () => shellLayoutRoute,
  path: '/procurements/$id',
  component: ProcurementDetailPage,
})

const procurementEditRoute = createRoute({
  getParentRoute: () => shellLayoutRoute,
  path: '/procurements/$id/edit',
  component: ProcurementEditPage,
})

const procurementMethodsRoute = createRoute({
  getParentRoute: () => shellLayoutRoute,
  path: '/master/procurement-methods',
  component: ProcurementMethodsPage,
})

const masterResourceKeys = Object.keys(MASTER_CONFIGS) as MasterResourceKey[]

const masterRoutes = masterResourceKeys.map((resourceKey) =>
  createRoute({
    getParentRoute: () => shellLayoutRoute,
    path: `/master/${resourceKey}`,
    component: function MasterRouteComponent() {
      return <MasterResourcePage resource={resourceKey} />
    },
  }),
)

const usersRoute = createRoute({
  getParentRoute: () => shellLayoutRoute,
  path: '/access/users',
  component: UsersPage,
})

const rolesRoute = createRoute({
  getParentRoute: () => shellLayoutRoute,
  path: '/access/roles',
  component: RolesPage,
})

const permissionsRoute = createRoute({
  getParentRoute: () => shellLayoutRoute,
  path: '/access/permissions',
  component: PermissionsPage,
})

const profileRoute = createRoute({
  getParentRoute: () => shellLayoutRoute,
  path: '/profile',
  component: ProfilePage,
})

const routeTree = rootRoute.addChildren([
  signInRoute,
  forgotPasswordRoute,
  activateRoute,
  verifyEmailRoute,
  shellLayoutRoute.addChildren([
    dashboardRoute,
    procurementsRoute,
    procurementCreateRoute,
    procurementDetailRoute,
    procurementEditRoute,
    procurementMethodsRoute,
    usersRoute,
    rolesRoute,
    permissionsRoute,
    profileRoute,
    ...masterRoutes,
  ]),
])

export const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
  defaultPreload: 'intent',
})
