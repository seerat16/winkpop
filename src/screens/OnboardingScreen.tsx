import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { Button } from "@/components/ui";
import { GROUPS } from "@/data/groups";
import { useUserStore } from "@/data/userStore";

export default function OnboardingScreen() {
  const navigate = useNavigate();
  const setCollectingGroups = useUserStore((s) => s.setCollectingGroups);
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <div
      className="mx-auto flex min-h-full max-w-md flex-col bg-wink-purple-tint px-5"
      style={{ paddingTop: "calc(var(--sat) + 24px)" }}
    >
      <h1 className="font-display text-2xl font-extrabold text-wink-ink">Who do you collect?</h1>
      <p className="mb-5 mt-1 text-sm text-wink-muted">
        Pick your groups — we&apos;ll tune your feed and wishlist matches.
      </p>

      <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto pb-4">
        {GROUPS.map((g) => {
          const on = selected.includes(g.id);
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => toggle(g.id)}
              className="rounded-card border bg-white p-4 text-left"
              style={{ borderColor: on ? g.color : "#F0D8E8" }}
            >
              <div className="mb-2 flex items-center justify-between">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-card"
                  style={{ background: g.color }}
                >
                  <span className="text-[10px] font-extrabold text-white">{g.abbr}</span>
                </div>
                {on && (
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded-full"
                    style={{ background: g.color }}
                  >
                    <Check size={14} color="#fff" />
                  </div>
                )}
              </div>
              <div className="font-display font-bold text-wink-ink">{g.name}</div>
              <div className="text-xs text-wink-muted">
                {g.company} · {g.generation}G
              </div>
            </button>
          );
        })}
      </div>

      <div className="py-4" style={{ paddingBottom: "calc(var(--sab) + 16px)" }}>
        <Button
          fullWidth
          onClick={() => {
            setCollectingGroups(selected);
            navigate("/home", { replace: true });
          }}
        >
          {selected.length
            ? `Continue with ${selected.length} group${selected.length > 1 ? "s" : ""}`
            : "Skip for now"}
        </Button>
      </div>
    </div>
  );
}
