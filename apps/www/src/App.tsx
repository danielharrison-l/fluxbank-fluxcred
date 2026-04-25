import { Navigate, Route, Routes } from "react-router-dom";
import AccountsPage from "./app/accounts/page";
import ConnectAccountsPage from "./app/connect-accounts/page";
import CreditRequestPage from "./app/credit-request/page";
import CreditScorePage from "./app/credit-score/page";
import DashboardPage from "./app/dashboard/page";
import Home from "./app/page";
import LoginPage from "./app/login/page";
import RegisterPage from "./app/register/page";
import TransactionsPage from "./app/transactions/page";

const authTokenKeys = ["accessToken", "token", "fluxcred.accessToken"];

function getStoredAuthToken() {
  if (typeof window === "undefined") {
    return null;
  }

  const localToken = authTokenKeys
    .map((key) => window.localStorage.getItem(key))
    .find(Boolean);

  if (localToken) {
    return localToken;
  }

  const cookieToken = document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) =>
      authTokenKeys.some((key) => cookie.startsWith(`${key}=`)),
    );

  return cookieToken?.split("=")[1] ?? null;
}

function hasStoredSession() {
  return Boolean(getStoredAuthToken());
}

function EntryRoute() {
  return hasStoredSession() ? <Navigate to="/dashboard" replace /> : <Home />;
}

function PublicAuthRoute({ children }: { children: React.ReactNode }) {
  return hasStoredSession() ? <Navigate to="/dashboard" replace /> : children;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return hasStoredSession() ? children : <Navigate to="/" replace />;
}

export function App() {
  return (
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
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
