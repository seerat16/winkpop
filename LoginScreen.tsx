import { useState, useEffect } from "react";
import { useNavigate } from "../router";
import { Eye, EyeOff } from "lucide-react";
import { login, signup, getCurrentUser } from "../data/userStore";
import { AppLogo } from "../components/AppLogo";

const PRIMARY = "#7C3AED";
const PRIMARY_LIGHT = "#F0EAFF";

export default function LoginScreen() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Auto-redirect if already logged in (seed account sets a session on every load)
  useEffect(() => {
    if (getCurrentUser()) {
      navigate("/home");
    }
  }, []);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");

  const handleContinue = () => {
    setError("");
    const trimmed = email.trim().toLowerCase();

    if (!trimmed || !password) {
      setError("Please enter your email and password.");
      return;
    }

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    if (!emailValid) {
      setError("Please enter a valid email address (e.g. name@example.com).");
      return;
    }

    if (mode === "login") {
      const result = login(trimmed, password);
      if (!result.success) {
        setError(result.error || "Login failed");
        return;
      }
      navigate("/home");
    } else {
      const result = signup(trimmed, password);
      if (!result.success) {
        setError(result.error || "Signup failed");
        if (result.error === "Email already registered") {
          setMode("login");
        }
        return;
      }
      navigate("/onboarding");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-md mx-auto w-full">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <AppLogo size={200} />
          <p style={{ color: "var(--muted-foreground)", fontSize: "0.82rem", marginTop: 4 }}>
            Win the K-pop photocard collecting experience
          </p>
        </div>

        {/* Tabs */}
        <div
          className="flex w-full mb-6 rounded-xl overflow-hidden"
          style={{ background: "var(--secondary)", padding: 4 }}
        >
          {(["login", "signup"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => { setMode(tab); setError(""); }}
              className="flex-1 py-2 rounded-lg transition-all"
              style={{
                background: mode === tab ? PRIMARY : "transparent",
                color: mode === tab ? "#fff" : "#aaa",
                fontSize: "0.9rem",
                fontWeight: 600,
              }}
            >
              {tab === "login" ? "Log In" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="w-full space-y-3">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl outline-none"
            style={{ background: "var(--card)", border: "1.5px solid var(--border)", fontSize: "0.9rem" }}
          />
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl outline-none pr-12"
              style={{ background: "var(--card)", border: "1.5px solid var(--border)", fontSize: "0.9rem" }}
            />
            <button
              onClick={() => setShowPw(!showPw)}
              className="absolute right-4 top-1/2 -translate-y-1/2"
              style={{ color: "#bbb" }}
            >
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            onClick={handleContinue}
            className="w-full py-3 rounded-xl mt-1"
            style={{ background: PRIMARY, color: "#fff", fontWeight: 700, fontSize: "0.95rem" }}
          >
            {mode === "login" ? "Log In" : "Create Account"}
          </button>

          {error && (
            <div className="px-4 py-3 rounded-xl" style={{ background: "var(--secondary)", border: "1.5px solid var(--border)" }}>
              <p style={{ color: PRIMARY, fontSize: "0.82rem", textAlign: "center" }}>{error}</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 my-5 w-full">
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          <span style={{ color: "var(--muted-foreground)", fontSize: "0.8rem" }}>or</span>
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
        </div>

        {/* Social */}
        <div className="flex gap-3 w-full">
          <button
            onClick={() => mode === "signup" ? navigate("/onboarding") : setError("No account found. Please check your details or sign up.")}
            className="flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2"
            style={{ background: "var(--card)", border: "1.5px solid var(--border)", color: "var(--foreground)", fontWeight: 600, fontSize: "0.85rem" }}
          >
            <span style={{ fontWeight: 800 }}>G</span>
            Google
          </button>
          <button
            onClick={() => navigate("/login/instagram")}
            className="flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2"
            style={{
              background: "linear-gradient(135deg, #FCAF45 0%, #E1306C 50%, #833AB4 100%)",
              color: "#fff", fontWeight: 600, fontSize: "0.85rem",
            }}
          >
            <span style={{ fontWeight: 800 }}>📸</span>
            Instagram
          </button>
        </div>

        {mode === "login" && (
          <button style={{ color: PRIMARY, fontSize: "0.82rem", marginTop: 16 }}>
            Forgot password?
          </button>
        )}
      </div>
    </div>
  );
}
