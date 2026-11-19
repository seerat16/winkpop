import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui";
import { useUserStore } from "@/data/userStore";

export default function LoginScreen() {
  const navigate = useNavigate();
  const login = useUserStore((s) => s.login);
  const signup = useUserStore((s) => s.signup);
  const loginDemo = useUserStore((s) => s.loginDemo);

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");

  const handleContinue = () => {
    setError("");
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    const result = mode === "login" ? login(email, password) : signup(email, password);
    if (!result.success) {
      setError(result.error ?? "Something went wrong.");
      return;
    }
    navigate(mode === "signup" ? "/onboarding" : "/home", { replace: true });
  };

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center bg-wink-purple-tint px-6">
      <div className="mb-8 flex flex-col items-center">
        <Logo size={120} />
        <p className="mt-2 text-sm text-wink-muted">Win the K-pop photocard experience</p>
      </div>

      <div className="mb-6 flex w-full rounded-card bg-white p-1">
        {(["login", "signup"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setMode(tab);
              setError("");
            }}
            className={`flex-1 rounded-card py-2 text-sm font-bold ${mode === tab ? "bg-wink-pink text-white" : "text-wink-muted"}`}
          >
            {tab === "login" ? "Log In" : "Sign Up"}
          </button>
        ))}
      </div>

      <div className="w-full space-y-3">
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-card border border-wink-pink-border bg-white px-4 py-3 text-sm text-wink-ink outline-none"
        />
        <div className="relative">
          <input
            type={showPw ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-card border border-wink-pink-border bg-white px-4 py-3 pr-12 text-sm text-wink-ink outline-none"
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-wink-muted"
            aria-label={showPw ? "Hide password" : "Show password"}
          >
            {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <Button fullWidth onClick={handleContinue}>
          {mode === "login" ? "Log In" : "Create Account"}
        </Button>

        {error && (
          <div className="rounded-card border border-wink-pink-border bg-white px-4 py-3">
            <p className="text-center text-sm text-wink-pink">{error}</p>
          </div>
        )}
      </div>

      <div className="my-5 flex w-full items-center gap-3">
        <div className="h-px flex-1 bg-wink-pink-border" />
        <span className="text-sm text-wink-muted">or</span>
        <div className="h-px flex-1 bg-wink-pink-border" />
      </div>

      <Button
        variant="secondary"
        fullWidth
        onClick={() => {
          loginDemo();
          navigate("/home", { replace: true });
        }}
      >
        Explore as demo collector
      </Button>
    </div>
  );
}
