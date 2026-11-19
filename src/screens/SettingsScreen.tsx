import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

const SECTIONS: { title: string; items: string[] }[] = [
  {
    title: "Account",
    items: ["Edit profile", "Shipping options", "Payment methods", "Collecting groups"],
  },
  { title: "Preferences", items: ["International trading", "Notifications", "Dark mode"] },
  { title: "Trust & safety", items: ["Verification", "Reviews", "Blocked users"] },
  { title: "About", items: ["Open-source licenses", "Privacy policy", "Help"] },
];

export default function SettingsScreen() {
  const navigate = useNavigate();
  return (
    <div className="px-4 pt-2">
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white"
        >
          <ChevronLeft size={20} color="#2D2D2D" />
        </button>
        <h1 className="font-display text-lg font-bold text-wink-ink">Settings</h1>
      </div>

      {SECTIONS.map((section) => (
        <div key={section.title} className="mb-5">
          <p className="mb-2 text-xs uppercase tracking-wide text-wink-muted">{section.title}</p>
          <div className="overflow-hidden rounded-card border border-wink-pink-border bg-white">
            {section.items.map((item, i) => (
              <button
                key={item}
                type="button"
                className={`block w-full px-4 py-3.5 text-left text-wink-ink active:bg-wink-purple-tint ${i > 0 ? "border-t border-wink-pink-border" : ""}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      ))}
      <p className="text-center text-xs text-wink-muted">
        WinKPop v0.1.0 · MIT licensed · React + Vite + Capacitor
      </p>
    </div>
  );
}
