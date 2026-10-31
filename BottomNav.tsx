import { useState } from "react";
import { Compass, ArrowLeftRight, Plus, MessageCircle, User, FileText, Tag, X } from "lucide-react";
import { useNavigate, useLocation } from "../router";

const PRIMARY = "#D4759A";

const tabs = [
  { path: "/home", label: "discover" },
  { path: "/transactions", label: "transactions" },
  { path: null, label: "Upload", special: true },
  { path: "/messages", label: "message" },
  { path: "/profile", label: "profile" },
];

const icons = [Compass, ArrowLeftRight, Plus, MessageCircle, User];

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showUploadSheet, setShowUploadSheet] = useState(false);

  return (
    <>
      <nav
        style={{ borderTop: "1px solid #f0e0e0", background: "#fff" }}
        className="fixed bottom-0 left-0 right-0 z-50"
      >
        <div className="w-full max-w-md mx-auto flex items-end">
          {tabs.map(({ path, label, special }, i) => {
            const Icon = icons[i];
            const active = path
              ? location.pathname === path ||
                (path === "/home" && ["/browse", "/likes"].includes(location.pathname)) ||
                (path === "/transactions" && ["/trades", "/my-sales", "/purchases", "/all-tracking"].includes(location.pathname))
              : false;

            if (special) {
              return (
                <button
                  key="upload"
                  onClick={() => setShowUploadSheet(true)}
                  className="flex-1 flex flex-col items-center py-2 gap-0.5"
                >
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, #E880A4 0%, #C9A8E0 60%, #7BBFEA 100%)",
                      boxShadow: "0 2px 12px rgba(212,117,154,0.35)",
                    }}
                  >
                    <Icon size={22} color="#fff" strokeWidth={2.5} />
                  </div>
                  <span style={{ fontSize: "10px", fontWeight: 400, color: "#aaa" }}>{label}</span>
                </button>
              );
            }

            return (
              <button
                key={path}
                onClick={() => path && navigate(path)}
                className="flex-1 flex flex-col items-center py-3 gap-0.5"
                style={{ color: active ? PRIMARY : "#aaa" }}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                <span style={{ fontSize: "10px", fontWeight: active ? 600 : 400 }}>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Upload choice sheet */}
      {showUploadSheet && (
        <div
          className="fixed inset-0 z-[60] flex flex-col justify-end"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => setShowUploadSheet(false)}
        >
          <div
            className="max-w-md w-full mx-auto rounded-t-3xl px-5 pt-5 pb-10"
            style={{ background: "#fff" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: "#e0d0e8" }} />

            <div className="flex items-center justify-between mb-5">
              <span style={{ fontWeight: 700, color: "#2d2d2d", fontSize: "1rem" }}>What would you like to upload?</span>
              <button
                onClick={() => setShowUploadSheet(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "#f5f5f5" }}
              >
                <X size={15} color="#999" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {/* Upload Post */}
              <button
                onClick={() => { setShowUploadSheet(false); navigate("/upload-post"); }}
                className="flex items-center gap-4 p-4 rounded-2xl text-left"
                style={{ background: "#FFF0F7", border: "1.5px solid #F0D8E8" }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #E880A4, #C9A8E0)" }}
                >
                  <FileText size={22} color="#fff" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: "#2d2d2d", fontSize: "0.92rem" }}>Upload Post</div>
                  <div style={{ fontSize: "0.75rem", color: "#aaa", marginTop: 2 }}>
                    Share ISO, DWAYER, collection drops, art & more
                  </div>
                </div>
              </button>

              {/* Upload Listing */}
              <button
                onClick={() => { setShowUploadSheet(false); navigate("/list-card"); }}
                className="flex items-center gap-4 p-4 rounded-2xl text-left"
                style={{ background: "#EDFAF5", border: "1.5px solid #B8EAD8" }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #5CC0A8, #7BBFEA)" }}
                >
                  <Tag size={22} color="#fff" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: "#2d2d2d", fontSize: "0.92rem" }}>Upload Listing</div>
                  <div style={{ fontSize: "0.75rem", color: "#aaa", marginTop: 2 }}>
                    List a photocard for sale or trade
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
