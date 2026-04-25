import { lazy, Suspense, useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
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

function SessionLoadingScreen() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-[#f7fafa] px-6 text-center text-sm text-slate-500">
      Restaurando sua sessão...
    </main>
  );
}

function RouteLoadingScreen() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-[#f7fafa] px-6 text-center text-sm text-slate-500">
      Carregando...
    </main>
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
