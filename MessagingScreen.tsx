import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "../router";
import { Search, SquarePen, Send, Plus, X, Check, ArrowLeft } from "lucide-react";
import { Button, SelectField } from "@figma/astraui";
import { getCurrentUser } from "../data/userStore";

const PRIMARY = "#D4759A";
const CONVERSATIONS_KEY = "winkpop_conversations";
type TransactionType = "sale" | "trade" | "purchase";
type MessageCategory = TransactionType | "community";
type MessageSection = "all" | MessageCategory;
type TransactionStatus = "pending" | "completed";

interface Message {
  id: string;
  text: string;
  fromMe: boolean;
  time: string;
  sharedItem?: {
    type: "post" | "listing";
    title: string;
    path: string;
  };
}

interface Conversation {
  id: string;
  name: string;
  username: string;
  isGroup: boolean;
  transactionType: MessageCategory;
  transactionStatus?: TransactionStatus;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  messages: Message[];
}

const INITIAL_CONVOS: Conversation[] = [
  {
    id: "1", name: "Manoj Kharal", username: "manojkharal", isGroup: false,
    transactionType: "sale", transactionStatus: "pending",
    lastMessage: "Active now", time: "now", unread: 1, online: true,
    messages: [{ id: "m1", text: "Hey! Are you still selling the Jimin Proof card?", fromMe: false, time: "10:22 AM" }],
  },
  {
    id: "2", name: "Sirish Jr TheSecond", username: "sirishtheseocnd", isGroup: false,
    transactionType: "trade", transactionStatus: "pending",
    lastMessage: "Active 1h ago", time: "1h", unread: 0, online: false,
    messages: [{ id: "m2", text: "Sure, I can trade!", fromMe: true, time: "9:00 AM" }],
  },
  {
    id: "3", name: "Birsal Basnet", username: "birsalbasnet", isGroup: false,
    transactionType: "purchase", transactionStatus: "completed",
    lastMessage: "Last message", time: "2w", unread: 0, online: false,
    messages: [{ id: "m3", text: "Thanks!", fromMe: false, time: "2w ago" }],
  },
  {
    id: "4", name: "Jay Kharal", username: "jaykharal", isGroup: false,
    transactionType: "sale", transactionStatus: "completed",
    lastMessage: "Active 4h ago", time: "4h", unread: 0, online: false,
    messages: [],
  },
  {
    id: "5", name: "Sanket Kharal", username: "sanketkharal", isGroup: false,
    transactionType: "trade", transactionStatus: "completed",
    lastMessage: "Sent a post", time: "4w", unread: 0, online: false,
    messages: [],
  },
  {
    id: "6", name: "kumark00", username: "kumark00", isGroup: false,
    transactionType: "purchase", transactionStatus: "pending",
    lastMessage: "Active 2h ago", time: "2h", unread: 0, online: true,
    messages: [],
  },
  {
    id: "7", name: "ramik.dhungana", username: "ramikhungana", isGroup: false,
    transactionType: "sale", transactionStatus: "pending",
    lastMessage: "Hope you're doing great ·", time: "5w", unread: 0, online: false,
    messages: [],
  },
  {
    id: "8", name: "viracays0.0m", username: "viracays", isGroup: false,
    transactionType: "community",
    lastMessage: "seen", time: "6w", unread: 0, online: false,
    messages: [],
  },
  {
    id: "9", name: "Susmita Mainali", username: "susmitamainali", isGroup: false,
    transactionType: "community",
    lastMessage: "seen", time: "7w", unread: 0, online: false,
    messages: [],
  },
];

function loadConversations(): Conversation[] {
  try {
    const stored = JSON.parse(localStorage.getItem(CONVERSATIONS_KEY) || "null");
    return Array.isArray(stored) ? stored : INITIAL_CONVOS;
  } catch {
    return INITIAL_CONVOS;
  }
}

const NEW_USERS = [
  { id: "u1", username: "pocaluv", name: "Poca Luv" },
  { id: "u2", username: "kpoptrader99", name: "KPop Trader" },
  { id: "u3", username: "armyshop", name: "Army Shop" },
  { id: "u4", username: "btsonly", name: "BTS Only" },
];

function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  return (
    <div
      className="rounded-full flex items-center justify-center text-white flex-shrink-0"
      style={{ width: size, height: size, background: "linear-gradient(135deg, #FFB8D0, #C9A8E0)", fontSize: size * 0.36, fontWeight: 700 }}
    >
      {name[0]?.toUpperCase()}
    </div>
  );
}

export default function MessagingScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentUser = getCurrentUser();
  const [convos, setConvos] = useState<Conversation[]>(loadConversations);
  const [search, setSearch] = useState("");
  const [messageSection, setMessageSection] = useState<MessageSection>("all");
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>("pending");
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [input, setInput] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newType, setNewType] = useState<"dm" | "group" | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<typeof NEW_USERS>([]);
  const [groupName, setGroupName] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const handoffHandledRef = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConvo?.messages.length]);

  useEffect(() => {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(convos));
  }, [convos]);

  useEffect(() => {
    if (handoffHandledRef.current) return;
    const username = searchParams.get("to");
    const mode = searchParams.get("mode");
    if (!username || !mode) return;
    handoffHandledRef.current = true;

    const existing = convos.find(
      convo => convo.username.toLowerCase() === username.toLowerCase(),
    );
    const requestedCategory = searchParams.get("category");
    const category: MessageCategory =
      requestedCategory === "sale" || requestedCategory === "trade"
        ? requestedCategory
        : "community";
    const baseConversation: Conversation =
      existing ?? {
        id: `handoff-${username.toLowerCase()}`,
        name: username,
        username,
        isGroup: false,
        transactionType: category,
        transactionStatus: category === "community" ? undefined : "pending",
        lastMessage: "",
        time: "now",
        unread: 0,
        online: false,
        messages: [],
      };

    let nextConversation = baseConversation;
    if (mode === "share") {
      const shareType = searchParams.get("shareType") === "post" ? "post" : "listing";
      const shareTitle = searchParams.get("shareTitle") || "Shared item";
      const sharePath = searchParams.get("sharePath") || "/";
      const message: Message = {
        id: `share-${Date.now()}`,
        text: `Shared a ${shareType}`,
        fromMe: true,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        sharedItem: {
          type: shareType,
          title: shareTitle,
          path: sharePath,
        },
      };
      nextConversation = {
        ...baseConversation,
        messages: [...baseConversation.messages, message],
        lastMessage: `Shared a ${shareType}`,
        time: "now",
      };
    } else if (mode === "message") {
      setInput(searchParams.get("draft") || "");
    }

    setConvos(previous =>
      existing
        ? previous.map(conversation =>
            conversation.id === existing.id ? nextConversation : conversation,
          )
        : [nextConversation, ...previous],
    );
    setActiveConvo(nextConversation);
  }, [convos, searchParams]);

  const filtered = convos.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.username.toLowerCase().includes(search.toLowerCase());

    const matchesSection =
      messageSection === "all" || c.transactionType === messageSection;
    const matchesStatus =
      messageSection === "all" ||
      messageSection === "community" ||
      c.transactionStatus === transactionStatus;

    return matchesSection && matchesStatus && matchesSearch;
  });

  const messageSections: { id: MessageSection; label: string }[] = [
    { id: "all", label: "All" },
    { id: "sale", label: "Sales" },
    { id: "trade", label: "Trades" },
    { id: "purchase", label: "Purchases" },
    { id: "community", label: "Community" },
  ];

  const sendMessage = () => {
    if (!input.trim() || !activeConvo) return;
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const msg: Message = { id: Date.now().toString(), text: input, fromMe: true, time };
    setConvos(prev => prev.map(c => c.id === activeConvo.id ? { ...c, messages: [...c.messages, msg], lastMessage: input, time: "now" } : c));
    setActiveConvo(prev => prev ? { ...prev, messages: [...prev.messages, msg] } : null);
    setInput("");
  };

  const openConvo = (convo: Conversation) => {
    setActiveConvo(convo);
    setConvos(prev => prev.map(c => c.id === convo.id ? { ...c, unread: 0 } : c));
  };

  const createChat = () => {
    if (!selectedUsers.length) return;
    const isGroup = newType === "group" && selectedUsers.length > 1;
    const conversationType: MessageCategory =
      isGroup || messageSection === "all" ? "community" : messageSection;
    const newConvo: Conversation = {
      id: Date.now().toString(),
      name: isGroup ? (groupName || selectedUsers.map(u => u.name).join(", ")) : selectedUsers[0].name,
      username: isGroup ? "" : selectedUsers[0].username,
      isGroup,
      transactionType: conversationType,
      transactionStatus: conversationType === "community" ? undefined : "pending",
      lastMessage: "",
      time: "now",
      unread: 0,
      online: true,
      messages: [],
    };
    setConvos(prev => [newConvo, ...prev]);
    setActiveConvo(newConvo);
    setShowNew(false);
    setNewType(null);
    setSelectedUsers([]);
  };

  // ── CHAT VIEW ──
  if (activeConvo) {
    return (
      <div className="flex flex-col h-screen" style={{ background: "#fff" }}>
        <div className="flex items-center gap-3 px-4 pt-5 pb-3 flex-shrink-0" style={{ background: "#fff", borderBottom: "1px solid #F0D8E8" }}>
          <button onClick={() => setActiveConvo(null)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#FFF0F7" }}>
            <ArrowLeft size={17} color={PRIMARY} />
          </button>
          <Avatar name={activeConvo.name} size={34} />
          <div className="flex-1">
            <div style={{ fontWeight: 600, color: "#2d2d2d", fontSize: "0.9rem" }}>{activeConvo.name}</div>
            {activeConvo.online && <div style={{ fontSize: "0.68rem", color: "#5CC0A8" }}>● Active now</div>}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
          {activeConvo.messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-2" style={{ color: "#ccc" }}>
              <Avatar name={activeConvo.name} size={56} />
              <p style={{ fontSize: "0.85rem", marginTop: 8 }}>Send a message to {activeConvo.name}</p>
            </div>
          )}
          {activeConvo.messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.fromMe ? "justify-end" : "justify-start"}`}>
              <div
                className="px-4 py-2.5 rounded-2xl max-w-xs"
                style={{
                  background: msg.fromMe ? PRIMARY : "#fff",
                  color: msg.fromMe ? "#fff" : "#333",
                  border: msg.fromMe ? "none" : "1px solid #F0D8E8",
                  borderBottomRightRadius: msg.fromMe ? 4 : 16,
                  borderBottomLeftRadius: msg.fromMe ? 16 : 4,
                  fontSize: "0.88rem",
                }}
              >
                {msg.text}
                {msg.sharedItem && (
                  <Button
                    type="button"
                    size="small"
                    variant="neutral"
                    className="mt-md w-full"
                    onClick={() => navigate(msg.sharedItem!.path)}
                  >
                    View {msg.sharedItem.type}: {msg.sharedItem.title}
                  </Button>
                )}
                <div style={{ fontSize: "0.62rem", opacity: 0.65, marginTop: 2, textAlign: msg.fromMe ? "right" : "left" }}>{msg.time}</div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="flex items-center gap-2 px-4 pb-5 pt-3 flex-shrink-0" style={{ background: "#fff", borderTop: "1px solid #F0D8E8" }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
            placeholder="Message..."
            className="flex-1 px-4 py-2.5 rounded-full"
            style={{ border: "1.5px solid #F0D8E8", outline: "none", fontSize: "0.88rem", background: "#fff" }}
          />
          <button onClick={sendMessage} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: input.trim() ? PRIMARY : "#F0D8E8" }}>
            <Send size={16} color="#fff" />
          </button>
        </div>
      </div>
    );
  }

  // ── CONVERSATION LIST ──
  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#fff" }}>
      {/* Header */}
      <div className="px-4 pt-5 pb-3 border-b" style={{ borderColor: "#f5f5f5" }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div style={{ fontWeight: 700, color: "#2d2d2d", fontSize: "1.05rem" }}>@{currentUser?.username || "me"} ▾</div>
          </div>
          <button onClick={() => setShowNew(true)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#FFF0F7" }}>
            <SquarePen size={17} color={PRIMARY} />
          </button>
        </div>

        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: "#F5F5F5" }}>
          <Search size={14} color="#bbb" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="flex-1 outline-none bg-transparent"
            style={{ fontSize: "0.85rem", color: "#555" }}
          />
        </div>
      </div>

      <div className="px-xl pt-lg text-label-sm font-semibold text-foreground">
        Messages
      </div>

      <div className="grid grid-cols-5 gap-xs px-xl py-md" aria-label="Message categories">
        {messageSections.map(section => (
          <Button
            key={section.id}
            type="button"
            size="small"
            variant="neutral"
            className={`w-full min-w-0 px-xs text-video-title ${
              messageSection === section.id
                ? "!bg-accent !text-accent-foreground !border-primary"
                : "!bg-secondary !text-secondary-foreground !border-transparent"
            }`}
            aria-pressed={messageSection === section.id}
            onClick={() => {
              setMessageSection(section.id);
              if (section.id !== "all" && section.id !== "community") {
                setTransactionStatus("pending");
              }
            }}
          >
            {section.label}
          </Button>
        ))}
      </div>

      {messageSection !== "all" && messageSection !== "community" && (
        <div className="px-xl pb-md">
          <SelectField
            label="Filter by status"
            options={[
              { value: "pending", label: "Pending" },
              { value: "completed", label: "Completed" },
            ]}
            value={transactionStatus}
            onChange={status => setTransactionStatus(status as TransactionStatus)}
            className="w-full"
          />
        </div>
      )}

      <div className="px-xl py-md text-label-sm font-semibold text-foreground">
        {messageSection === "all"
          ? "All messages"
          : messageSection === "community"
            ? "Community messages"
            : `${transactionStatus === "pending" ? "Pending" : "Completed"} messages`}
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-xl py-2xl text-center">
            <div className="text-label-sm text-muted-foreground">
              No{" "}
              {messageSection === "all"
                ? ""
                : messageSection === "community"
                  ? "community "
                  : `${transactionStatus} ${messageSection} `}
              messages
              {search ? " matching your search" : ""}.
            </div>
          </div>
        ) : filtered.map(convo => (
          <button
            key={convo.id}
            onClick={() => openConvo(convo)}
            className="flex items-center gap-3 px-4 py-3 w-full"
            style={{ borderBottom: "1px solid #f9f9f9" }}
          >
            <div className="relative">
              <Avatar name={convo.name} size={46} />
              {convo.online && (
                <div className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full" style={{ background: "#5CC0A8", border: "2px solid #fff" }} />
              )}
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center justify-between">
                <span style={{ fontWeight: 600, color: "#2d2d2d", fontSize: "0.9rem" }}>{convo.name}</span>
                <span style={{ fontSize: "0.7rem", color: "#bbb", flexShrink: 0, marginLeft: 8 }}>{convo.time}</span>
              </div>
              <div style={{ fontSize: "0.78rem", color: convo.unread > 0 ? "#555" : "#bbb", marginTop: 1 }} className="line-clamp-1">
                {convo.lastMessage || "No messages yet"}
              </div>
            </div>
            {convo.unread > 0 && (
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: PRIMARY, color: "#fff", fontSize: "0.62rem", fontWeight: 700 }}>
                {convo.unread}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* New chat modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="rounded-t-3xl p-5 max-w-md w-full mx-auto" style={{ background: "#fff", maxHeight: "80vh", overflowY: "auto" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ color: "#2d2d2d" }}>New Message</h3>
              <button onClick={() => { setShowNew(false); setNewType(null); setSelectedUsers([]); }} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#f5f5f5" }}>
                <X size={15} color="#999" />
              </button>
            </div>

            {!newType ? (
              <div className="flex gap-3">
                <button onClick={() => setNewType("dm")} className="flex-1 py-3 rounded-2xl flex flex-col items-center gap-2" style={{ background: "#FFF0F7", border: "2px solid #F0D8E8" }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: PRIMARY }}>
                    <SquarePen size={17} color="#fff" />
                  </div>
                  <span style={{ fontWeight: 600, color: PRIMARY, fontSize: "0.85rem" }}>Direct Message</span>
                </button>
                <button onClick={() => setNewType("group")} className="flex-1 py-3 rounded-2xl flex flex-col items-center gap-2" style={{ background: "#F5F0FF", border: "2px solid #E0D0FF" }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#9B82D4" }}>
                    <Plus size={17} color="#fff" />
                  </div>
                  <span style={{ fontWeight: 600, color: "#9B82D4", fontSize: "0.85rem" }}>Group Chat</span>
                </button>
              </div>
            ) : (
              <div>
                {newType === "group" && (
                  <input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Group name (optional)" className="w-full px-3 py-2.5 rounded-xl mb-3" style={{ border: "1.5px solid #F0D8E8", outline: "none", fontSize: "0.88rem" }} />
                )}
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3" style={{ background: "#F5F5F5" }}>
                  <Search size={14} color="#bbb" />
                  <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search users..." className="flex-1 outline-none bg-transparent" style={{ fontSize: "0.85rem" }} />
                </div>
                {selectedUsers.length > 0 && (
                  <div className="flex gap-2 flex-wrap mb-3">
                    {selectedUsers.map(u => (
                      <div key={u.id} className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: "#FFF0F7", border: "1px solid #F0D8E8" }}>
                        <span style={{ fontSize: "0.75rem", color: PRIMARY }}>@{u.username}</span>
                        <button onClick={() => setSelectedUsers(prev => prev.filter(x => x.id !== u.id))}><X size={11} color="#bbb" /></button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  {NEW_USERS.filter(u => u.username.includes(userSearch.toLowerCase()) || u.name.toLowerCase().includes(userSearch.toLowerCase())).map(u => {
                    const sel = selectedUsers.some(s => s.id === u.id);
                    return (
                      <button key={u.id} onClick={() => setSelectedUsers(prev => sel ? prev.filter(x => x.id !== u.id) : newType === "dm" ? [u] : [...prev, u])} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: sel ? "#FFF0F7" : "transparent" }}>
                        <Avatar name={u.name} size={36} />
                        <div className="flex-1 text-left">
                          <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#2d2d2d" }}>{u.name}</div>
                          <div style={{ fontSize: "0.72rem", color: "#bbb" }}>@{u.username}</div>
                        </div>
                        {sel && <Check size={15} color={PRIMARY} />}
                      </button>
                    );
                  })}
                </div>
                <button onClick={createChat} className="w-full py-3 rounded-2xl mt-4" style={{ background: selectedUsers.length > 0 ? PRIMARY : "#F0D8E8", color: "#fff", fontWeight: 700 }}>
                  {newType === "group" ? "Create Group" : "Open Chat"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
