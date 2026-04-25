import { Navigate, Route, Routes } from "react-router-dom";
import ConnectAccountsPage from "./app/connect-accounts/page";
import CreditRequestPage from "./app/credit-request/page";
import CreditScorePage from "./app/credit-score/page";
import DashboardPage from "./app/dashboard/page";
import LoginPage from "./app/login/page";
import RegisterPage from "./app/register/page";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/connect-accounts" element={<ConnectAccountsPage />} />
      <Route path="/credit-score" element={<CreditScorePage />} />
      <Route path="/credit-request" element={<CreditRequestPage />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
