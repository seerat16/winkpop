import { useState, useRef } from "react";
import { useNavigate } from "../router";
import { Check, Globe, Lock, ArrowLeft, Camera, User, CheckCircle2 } from "lucide-react";
import { GROUPS_DATA } from "../data/groupData";
import { KNOWN_USERS } from "../data/mockData";
import { updateCurrentUser, getCurrentUser, isUsernameTaken, registerUsername } from "../data/userStore";

const STEPS = ["account", "groups", "international", "profile"] as const;
type Step = typeof STEPS[number];

export default function OnboardingScreen() {
  const navigate = useNavigate();
  
  const currentUser = getCurrentUser();
  
  // If no user is logged in, redirect to login
  if (!currentUser) {
    navigate("/");
    return null;
  }

  const [step, setStep] = useState<Step>("account");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [groupFilter, setGroupFilter] = useState<"all" | "girl" | "boy">("all");
  const [international, setInternational] = useState<boolean | null>(null);
  const [following, setFollowing] = useState<string[]>([]);

  // Account setup fields
  const [displayName, setDisplayName] = useState(currentUser.displayName || "");
  const [username, setUsername] = useState(currentUser.username || "");
  const [age, setAge] = useState(currentUser.age || "");
  const [addrLine1, setAddrLine1] = useState(currentUser.addrLine1 || "");
  const [addrLine2, setAddrLine2] = useState(currentUser.addrLine2 || "");
  const [city, setCity] = useState(currentUser.city || "");
  const [stateRegion, setStateRegion] = useState(currentUser.stateRegion || "");
  const [country, setCountry] = useState(currentUser.country || "");
  const [zip, setZip] = useState(currentUser.zip || "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentUser.avatarBase64 || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [accountError, setAccountError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleGroup = (id: string) => {
    setSelectedGroups(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const compressImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const MAX = 400;
        const scale = Math.min(MAX / img.width, MAX / img.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("canvas")); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.75));
      };
      img.onerror = reject;
      img.src = url;
    });

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setAvatarFile(file);
      setAvatarUrl(compressed);
    } catch {
      toast.error("Could not load that image. Try a different one.");
    }
  };

  const next = () => {
    if (step === "account") {
      if (!displayName.trim() || !username.trim() || !age.trim() || !addrLine1.trim() || !city.trim() || !country.trim() || !zip.trim()) {
        setAccountError("Please fill in all required fields to continue.");
        return;
      }
      // Username validation: must be at least 6 characters
      if (username.trim().length < 6) {
        setAccountError("Username must be at least 6 characters long.");
        return;
      }
      const ageNum = parseInt(age, 10);
      if (isNaN(ageNum) || ageNum < 13) {
        setAccountError("You must be at least 13 years old to use BARTER.");
        return;
      }
      if (isUsernameTaken(username.trim())) {
        setAccountError("That username is already taken. Please choose a different one.");
        return;
      }
      setAccountError("");
      setStep("groups");
      return;
    } else if (step === "groups") {
      setStep("international");
    } else if (step === "international") {
      setStep("profile");
    } else {
      // Onboarding complete — commit everything to localStorage
      const doSave = (avatarBase64: string | null) => {
        try {
          const pending = sessionStorage.getItem("barter_pending");
          let email = "";
          if (pending) {
            const parsed = JSON.parse(pending);
            email = parsed.email;
            const accounts = JSON.parse(localStorage.getItem("barter_accounts") || "{}");
            accounts[email] = parsed.password;
            localStorage.setItem("barter_accounts", JSON.stringify(accounts));
            sessionStorage.removeItem("barter_pending");
          }
          updateCurrentUser({
            email,
            displayName,
            username,
            avatarBase64,
            age,
            addrLine1,
            addrLine2,
            city,
            stateRegion,
            country,
            zip,
            collectingGroups: selectedGroups,
            international: international ?? false,
            balance: 0,
            tradeCount: 0,
          });
          registerUsername(username);
          localStorage.setItem("barter_following", JSON.stringify(following));
          localStorage.setItem("barter_followers", JSON.stringify([]));
        } catch {}
        navigate("/home");
      };

      doSave(avatarUrl);
    }
  };

  const back = () => {
    if (step === "account") navigate("/");
    else if (step === "groups") setStep("account");
    else if (step === "international") setStep("groups");
    else if (step === "profile") setStep("international");
  };

  const stepIndex = STEPS.indexOf(step);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--background)" }}>
      <div className="max-w-md mx-auto w-full px-5 py-8 flex flex-col flex-1">
        {/* Top nav */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={back}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "#fff", border: "1.5px solid #F0D8E8" }}
          >
            <ArrowLeft size={16} color="#555" />
          </button>
          <div className="flex gap-2 flex-1">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className="flex-1 h-1 rounded-full"
                style={{ background: i <= stepIndex ? "#D4759A" : "#F5D8E8" }}
              />
            ))}
          </div>
        </div>

        {/* Step 1: Account Setup */}
        {step === "account" && (
          <div className="flex flex-col flex-1">
            <h2 style={{ color: "#2d2d2d", marginBottom: 4 }}>Create your account</h2>
            <p style={{ color: "#999", fontSize: "0.85rem", marginBottom: 24 }}>
              Let's get the basics set up first
            </p>

            {/* Profile photo */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center overflow-hidden"
                  style={{ background: avatarUrl ? "transparent" : "#F0D8E8", border: "3px solid #fff", boxShadow: "0 2px 12px rgba(0,0,0,0.1)" }}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={36} color="#ccc" />
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: "#D4759A", boxShadow: "0 2px 6px rgba(232,98,90,0.4)" }}
                >
                  <Camera size={14} color="#fff" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>
              <span style={{ fontSize: "0.75rem", color: "#bbb", marginTop: 8 }}>
                {avatarUrl ? "Tap to change photo" : "Add a profile photo (optional)"}
              </span>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label style={{ fontSize: "0.78rem", color: "#666", fontWeight: 600 }}>Display Name</label>
                <input
                  type="text"
                  placeholder="How you'll appear to others"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl mt-1.5 outline-none"
                  style={{ background: "#fff", border: "1.5px solid #F0D8E8", fontSize: "0.9rem" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.78rem", color: "#666", fontWeight: 600 }}>Username</label>
                <div className="relative mt-1.5">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#bbb", fontSize: "0.9rem" }}>@</span>
                  <input
                    type="text"
                    placeholder="yourcoolhandle"
                    value={username}
                    onChange={e => setUsername(e.target.value.replace(/\s/g, "").toLowerCase())}
                    className="w-full pl-8 pr-4 py-3 rounded-xl outline-none"
                    style={{ background: "#fff", border: "1.5px solid #F0D8E8", fontSize: "0.9rem" }}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: "0.78rem", color: "#666", fontWeight: 600 }}>Age</label>
                <input
                  type="number"
                  placeholder="Your age"
                  value={age}
                  onChange={e => setAge(e.target.value)}
                  min={13}
                  max={120}
                  className="w-full px-4 py-3 rounded-xl mt-1.5 outline-none"
                  style={{ background: "#fff", border: "1.5px solid #F0D8E8", fontSize: "0.9rem" }}
                />
              </div>

              {/* Address */}
              <div>
                <label style={{ fontSize: "0.78rem", color: "#666", fontWeight: 600 }}>
                  Address <span style={{ color: "#bbb", fontWeight: 400 }}>— used for shipping, never shown publicly</span>
                </label>
                <div className="flex flex-col gap-2 mt-1.5">
                  <input
                    type="text"
                    placeholder="Address line 1 *"
                    value={addrLine1}
                    onChange={e => setAddrLine1(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl outline-none"
                    style={{ background: "#fff", border: "1.5px solid #F0D8E8", fontSize: "0.9rem" }}
                  />
                  <input
                    type="text"
                    placeholder="Apt, suite, unit, floor (optional)"
                    value={addrLine2}
                    onChange={e => setAddrLine2(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl outline-none"
                    style={{ background: "#fff", border: "1.5px solid #F0D8E8", fontSize: "0.9rem" }}
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="City *"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      className="flex-1 px-4 py-3 rounded-xl outline-none"
                      style={{ background: "#fff", border: "1.5px solid #F0D8E8", fontSize: "0.9rem" }}
                    />
                    <input
                      type="text"
                      placeholder="State / Region"
                      value={stateRegion}
                      onChange={e => setStateRegion(e.target.value)}
                      className="flex-1 px-4 py-3 rounded-xl outline-none"
                      style={{ background: "#fff", border: "1.5px solid #F0D8E8", fontSize: "0.9rem" }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Country *"
                      value={country}
                      onChange={e => setCountry(e.target.value)}
                      className="flex-1 px-4 py-3 rounded-xl outline-none"
                      style={{ background: "#fff", border: "1.5px solid #F0D8E8", fontSize: "0.9rem" }}
                    />
                    <input
                      type="text"
                      placeholder="ZIP / Postal code *"
                      value={zip}
                      onChange={e => setZip(e.target.value)}
                      className="w-32 px-4 py-3 rounded-xl outline-none"
                      style={{ background: "#fff", border: "1.5px solid #F0D8E8", fontSize: "0.9rem" }}
                    />
                  </div>
                </div>
              </div>

              {accountError && (
                <div className="px-4 py-3 rounded-xl" style={{ background: "#fff0f0", border: "1.5px solid #ffd0d0" }}>
                  <p style={{ color: "#D4759A", fontSize: "0.82rem" }}>{accountError}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Groups */}
        {step === "groups" && (
          <>
            <h2 style={{ color: "#2d2d2d", marginBottom: 4 }}>Which groups do you collect?</h2>
            <p style={{ color: "#999", fontSize: "0.85rem", marginBottom: 12 }}>
              Select all that apply — you can change this later
            </p>

            {/* GG / BG filter */}
            <div className="flex gap-2 mb-3">
              {(["all", "girl", "boy"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setGroupFilter(f)}
                  className="px-3 py-1.5 rounded-full"
                  style={{
                    background: groupFilter === f ? "#D4759A" : "#f0f0f0",
                    color: groupFilter === f ? "#fff" : "#666",
                    fontSize: "0.75rem", fontWeight: 600,
                  }}
                >
                  {f === "all" ? "All" : f === "girl" ? "Girl Groups" : "Boy Groups"}
                </button>
              ))}
              {selectedGroups.length > 0 && (
                <span className="ml-auto px-2.5 py-1 rounded-full self-center" style={{ background: "#D4759A", color: "#fff", fontSize: "0.7rem", fontWeight: 700 }}>
                  {selectedGroups.length} selected
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2 flex-1 overflow-y-auto" style={{ paddingBottom: 4 }}>
              {GROUPS_DATA.filter(g => groupFilter === "all" || g.gender === groupFilter).map(g => {
                const selected = selectedGroups.includes(g.id);
                return (
                  <button
                    key={g.id}
                    onClick={() => toggleGroup(g.id)}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all flex-shrink-0"
                    style={{
                      background: selected ? `${g.color}12` : "#fff",
                      border: `2px solid ${selected ? g.color : "#F0D8E8"}`,
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: g.color, fontSize: "0.55rem", color: "#fff", fontWeight: 700 }}
                    >
                      {g.abbr.slice(0, 4)}
                    </div>
                    <div className="flex-1 text-left">
                      <div style={{ color: "#2d2d2d", fontWeight: 600, fontSize: "0.88rem" }}>{g.name}</div>
                    </div>
                    {selected && <Check size={16} color={g.color} />}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Step 3: International */}
        {step === "international" && (
          <>
            <h2 style={{ color: "#2d2d2d", marginBottom: 6 }}>International trading?</h2>
            <p style={{ color: "#999", fontSize: "0.85rem", marginBottom: 24 }}>
              This helps match you with the right traders
            </p>
            <div className="flex flex-col gap-4 flex-1">
              {[
                { val: true, icon: Globe, title: "Yes, I trade internationally", desc: "See listings from traders worldwide" },
                { val: false, icon: Lock, title: "Domestic only", desc: "Only see listings in your country" },
              ].map(opt => (
                <button
                  key={String(opt.val)}
                  onClick={() => setInternational(opt.val)}
                  className="flex items-start gap-4 p-5 rounded-2xl text-left"
                  style={{
                    background: international === opt.val ? "#FFF0F7" : "#fff",
                    border: `2px solid ${international === opt.val ? "#D4759A" : "#F0D8E8"}`,
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center mt-0.5"
                    style={{ background: international === opt.val ? "#D4759A" : "#f5f5f5" }}
                  >
                    <opt.icon size={18} color={international === opt.val ? "#fff" : "#aaa"} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: "#2d2d2d" }}>{opt.title}</div>
                    <div style={{ fontSize: "0.82rem", color: "#999", marginTop: 2 }}>{opt.desc}</div>
                  </div>
                  {international === opt.val && (
                    <Check size={18} style={{ marginLeft: "auto", color: "#D4759A" }} />
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step 4: Suggested collectors */}
        {step === "profile" && (
          <>
            <h2 style={{ color: "#2d2d2d", marginBottom: 4 }}>Suggested collectors</h2>
            <p style={{ color: "#999", fontSize: "0.85rem", marginBottom: 20 }}>
              These users collect the same groups as you
            </p>
            <div className="flex flex-col gap-2 flex-1">
              {KNOWN_USERS.map(u => {
                const isFollowing = following.includes(u.id);
                const userGroups = GROUPS_DATA.filter(g => u.collectingGroups.includes(g.id));
                return (
                  <div
                    key={u.id}
                    className="flex items-center gap-3 p-3 rounded-2xl"
                    style={{ background: "#fff", border: "1px solid #F0D8E8" }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #FFB8D0, #C9A8E0)", color: "#fff", fontWeight: 700, fontSize: "0.85rem" }}
                    >
                      {u.username[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div style={{ fontWeight: 600, color: "#333", fontSize: "0.88rem" }}>@{u.username}</div>
                      <div className="flex gap-1 mt-0.5 flex-wrap">
                        {userGroups.slice(0, 4).map(g => (
                          <span
                            key={g.id}
                            className="px-1.5 py-0.5 rounded-full"
                            style={{ background: `${g.color}18`, color: g.color, fontSize: "0.6rem", fontWeight: 600 }}
                          >
                            {g.abbr}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => setFollowing(prev => isFollowing ? prev.filter(id => id !== u.id) : [...prev, u.id])}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full flex-shrink-0"
                      style={{
                        background: isFollowing ? "#EDFAF5" : "#D4759A",
                        color: isFollowing ? "#5CC0A8" : "#fff",
                        border: isFollowing ? "1.5px solid #5CC0A8" : "none",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                      }}
                    >
                      {isFollowing && <CheckCircle2 size={12} />}
                      {isFollowing ? "Following" : "Follow"}
                    </button>
                  </div>
                );
              })}
            </div>
            <p style={{ fontSize: "0.75rem", color: "#bbb", textAlign: "center", marginTop: 12 }}>
              You can find more collectors after signing up
            </p>
          </>
        )}

        <button
          onClick={next}
          className="w-full py-3.5 rounded-xl mt-6"
          style={{
            background: "#D4759A",
            color: "#fff",
            fontWeight: 700,
            fontSize: "0.95rem",
            opacity: step === "groups" && selectedGroups.length === 0 ? 0.5 : 1,
          }}
        >
          {step === "profile" ? "Start Trading! 🎉" : "Continue"}
        </button>
      </div>
    </div>
  );
}