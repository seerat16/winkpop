import { useState } from "react";
import { useNavigate } from "../router";
import { Eye, EyeOff, ArrowLeft, Check, UserPlus } from "lucide-react";

const MOCK_FOLLOWING = [
  { username: "jungkookstan_official", name: "JK Stan 💜", avatar: "🌸", mutualOn: true, groups: ["BTS", "TXT"] },
  { username: "kpop.treasures", name: "kpop treasures", avatar: "⭐", mutualOn: true, groups: ["aespa", "IVE"] },
  { username: "twice.world", name: "TWICE World", avatar: "🎀", mutualOn: false, groups: ["TWICE"] },
  { username: "blinkforever99", name: "blink forever 🖤💗", avatar: "🌷", mutualOn: true, groups: ["BLACKPINK"] },
  { username: "nct_dream_daily", name: "NCT Dream Daily", avatar: "🦋", mutualOn: false, groups: ["NCT"] },
  { username: "straykids_skz", name: "skz collector", avatar: "🌙", mutualOn: true, groups: ["Stray Kids"] },
  { username: "svt_collector", name: "SVT Carat 💎", avatar: "✨", mutualOn: true, groups: ["SEVENTEEN"] },
  { username: "newjeans.bunnies", name: "NJ Bunnies", avatar: "🐰", mutualOn: false, groups: ["NewJeans"] },
  { username: "idol.photocards", name: "idol photocards", avatar: "💫", mutualOn: true, groups: ["BTS", "aespa", "IVE"] },
  { username: "kpop_collector_us", name: "US Kpop Collector", avatar: "🎵", mutualOn: true, groups: ["BLACKPINK", "TWICE"] },
];

const MOCK_FOLLOWERS = [
  { username: "bias.wrecker", name: "bias wrecker 💘", avatar: "💜", mutualOn: true, groups: ["BTS"] },
  { username: "photocard.addict", name: "photocard addict", avatar: "🃏", mutualOn: false, groups: ["aespa"] },
  { username: "haechan.daily", name: "haechan daily ☀️", avatar: "☀️", mutualOn: true, groups: ["NCT"] },
  { username: "kpop_trades_only", name: "kpop trades only", avatar: "🔄", mutualOn: true, groups: ["BTS", "BLACKPINK"] },
  { username: "ive.love", name: "IVE lover 💙", avatar: "💙", mutualOn: false, groups: ["IVE"] },
];

type Screen = "login" | "connecting" | "mutuals";

export default function InstagramLoginScreen() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [screen, setScreen] = useState<Screen>("login");
  const [progress, setProgress] = useState(0);
  const [followed, setFollowed] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"mutuals" | "following" | "followers">("mutuals");

  const handleLogin = () => {
    if (!username || !password) return;
    setScreen("connecting");

    // Simulate connecting + scanning
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 18 + 5;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setTimeout(() => setScreen("mutuals"), 400);
      }
      setProgress(Math.min(p, 100));
    }, 180);
  };

  const toggleFollow = (u: string) => {
    setFollowed(prev => prev.includes(u) ? prev.filter(x => x !== u) : [...prev, u]);
  };

  const mutuals = [...MOCK_FOLLOWING, ...MOCK_FOLLOWERS].filter(u => u.mutualOn);
  const onApp = mutuals.filter((u, i, arr) => arr.findIndex(x => x.username === u.username) === i);

  const displayList =
    activeTab === "mutuals" ? onApp :
    activeTab === "following" ? MOCK_FOLLOWING :
    MOCK_FOLLOWERS;

  if (screen === "connecting") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8" style={{ background: "var(--background)" }}>
        <div className="mb-8 text-center">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "linear-gradient(135deg, #E1306C, #833AB4, #FCAF45)", fontSize: "2.2rem" }}
          >
            📸
          </div>
          <h2 style={{ color: "#2d2d2d" }}>Connecting to Instagram</h2>
          <p style={{ color: "#999", fontSize: "0.83rem", marginTop: 6 }}>
            Scanning @{username}'s network to find your mutuals on BARTER
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full rounded-full overflow-hidden mb-4" style={{ height: 6, background: "#F0D8E8" }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #E1306C, #833AB4)",
            }}
          />
        </div>

        {/* Steps */}
        <div className="w-full space-y-3">
          {[
            { label: "Verifying Instagram credentials", done: progress > 20 },
            { label: "Loading your following list", done: progress > 45 },
            { label: "Loading your followers", done: progress > 65 },
            { label: "Finding mutuals on BARTER", done: progress > 85 },
            { label: "Matching photocard interests", done: progress >= 100 },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: step.done ? "#27AE60" : "#F0D8E8",
                  transition: "background 0.3s",
                }}
              >
                {step.done && <Check size={11} color="#fff" strokeWidth={3} />}
              </div>
              <span style={{ fontSize: "0.82rem", color: step.done ? "#333" : "#bbb", transition: "color 0.3s" }}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (screen === "mutuals") {
    const followedCount = followed.length;
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "var(--background)" }}>
        <div className="px-4 pt-6 pb-0">
          {/* Header */}
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #E1306C, #833AB4)", fontSize: "1.2rem" }}
            >
              📸
            </div>
            <div>
              <div style={{ fontWeight: 700, color: "#2d2d2d", fontSize: "0.95rem" }}>
                Connected as @{username}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#27AE60", fontWeight: 600 }}>
                ✓ {onApp.length} Instagram mutuals found on BARTER
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 mb-0" style={{ background: "#F5E5EE", borderRadius: 12, padding: 4 }}>
            {([
              { id: "mutuals", label: `Mutuals (${onApp.length})` },
              { id: "following", label: `Following (${MOCK_FOLLOWING.length})` },
              { id: "followers", label: `Followers (${MOCK_FOLLOWERS.length})` },
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 py-2 rounded-lg"
                style={{
                  background: activeTab === tab.id ? "#fff" : "transparent",
                  color: activeTab === tab.id ? "#D4759A" : "#999",
                  fontSize: "0.72rem", fontWeight: 600,
                  boxShadow: activeTab === tab.id ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Explanation banner */}
        {activeTab === "mutuals" && (
          <div className="mx-4 mt-3 px-4 py-3 rounded-2xl" style={{ background: "#FFF0F7", border: "1px solid #fdd" }}>
            <p style={{ fontSize: "0.78rem", color: "#D4759A", lineHeight: 1.5 }}>
              🎉 These Instagram mutuals are already on BARTER! Follow them to see their likes and trade with them directly.
            </p>
          </div>
        )}
        {activeTab === "following" && (
          <div className="mx-4 mt-3 px-4 py-3 rounded-2xl" style={{ background: "#f0fff4", border: "1px solid #c3e6cb" }}>
            <p style={{ fontSize: "0.78rem", color: "#27AE60", lineHeight: 1.5 }}>
              💌 People you follow on Instagram. We'll notify them when you join BARTER so you can trade!
            </p>
          </div>
        )}
        {activeTab === "followers" && (
          <div className="mx-4 mt-3 px-4 py-3 rounded-2xl" style={{ background: "#fff8e1", border: "1px solid #ffe082" }}>
            <p style={{ fontSize: "0.78rem", color: "#7d6608", lineHeight: 1.5 }}>
              👥 Your Instagram followers. Those already on BARTER are marked.
            </p>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 pt-3 pb-28">
          <div className="flex flex-col gap-2">
            {displayList.map(user => {
              const isFollowed = followed.includes(user.username);
              const alreadyOnApp = user.mutualOn;
              return (
                <div
                  key={user.username}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                  style={{ background: "#fff", border: "1px solid #F0D8E8" }}
                >
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: alreadyOnApp
                        ? "linear-gradient(135deg, #FFF0F7, #FFD8EB)"
                        : "#f5f5f5",
                      fontSize: "1.4rem",
                      border: alreadyOnApp ? "2px solid #D4759A" : "2px solid transparent",
                    }}
                  >
                    {user.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span style={{ fontWeight: 600, color: "#2d2d2d", fontSize: "0.85rem" }}>
                        @{user.username}
                      </span>
                      {alreadyOnApp && (
                        <span
                          className="px-1.5 py-0.5 rounded"
                          style={{ background: "#D4759A", color: "#fff", fontSize: "0.58rem", fontWeight: 700 }}
                        >
                          ON BARTER
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "#999", marginTop: 1 }}>
                      {user.name}
                    </div>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {user.groups.map(g => (
                        <span
                          key={g}
                          className="px-1.5 py-0.5 rounded"
                          style={{ background: "#f5f5f5", color: "#888", fontSize: "0.6rem", fontWeight: 500 }}
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                  {alreadyOnApp ? (
                    <button
                      onClick={() => toggleFollow(user.username)}
                      className="flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-xl transition-all"
                      style={{
                        background: isFollowed ? "#f0fff4" : "#D4759A",
                        color: isFollowed ? "#27AE60" : "#fff",
                        border: isFollowed ? "1.5px solid #27AE60" : "none",
                        fontSize: "0.75rem", fontWeight: 700,
                      }}
                    >
                      {isFollowed ? (
                        <><Check size={12} /> Following</>
                      ) : (
                        <><UserPlus size={12} /> Follow</>
                      )}
                    </button>
                  ) : (
                    <span style={{ fontSize: "0.72rem", color: "#ccc", fontStyle: "italic" }}>
                      Not on app
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <div
          className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-4 py-4"
          style={{ background: "linear-gradient(transparent, var(--background) 25%)" }}
        >
          {followedCount > 0 && (
            <div className="text-center mb-2" style={{ fontSize: "0.78rem", color: "#999" }}>
              Following <span style={{ color: "#D4759A", fontWeight: 700 }}>{followedCount}</span> mutual{followedCount !== 1 ? "s" : ""}
            </div>
          )}
          <button
            onClick={() => navigate("/onboarding")}
            className="w-full py-3.5 rounded-xl"
            style={{ background: "#D4759A", color: "#fff", fontWeight: 700, fontSize: "0.95rem" }}
          >
            {followedCount > 0 ? `Continue with ${followedCount} friend${followedCount !== 1 ? "s" : ""} →` : "Continue to BARTER →"}
          </button>
        </div>
      </div>
    );
  }

  // Login form
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--background)" }}>
      <div className="px-4 pt-5">
        <button onClick={() => navigate("/")} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#fff" }}>
          <ArrowLeft size={18} color="#333" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center px-6 pt-8 max-w-md mx-auto w-full">
        {/* Instagram gradient logo */}
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
          style={{ background: "linear-gradient(135deg, #FCAF45 0%, #E1306C 50%, #833AB4 100%)", fontSize: "2.5rem", boxShadow: "0 8px 24px rgba(225,48,108,0.3)" }}
        >
          📸
        </div>

        <h2 style={{ color: "#2d2d2d", marginBottom: 4 }}>Log in with Instagram</h2>
        <p style={{ color: "#999", fontSize: "0.82rem", marginBottom: 8, textAlign: "center" }}>
          Connect your Instagram account to discover mutuals already on BARTER
        </p>

        {/* What we access */}
        <div className="w-full p-4 rounded-2xl mb-6" style={{ background: "#fff", border: "1px solid #F0D8E8" }}>
          <div style={{ fontSize: "0.78rem", color: "#999", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            BARTER will access
          </div>
          {[
            { icon: "👥", text: "Your following list (to find friends on BARTER)" },
            { icon: "🔔", text: "Your followers (to notify them you joined)" },
            { icon: "🚫", text: "We will NEVER post to your Instagram" },
            { icon: "🔒", text: "We NEVER store your Instagram password" },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2 mb-2">
              <span style={{ fontSize: "0.9rem", flexShrink: 0 }}>{item.icon}</span>
              <span style={{ fontSize: "0.78rem", color: item.text.startsWith("We") ? "#27AE60" : "#555", lineHeight: 1.4 }}>
                {item.text}
              </span>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="w-full space-y-3">
          <div>
            <label style={{ fontSize: "0.78rem", color: "#666", fontWeight: 600 }}>Instagram Username</label>
            <div className="flex items-center gap-2 mt-1.5 px-4 py-3 rounded-xl" style={{ background: "#fff", border: "1.5px solid #F0D8E8" }}>
              <span style={{ color: "#bbb", fontSize: "0.9rem" }}>@</span>
              <input
                type="text"
                placeholder="your_username"
                value={username}
                onChange={e => setUsername(e.target.value.replace(/^@/, ""))}
                className="flex-1 outline-none bg-transparent"
                style={{ fontSize: "0.9rem", color: "#333" }}
                autoCapitalize="none"
                autoCorrect="off"
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: "0.78rem", color: "#666", fontWeight: 600 }}>Password</label>
            <div className="flex items-center gap-2 mt-1.5 px-4 py-3 rounded-xl" style={{ background: "#fff", border: "1.5px solid #F0D8E8" }}>
              <input
                type={showPw ? "text" : "password"}
                placeholder="Your Instagram password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="flex-1 outline-none bg-transparent"
                style={{ fontSize: "0.9rem", color: "#333" }}
              />
              <button onClick={() => setShowPw(!showPw)}>
                {showPw ? <EyeOff size={16} color="#bbb" /> : <Eye size={16} color="#bbb" />}
              </button>
            </div>
          </div>

          <button
            onClick={handleLogin}
            className="w-full py-3.5 rounded-xl mt-1"
            style={{
              background: username && password
                ? "linear-gradient(135deg, #FCAF45 0%, #E1306C 50%, #833AB4 100%)"
                : "#F0D8E8",
              color: username && password ? "#fff" : "#bbb",
              fontWeight: 700,
              fontSize: "0.95rem",
            }}
          >
            Connect Instagram
          </button>
        </div>

        <p style={{ color: "#ccc", fontSize: "0.72rem", marginTop: 16, textAlign: "center", lineHeight: 1.5 }}>
          Your credentials are only used to authenticate with Instagram and are never stored on BARTER's servers.
        </p>
      </div>
    </div>
  );
}
