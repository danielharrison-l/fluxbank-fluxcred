import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "@/lib/api";

export default function LogoutPage() {
  const navigate = useNavigate();

  useEffect(() => {
    void (async () => {
      await logout();
      navigate("/", { replace: true });
    })();
  }, [navigate]);

  return null;
}
