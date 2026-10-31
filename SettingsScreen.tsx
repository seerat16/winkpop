import { useState, useRef } from "react";
import { useNavigate } from "../router";
import {
  ArrowLeft, ChevronRight, User, Lock, MapPin, CreditCard,
  Bell, Globe, FileText, Shield, LogOut, Trash2, Eye, EyeOff, Check, X, Camera
} from "lucide-react";
import { toast } from "sonner";
import { getCurrentUser, updateCurrentUser, clearSession } from "../data/userStore";

type Section = "main" | "profile" | "password" | "address" | "payment";

export default function SettingsScreen() {
  const navigate = useNavigate();
  const [section, setSection] = useState<Section>("main");

  const currentUser = getCurrentUser();
  
  // If no user is logged in, redirect to login
  if (!currentUser) {
    navigate("/");
    return null;
  }

  // Profile fields
  const [displayName, setDisplayName] = useState(currentUser.displayName || "");
  const [username, setUsername] = useState(currentUser.username || "");
  const [bio, setBio] = useState(currentUser.bio || "");
  const [email] = useState(currentUser.email || "");
  const [profileSaved, setProfileSaved] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentUser.avatarBase64 || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Password fields
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwError, setPwError] = useState("");

  // Address fields
  const [addrLine1, setAddrLine1] = useState(currentUser.addrLine1 || "");
  const [addrLine2, setAddrLine2] = useState(currentUser.addrLine2 || "");
  const [city, setCity] = useState(currentUser.city || "");
  const [stateRegion, setStateRegion] = useState(currentUser.stateRegion || "");
  const [country, setCountry] = useState(currentUser.country || "");
  const [zip, setZip] = useState(currentUser.zip || "");

  // Payment fields
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [showCvv, setShowCvv] = useState(false);

  const handleLogOut = () => {
    clearSession();
    localStorage.removeItem("barter_following");
    localStorage.removeItem("barter_followers");
    toast("Logged out successfully");
    navigate("/");
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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setAvatarUrl(compressed);
      setAvatarFile(file);
    } catch {
      toast.error("Could not load that image. Try a different one.");
    }
  };

  const handleSaveProfile = () => {
    updateCurrentUser({ displayName, username, bio, avatarBase64: avatarUrl });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
    toast.success("Profile updated!");
  };

  const handleSavePassword = () => {
    setPwError("");
    if (!currentPw || !newPw || !confirmPw) {
      setPwError("Please fill in all fields.");
      return;
    }
    if (currentPw !== currentUser.password) {
      setPwError("Current password is incorrect.");
      return;
    }
    if (newPw !== confirmPw) {
      setPwError("New passwords don't match.");
      return;
    }
    if (newPw.length < 6) {
      setPwError("Password must be at least 6 characters.");
      return;
    }
    
    // Update password through the store (which handles the localStorage update)
    const users = JSON.parse(localStorage.getItem("barter_users") || "{}");
    if (users[currentUser.email]) {
      users[currentUser.email].password = newPw;
      localStorage.setItem("barter_users", JSON.stringify(users));
      toast.success("Password updated!");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setSection("main");
    }
  };

  const handleSaveAddress = () => {
    updateCurrentUser({ addrLine1, addrLine2, city, stateRegion, country, zip });
    toast.success("Address saved!");
    setSection("main");
  };

  const handleSavePayment = () => {
    if (!cardNumber || !cardName || !expiry || !cvv) {
      toast.error("Please fill in all payment fields.");
      return;
    }
    toast.success("Payment info saved!");
    setSection("main");
  };

  const formatCardNumber = (val: string) =>
    val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    return digits.length >= 3 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  };

  const inputStyle = {
    background: "#fff",
    border: "1.5px solid #F0D8E8",
    fontSize: "0.9rem",
    color: "#333",
  };

  const SubHeader = ({ title, onBack }: { title: string; onBack: () => void }) => (
    <div className="flex items-center gap-3 px-4 pt-5 pb-4 flex-shrink-0" style={{ background: "var(--background)" }}>
      <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#fff" }}>
        <ArrowLeft size={18} color="#333" />
      </button>
      <h2 style={{ color: "#2d2d2d" }}>{title}</h2>
    </div>
  );

  // ── Main Settings menu ──────────────────────────────────────────────────
  if (section === "main") {
    const groups = [
      {
        items: [
          { icon: User, label: "Profile Settings", sub: "Display name, username, email", action: () => setSection("profile") },
          { icon: Lock, label: "Password", sub: "Change your password", action: () => setSection("password") },
          { icon: MapPin, label: "Address", sub: "Shipping address", action: () => setSection("address") },
          { icon: CreditCard, label: "Payment Info", sub: "Cards & payment methods", action: () => setSection("payment") },
        ],
      },
      {
        items: [
          { icon: Bell, label: "Notification Settings", sub: null, action: () => toast("Coming soon") },
          { icon: Globe, label: "Language & Currency", sub: "English · USD", action: () => toast("Coming soon") },
        ],
      },
      {
        items: [
          { icon: FileText, label: "Terms of Service", sub: null, action: () => toast("Coming soon") },
          { icon: Shield, label: "Privacy Policy", sub: null, action: () => toast("Coming soon") },
        ],
      },
    ];

    return (
      <div className="flex flex-col min-h-screen" style={{ background: "var(--background)" }}>
        <div className="flex items-center gap-3 px-4 pt-5 pb-4" style={{ background: "var(--background)" }}>
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#fff" }}>
            <ArrowLeft size={18} color="#333" />
          </button>
          <h2 style={{ color: "#2d2d2d" }}>Settings</h2>
        </div>

        {/* User card */}
        <div className="mx-4 mt-3 mb-4 p-4 rounded-2xl flex items-center gap-3" style={{ background: "#fff", border: "1px solid #F0D8E8" }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white overflow-hidden flex-shrink-0" style={{ background: "linear-gradient(135deg, #FFB8D0, #C9A8E0)", fontSize: "1.2rem", fontWeight: 700 }}>
            {currentUser.avatarBase64 ? (
              <img src={currentUser.avatarBase64} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span>{currentUser.displayName?.[0]?.toUpperCase() || "✨"}</span>
            )}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: "#2d2d2d", fontSize: "0.95rem" }}>{currentUser.displayName || "Your Name"}</div>
            <div style={{ fontSize: "0.75rem", color: "#999" }}>@{currentUser.username} · {currentUser.email}</div>
          </div>
        </div>

        <div className="flex flex-col gap-3 px-4 pb-6">
          {groups.map((group, gi) => (
            <div key={gi} className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid #F0D8E8" }}>
              {group.items.map((item, ii) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="flex items-center gap-3 w-full px-4 py-3.5"
                  style={{ borderBottom: ii < group.items.length - 1 ? "1px solid #f5f5f5" : "none" }}
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "var(--background)" }}>
                    <item.icon size={16} color="#D4759A" />
                  </div>
                  <div className="flex-1 text-left">
                    <div style={{ fontSize: "0.88rem", color: "#333", fontWeight: 500 }}>{item.label}</div>
                    {item.sub && <div style={{ fontSize: "0.72rem", color: "#bbb", marginTop: 1 }}>{item.sub}</div>}
                  </div>
                  <ChevronRight size={16} color="#ddd" />
                </button>
              ))}
            </div>
          ))}

          {/* Log out */}
          <button
            onClick={handleLogOut}
            className="flex items-center gap-3 w-full px-4 py-4 rounded-2xl"
            style={{ background: "#fff", border: "1px solid #F0D8E8" }}
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#fff0f0" }}>
              <LogOut size={16} color="#E74C3C" />
            </div>
            <span style={{ fontSize: "0.88rem", color: "#E74C3C", fontWeight: 600 }}>Log Out</span>
            <ChevronRight size={16} color="#ffc0c0" style={{ marginLeft: "auto" }} />
          </button>

          <div style={{ fontSize: "0.72rem", color: "#ccc", textAlign: "center", marginTop: 4 }}>WinK-Pop · Version 1.0.0</div>
        </div>
      </div>
    );
  }

  // ── Profile Settings ────────────────────────────────────────────────────
  if (section === "profile") {
    return (
      <div className="flex flex-col min-h-screen" style={{ background: "var(--background)" }}>
        <SubHeader title="Profile Settings" onBack={() => setSection("main")} />
        <div className="flex-1 px-4 pt-2 pb-28 overflow-y-auto">
          <div className="flex flex-col gap-4">
            {/* Avatar upload */}
            <div className="flex flex-col items-center py-4">
              <div className="relative">
                <div
                  className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center"
                  style={{
                    background: avatarUrl ? "transparent" : "linear-gradient(135deg, #FFB8D0, #C9A8E0)",
                    border: "3px solid #fff",
                    boxShadow: "0 2px 16px rgba(212,117,154,0.25)",
                  }}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span style={{ color: "#fff", fontSize: "2rem", fontWeight: 700 }}>
                      {currentUser.displayName?.[0]?.toUpperCase() || "✨"}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: "#D4759A", boxShadow: "0 2px 8px rgba(212,117,154,0.4)" }}
                >
                  <Camera size={14} color="#fff" />
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              <button
                onClick={() => avatarInputRef.current?.click()}
                style={{ color: "#D4759A", fontSize: "0.78rem", fontWeight: 600, marginTop: 10 }}
              >
                {avatarUrl ? "Change photo" : "Upload profile photo"}
              </button>
              {avatarUrl && (
                <button
                  onClick={() => { setAvatarUrl(null); setAvatarFile(null); }}
                  style={{ color: "#bbb", fontSize: "0.72rem", marginTop: 4 }}
                >
                  Remove photo
                </button>
              )}
            </div>

            <div>
              <label style={{ fontSize: "0.78rem", color: "#666", fontWeight: 600 }}>Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl mt-1.5 outline-none"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: "0.78rem", color: "#666", fontWeight: 600 }}>Username</label>
              <div className="relative mt-1.5">
                <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#bbb" }}>@</span>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value.replace(/\s/g, "").toLowerCase())}
                  className="w-full pl-8 pr-4 py-3 rounded-xl outline-none"
                  style={inputStyle}
                />
              </div>
            </div>
            <div>
              <label style={{ fontSize: "0.78rem", color: "#666", fontWeight: 600 }}>Bio</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Tell others about yourself…"
                rows={3}
                maxLength={150}
                className="w-full px-4 py-3 rounded-xl mt-1.5 outline-none resize-none"
                style={inputStyle}
              />
              <div style={{ fontSize: "0.68rem", color: "#bbb", textAlign: "right", marginTop: 2 }}>{bio.length}/150</div>
            </div>
            <div>
              <label style={{ fontSize: "0.78rem", color: "#666", fontWeight: 600 }}>Email</label>
              <input
                type="email"
                value={email}
                readOnly
                className="w-full px-4 py-3 rounded-xl mt-1.5 outline-none"
                style={inputStyle}
              />
            </div>
            <div className="pt-2">
              <button
                onClick={handleSaveProfile}
                className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2"
                style={{ background: "#D4759A", color: "#fff", fontWeight: 700, fontSize: "0.95rem" }}
              >
                {profileSaved ? <><Check size={16} /> Saved!</> : "Save Changes"}
              </button>
            </div>
            <button
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl"
              style={{ border: "1.5px solid #ffc0c0", color: "#E74C3C", fontSize: "0.85rem", fontWeight: 600 }}
              onClick={() => { clearSession(); localStorage.removeItem("barter_accounts"); toast("Account deleted"); navigate("/"); }}
            >
              <Trash2 size={15} /> Delete Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Password ────────────────────────────────────────────────────────────
  if (section === "password") {
    const PwField = ({ label, value, onChange, show, onToggle, placeholder }: {
      label: string; value: string; onChange: (v: string) => void;
      show: boolean; onToggle: () => void; placeholder: string;
    }) => (
      <div>
        <label style={{ fontSize: "0.78rem", color: "#666", fontWeight: 600 }}>{label}</label>
        <div className="relative mt-1.5">
          <input
            type={show ? "text" : "password"}
            placeholder={placeholder}
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full px-4 pr-12 py-3 rounded-xl outline-none"
            style={inputStyle}
          />
          <button onClick={onToggle} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: "#bbb" }}>
            {show ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
      </div>
    );

    return (
      <div className="flex flex-col min-h-screen" style={{ background: "var(--background)" }}>
        <SubHeader title="Change Password" onBack={() => setSection("main")} />
        <div className="flex-1 px-4 pt-2 pb-28 overflow-y-auto">
          <div className="flex flex-col gap-4">
            <PwField label="Current Password" value={currentPw} onChange={setCurrentPw} show={showCurrent} onToggle={() => setShowCurrent(p => !p)} placeholder="Enter current password" />
            <PwField label="New Password" value={newPw} onChange={setNewPw} show={showNew} onToggle={() => setShowNew(p => !p)} placeholder="At least 6 characters" />
            <PwField label="Confirm New Password" value={confirmPw} onChange={setConfirmPw} show={showConfirm} onToggle={() => setShowConfirm(p => !p)} placeholder="Repeat new password" />
            {pwError && (
              <div className="px-4 py-3 rounded-xl flex items-center gap-2" style={{ background: "#fff0f0", border: "1.5px solid #ffd0d0" }}>
                <X size={14} color="#D4759A" />
                <span style={{ color: "#D4759A", fontSize: "0.82rem" }}>{pwError}</span>
              </div>
            )}
            <button
              onClick={handleSavePassword}
              className="w-full py-3.5 rounded-2xl mt-2"
              style={{ background: "#D4759A", color: "#fff", fontWeight: 700, fontSize: "0.95rem" }}
            >
              Update Password
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Address ─────────────────────────────────────────────────────────────
  if (section === "address") {
    return (
      <div className="flex flex-col min-h-screen" style={{ background: "var(--background)" }}>
        <SubHeader title="Shipping Address" onBack={() => setSection("main")} />
        <div className="flex-1 px-4 pt-2 pb-28 overflow-y-auto">
          <p style={{ fontSize: "0.78rem", color: "#bbb", marginBottom: 16 }}>Used for shipping — never shown publicly</p>
          <div className="flex flex-col gap-3">
            <div>
              <label style={{ fontSize: "0.78rem", color: "#666", fontWeight: 600 }}>Address Line 1 *</label>
              <input type="text" placeholder="Street address" value={addrLine1} onChange={e => setAddrLine1(e.target.value)} className="w-full px-4 py-3 rounded-xl mt-1.5 outline-none" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: "0.78rem", color: "#666", fontWeight: 600 }}>Address Line 2</label>
              <input type="text" placeholder="Apt, suite, unit, floor (optional)" value={addrLine2} onChange={e => setAddrLine2(e.target.value)} className="w-full px-4 py-3 rounded-xl mt-1.5 outline-none" style={inputStyle} />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label style={{ fontSize: "0.78rem", color: "#666", fontWeight: 600 }}>City *</label>
                <input type="text" placeholder="City" value={city} onChange={e => setCity(e.target.value)} className="w-full px-4 py-3 rounded-xl mt-1.5 outline-none" style={inputStyle} />
              </div>
              <div className="flex-1">
                <label style={{ fontSize: "0.78rem", color: "#666", fontWeight: 600 }}>State / Region</label>
                <input type="text" placeholder="State or region" value={stateRegion} onChange={e => setStateRegion(e.target.value)} className="w-full px-4 py-3 rounded-xl mt-1.5 outline-none" style={inputStyle} />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label style={{ fontSize: "0.78rem", color: "#666", fontWeight: 600 }}>Country *</label>
                <input type="text" placeholder="Country" value={country} onChange={e => setCountry(e.target.value)} className="w-full px-4 py-3 rounded-xl mt-1.5 outline-none" style={inputStyle} />
              </div>
              <div style={{ width: 120 }}>
                <label style={{ fontSize: "0.78rem", color: "#666", fontWeight: 600 }}>ZIP / Postal *</label>
                <input type="text" placeholder="ZIP / Postal" value={zip} onChange={e => setZip(e.target.value)} className="w-full px-4 py-3 rounded-xl mt-1.5 outline-none" style={inputStyle} />
              </div>
            </div>
            <button onClick={handleSaveAddress} className="w-full py-3.5 rounded-2xl mt-2" style={{ background: "#D4759A", color: "#fff", fontWeight: 700, fontSize: "0.95rem" }}>
              Save Address
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Payment Info ─────────────────────────────────────────────────────────
  if (section === "payment") {
    return (
      <div className="flex flex-col min-h-screen" style={{ background: "var(--background)" }}>
        <SubHeader title="Payment Info" onBack={() => setSection("main")} />
        <div className="flex-1 px-4 pt-2 pb-28 overflow-y-auto">
          {/* Card preview */}
          <div
            className="w-full rounded-2xl p-5 mb-6"
            style={{
              background: cardNumber
                ? "linear-gradient(135deg, #D4759A, #9B59B6)"
                : "linear-gradient(135deg, #ddd, #bbb)",
              minHeight: 160,
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            }}
          >
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.72rem", marginBottom: 24 }}>Payment Card</div>
            <div style={{ color: "#fff", fontSize: "1.1rem", fontWeight: 700, letterSpacing: 3, fontFamily: "monospace" }}>
              {cardNumber || "•••• •••• •••• ••••"}
            </div>
            <div className="flex justify-between mt-4">
              <div>
                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.6rem" }}>CARD HOLDER</div>
                <div style={{ color: "#fff", fontSize: "0.8rem", fontWeight: 600 }}>{cardName || "YOUR NAME"}</div>
              </div>
              <div>
                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.6rem" }}>EXPIRES</div>
                <div style={{ color: "#fff", fontSize: "0.8rem", fontWeight: 600 }}>{expiry || "MM/YY"}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <label style={{ fontSize: "0.78rem", color: "#666", fontWeight: 600 }}>Card Number</label>
              <input
                type="text"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                className="w-full px-4 py-3 rounded-xl mt-1.5 outline-none"
                style={{ ...inputStyle, fontFamily: "monospace", letterSpacing: 2 }}
              />
            </div>
            <div>
              <label style={{ fontSize: "0.78rem", color: "#666", fontWeight: 600 }}>Name on Card</label>
              <input
                type="text"
                placeholder="As it appears on your card"
                value={cardName}
                onChange={e => setCardName(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 rounded-xl mt-1.5 outline-none"
                style={{ ...inputStyle, textTransform: "uppercase" as any }}
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label style={{ fontSize: "0.78rem", color: "#666", fontWeight: 600 }}>Expiry</label>
                <input
                  type="text"
                  placeholder="MM/YY"
                  value={expiry}
                  onChange={e => setExpiry(formatExpiry(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl mt-1.5 outline-none"
                  style={inputStyle}
                />
              </div>
              <div style={{ width: 120 }}>
                <label style={{ fontSize: "0.78rem", color: "#666", fontWeight: 600 }}>CVV</label>
                <div className="relative mt-1.5">
                  <input
                    type={showCvv ? "text" : "password"}
                    placeholder="•••"
                    value={cvv}
                    onChange={e => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    className="w-full px-4 pr-10 py-3 rounded-xl outline-none"
                    style={inputStyle}
                  />
                  <button onClick={() => setShowCvv(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#bbb" }}>
                    {showCvv ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>
            <p style={{ fontSize: "0.72rem", color: "#bbb" }}>Your payment info is encrypted and stored securely.</p>
            <button onClick={handleSavePayment} className="w-full py-3.5 rounded-2xl mt-1" style={{ background: "#D4759A", color: "#fff", fontWeight: 700, fontSize: "0.95rem" }}>
              Save Payment Info
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}