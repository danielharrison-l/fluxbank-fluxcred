import { useSearchParams } from "react-router-dom";
import { LoginForm } from "../login/_components/login-form";
import { LoginHeroPanel } from "../login/_components/login-hero-panel";

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const showMobileForm = searchParams.get("view") === "form";

  return (
    <main className="min-h-svh bg-background">
      <div className="grid min-h-svh grid-cols-1 lg:grid-cols-12">
        <div
          className={
            showMobileForm
              ? "hidden lg:col-span-6 lg:block xl:col-span-7"
              : "lg:col-span-6 xl:col-span-7"
          }
        >
          <LoginHeroPanel />
        </div>
        <div className="lg:col-span-6 xl:col-span-5">
          <LoginForm mode="register" showOnMobile={showMobileForm} />
        </div>
      </div>
    </main>
  );
}
