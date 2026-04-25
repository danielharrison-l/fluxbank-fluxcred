import { lazy, Suspense, useEffect, useState } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import Home from "./app/page";
import { ensureAuthenticatedSession } from "./lib/api";
import { getStoredAccessToken } from "./lib/auth";

const AnalysisPage = lazy(() => import("./app/analysis/page"));
const AccountsPage = lazy(() => import("./app/accounts/page"));
const ConnectAccountsPage = lazy(() => import("./app/connect-accounts/page"));
const CreditRequestPage = lazy(() => import("./app/credit-request/page"));
const CreditScorePage = lazy(() => import("./app/credit-score/page"));
const DashboardPage = lazy(() => import("./app/dashboard/page"));
const ForgotPasswordPage = lazy(() => import("./app/forgot-password/page"));
const LoginPage = lazy(() => import("./app/login/page"));
const LogoutPage = lazy(() => import("./app/logout/page"));
const ProfilePage = lazy(() => import("./app/profile/page"));
const RegisterPage = lazy(() => import("./app/register/page"));
const ResetPasswordPage = lazy(() => import("./app/reset-password/page"));
const TransactionsPage = lazy(() => import("./app/transactions/page"));
const VerifyEmailPage = lazy(() => import("./app/verify-email/page"));

function hasStoredSession() {
  return Boolean(getStoredAccessToken());
}

function useSessionState() {
  const [state, setState] = useState<"checking" | "authenticated" | "guest">(
    hasStoredSession() ? "authenticated" : "checking",
  );

  useEffect(() => {
    if (hasStoredSession()) {
      setState("authenticated");
      return;
    }

    let isMounted = true;

    ensureAuthenticatedSession()
      .then((isAuthenticated) => {
        if (!isMounted) {
          return;
        }

        setState(isAuthenticated ? "authenticated" : "guest");
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setState("guest");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}

const protectedRoutePrefixes = [
  "/dashboard",
  "/analysis",
  "/accounts",
  "/transactions",
  "/connect-accounts",
  "/credit-score",
  "/credit-request",
  "/profile",
];

const navSkeletonItems = [
  { id: "dashboard", width: "w-44" },
  { id: "transactions", width: "w-40" },
  { id: "analysis", width: "w-36" },
  { id: "credit-score", width: "w-48" },
  { id: "credit-request", width: "w-44" },
  { id: "connect-accounts", width: "w-36" },
];

function SkeletonBlock({ className }: { className: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-slate-200 ${className}`} />
  );
}

function SessionLoadingScreen() {
  return (
    <main
      className="grid min-h-svh place-items-center bg-[#f7fafa] px-6"
      aria-label="Restaurando sessão"
    >
      <div className="h-2 w-36 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full w-16 animate-pulse rounded-full bg-[#00766d]" />
      </div>
    </main>
  );
}

function ProtectedRouteLoadingScreen() {
  return (
    <main
      className="min-h-svh bg-[#f7fafa] text-[#102a43]"
      aria-label="Carregando página"
    >
      <aside className="fixed left-0 top-0 z-50 hidden h-svh w-72 flex-col border-r border-slate-200 bg-white p-6 md:flex">
        <div className="mb-8">
          <SkeletonBlock className="h-8 w-32" />
          <SkeletonBlock className="mt-2 h-3 w-28" />
        </div>

        <nav className="flex-1 space-y-3">
          {navSkeletonItems.map((item) => (
            <div className="flex items-center gap-3 px-4 py-3" key={item.id}>
              <SkeletonBlock className="size-5 rounded-md" />
              <SkeletonBlock className={`h-4 ${item.width}`} />
            </div>
          ))}
        </nav>

        <div className="space-y-3 border-t border-slate-100 pt-5">
          <SkeletonBlock className="h-12 w-full rounded-xl" />
          <SkeletonBlock className="h-10 w-40" />
          <SkeletonBlock className="h-10 w-28" />
        </div>
      </aside>

      <section className="min-h-svh pb-28 md:ml-72 md:pb-8">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 shadow-sm backdrop-blur">
          <div className="flex h-16 items-center justify-between px-5 md:px-8">
            <SkeletonBlock className="h-6 w-28" />
            <div className="flex items-center gap-3">
              <SkeletonBlock className="hidden h-10 w-56 rounded-xl sm:block" />
              <SkeletonBlock className="size-10 rounded-full" />
            </div>
          </div>
        </header>

        <div className="space-y-6 px-5 py-6 md:px-8">
          <div className="grid gap-4 lg:grid-cols-4">
            <SkeletonBlock className="h-32" />
            <SkeletonBlock className="h-32" />
            <SkeletonBlock className="h-32" />
            <SkeletonBlock className="h-32" />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <SkeletonBlock className="h-80" />
            <SkeletonBlock className="h-80" />
          </div>

          <SkeletonBlock className="h-64" />
        </div>
      </section>

      <nav className="fixed inset-x-0 bottom-0 z-50 grid h-20 grid-cols-5 border-t border-slate-200 bg-white px-3 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] md:hidden">
        {[0, 1, 2, 3, 4].map((item) => (
          <div className="flex items-center justify-center" key={item}>
            <SkeletonBlock className="size-9 rounded-full" />
          </div>
        ))}
      </nav>
    </main>
  );
}

function PublicRouteLoadingScreen() {
  return (
    <main
      className="min-h-svh bg-[#f7fafa] px-5 py-5"
      aria-label="Carregando página"
    >
      <header className="mx-auto flex h-14 max-w-6xl items-center justify-between">
        <SkeletonBlock className="h-8 w-32" />
        <div className="hidden items-center gap-3 sm:flex">
          <SkeletonBlock className="h-9 w-20" />
          <SkeletonBlock className="h-9 w-28" />
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100svh-5.5rem)] max-w-6xl items-center gap-8 py-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-5">
          <SkeletonBlock className="h-12 w-full max-w-lg" />
          <SkeletonBlock className="h-12 w-10/12 max-w-md" />
          <SkeletonBlock className="h-5 w-full max-w-xl" />
          <SkeletonBlock className="h-5 w-9/12 max-w-lg" />
          <div className="flex gap-3 pt-3">
            <SkeletonBlock className="h-11 w-32" />
            <SkeletonBlock className="h-11 w-28" />
          </div>
        </div>
        <SkeletonBlock className="h-[26rem] w-full" />
      </section>
    </main>
  );
}

function RouteLoadingScreen() {
  const location = useLocation();
  const isProtectedRoute = protectedRoutePrefixes.some((prefix) =>
    location.pathname.startsWith(prefix),
  );

  return isProtectedRoute ? (
    <ProtectedRouteLoadingScreen />
  ) : (
    <PublicRouteLoadingScreen />
  );
}

function EntryRoute() {
  const sessionState = useSessionState();

  if (sessionState === "checking") {
    return <SessionLoadingScreen />;
  }

  return sessionState === "authenticated" ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <Home />
  );
}

function PublicAuthRoute({ children }: { children: React.ReactNode }) {
  const sessionState = useSessionState();

  if (sessionState === "checking") {
    return <SessionLoadingScreen />;
  }

  return sessionState === "authenticated" ? (
    <Navigate to="/dashboard" replace />
  ) : (
    children
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const sessionState = useSessionState();

  if (sessionState === "checking") {
    return <SessionLoadingScreen />;
  }

  return sessionState === "authenticated" ? (
    children
  ) : (
    <Navigate to="/login" replace />
  );
}

function InternalLinkNavigationHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.altKey ||
        event.ctrlKey ||
        event.shiftKey
      ) {
        return;
      }

      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const link = target.closest<HTMLAnchorElement>("a[href]");

      if (!link || link.target || link.hasAttribute("download")) {
        return;
      }

      const href = link.getAttribute("href");

      if (!href || href.startsWith("#")) {
        return;
      }

      const url = new URL(href, window.location.href);

      if (url.origin !== window.location.origin) {
        return;
      }

      event.preventDefault();
      navigate(`${url.pathname}${url.search}${url.hash}`);
    }

    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, [navigate]);

  return null;
}

export function App() {
  return (
    <Suspense fallback={<RouteLoadingScreen />}>
      <InternalLinkNavigationHandler />
      <Routes>
        <Route path="/" element={<EntryRoute />} />
        <Route
          path="/login"
          element={
            <PublicAuthRoute>
              <LoginPage />
            </PublicAuthRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicAuthRoute>
              <RegisterPage />
            </PublicAuthRoute>
          }
        />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/logout" element={<LogoutPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analysis"
          element={
            <ProtectedRoute>
              <AnalysisPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/accounts"
          element={
            <ProtectedRoute>
              <AccountsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transactions"
          element={
            <ProtectedRoute>
              <TransactionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/connect-accounts"
          element={
            <ProtectedRoute>
              <ConnectAccountsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/credit-score"
          element={
            <ProtectedRoute>
              <CreditScorePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/credit-request"
          element={
            <ProtectedRoute>
              <CreditRequestPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
