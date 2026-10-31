import { useState, useRef, useEffect } from "react";
import { useNavigate } from "../router";
import { ArrowLeft, Plus, Search, Camera, Upload, Check, X, Image, Grid3x3 } from "lucide-react";
import { PHOTOCARDS, GROUPS } from "../data/mockData";
import { PhotocardImage } from "../components/PhotocardImage";
import { toast } from "sonner";
import { getCurrentUser, addToCollection, removeFromCollection } from "../data/userStore";

export default function CollectionScreen() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [collectionIds, setCollectionIds] = useState<string[]>(currentUser?.collectionIds || []);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [addTab, setAddTab] = useState<"browse" | "photo" | "template">("browse");
  const [query, setQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const result = (() => { try { return JSON.parse(localStorage.getItem("barter_select_result") || "null"); } catch { return null; } })();
    if (result?.mode === "collection" && result.cardIds?.length) {
      localStorage.removeItem("barter_select_result");
      result.cardIds.forEach((id: string) => addToCollection(id));
      const fresh = getCurrentUser();
      setCollectionIds(fresh?.collectionIds || []);
      toast.success(`${result.cardIds.length} card${result.cardIds.length !== 1 ? "s" : ""} added to collection!`);
    }
  }, []);

  const myCards = PHOTOCARDS.filter(c => collectionIds.includes(c.id));

  const addableCards = PHOTOCARDS.filter(c =>
    !collectionIds.includes(c.id) &&
    (selectedGroup === "all" || c.groupId === selectedGroup) &&
    (query === "" || c.memberName.toLowerCase().includes(query.toLowerCase()) || c.era.toLowerCase().includes(query.toLowerCase()))
  );

  const addCard = (id: string) => {
    setCollectionIds(prev => [...prev, id]);
    addToCollection(id);
    toast.success("Added to collection!");
  };

  const removeCard = (id: string) => {
    setCollectionIds(prev => prev.filter(c => c !== id));
    removeFromCollection(id);
    toast.success("Removed from collection!");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex items-center gap-3 px-4 pt-5 pb-4 sticky top-0 z-10" style={{ background: "var(--background)" }}>
        <button onClick={() => navigate("/profile")} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#fff" }}>
          <ArrowLeft size={18} color="#333" />
        </button>
        <h2 style={{ color: "#2d2d2d" }}>My Collection</h2>
        <button
          onClick={() => navigate("/browse-select?mode=collection&return=/collection")}
          className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl"
          style={{ background: "#D4759A", color: "#fff", fontSize: "0.78rem", fontWeight: 600 }}
        >
          <Plus size={14} /> Add Cards
        </button>
      </div>

      <div className="px-4 pb-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "Total Cards", val: myCards.length },
            { label: "Groups", val: new Set(myCards.map(c => c.groupId)).size },
            { label: "Est. Value", val: `$${myCards.reduce((s, c) => s + c.price, 0).toFixed(0)}` },
          ].map(stat => (
            <div key={stat.label} className="p-3 rounded-2xl text-center" style={{ background: "#fff" }}>
              <div style={{ fontWeight: 800, color: "#D4759A", fontSize: "1.1rem" }}>{stat.val}</div>
              <div style={{ fontSize: "0.68rem", color: "#999", marginTop: 1 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Group breakdown */}
        <div className="mb-5">
          <h4 style={{ color: "#2d2d2d", marginBottom: 10 }}>By Group</h4>
          {GROUPS.filter(g => myCards.some(c => c.groupId === g.id)).map(g => {
            const groupCards = myCards.filter(c => c.groupId === g.id);
            return (
              <div key={g.id} className="flex items-center gap-3 py-3" style={{ borderBottom: "1px solid #f5f5f5" }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: g.color }}>
                  <span style={{ color: "#fff", fontSize: "0.55rem", fontWeight: 700 }}>{g.abbr.slice(0, 3)}</span>
                </div>
                <div className="flex-1">
                  <div style={{ fontWeight: 600, color: "#333", fontSize: "0.88rem" }}>{g.name}</div>
                  <div style={{ fontSize: "0.72rem", color: "#999" }}>{groupCards.length} card{groupCards.length !== 1 ? "s" : ""}</div>
                </div>
                <div className="flex gap-1">
                  {groupCards.slice(0, 3).map(c => (
                    <div key={c.id} className="rounded overflow-hidden" style={{ width: 32, height: 44 }}>
                      <PhotocardImage
                        groupId={c.groupId}
                        memberId={c.memberId}
                        memberName={c.memberName}
                        imgSeed={c.imgSeed}
                        className="w-full h-full"
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* All cards grid */}
        <h4 style={{ color: "#2d2d2d", marginBottom: 10 }}>All Cards</h4>
        <div className="grid grid-cols-3 gap-2">
          {myCards.map(card => (
            <button
              key={card.id}
              onClick={() => navigate(`/card/${card.id}`)}
              className="rounded-xl overflow-hidden text-left"
              style={{ background: "#fff", border: "1px solid #F0D8E8" }}
            >
              <PhotocardImage
                groupId={card.groupId}
                memberId={card.memberId}
                memberName={card.memberName}
                imgSeed={card.imgSeed}
                databaseImageFilename={card.databaseImageFilename}
                uploadImageFilename={card.uploadImageFilename}
                className="w-full"
                style={{ aspectRatio: "3/4.5" } as any}
              />
              <div className="p-1.5">
                <div style={{ fontSize: "0.62rem", color: "#D4759A", fontWeight: 600 }}>{card.memberName}</div>
                <div style={{ fontSize: "0.6rem", color: "#999" }}>{card.type}</div>
              </div>
            </button>
          ))}
          <button
            onClick={() => navigate("/browse-select?mode=collection&return=/collection")}
            className="rounded-xl flex flex-col items-center justify-center gap-1"
            style={{ border: "2px dashed #F0D8E8", aspectRatio: "3/4.5", background: "#fff" }}
          >
            <Plus size={20} color="#D4759A" />
            <span style={{ fontSize: "0.65rem", color: "#D4759A", fontWeight: 600 }}>Add</span>
          </button>
        </div>
      </div>

      {/* Add modal — full screen, single scroll container */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          style={{ background: "var(--background)" }}
        >
          <div className="max-w-md mx-auto px-4" style={{ paddingBottom: 90 }}>

            {/* Sticky header */}
            <div
              className="sticky top-0 pt-6 pb-3 z-10"
              style={{ background: "var(--background)" }}
            >
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "#fff", border: "1.5px solid #F0D8E8" }}
                >
                  <ArrowLeft size={16} color="#555" />
                </button>
                <h3 style={{ color: "#2d2d2d" }}>Add to Collection</h3>
              </div>

              {/* Method tabs */}
              <div className="flex gap-2 mb-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                {([
                  { id: "browse", icon: Search, label: "Browse" },
                  { id: "photo", icon: Camera, label: "Photo" },
                  { id: "template", icon: Upload, label: "Template" },
                ] as const).map(t => (
                  <button
                    key={t.id}
                    onClick={() => setAddTab(t.id)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl"
                    style={{
                      background: addTab === t.id ? "#D4759A" : "#f5f5f5",
                      color: addTab === t.id ? "#fff" : "#666",
                      fontSize: "0.78rem", fontWeight: 600,
                    }}
                  >
                    <t.icon size={14} /> {t.label}
                  </button>
                ))}
              </div>

              {addTab === "browse" && (
                <>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-2" style={{ background: "#f0ece8" }}>
                    <Search size={14} color="#ccc" />
                    <input
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      placeholder="Search by member or era..."
                      className="flex-1 outline-none bg-transparent"
                      style={{ fontSize: "0.85rem" }}
                    />
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                    <button
                      onClick={() => setSelectedGroup("all")}
                      className="flex-shrink-0 px-3 py-1 rounded-full"
                      style={{ background: selectedGroup === "all" ? "#D4759A" : "#f5f5f5", color: selectedGroup === "all" ? "#fff" : "#666", fontSize: "0.72rem", fontWeight: 500 }}
                    >
                      All
                    </button>
                    {GROUPS.map(g => (
                      <button
                        key={g.id}
                        onClick={() => setSelectedGroup(g.id)}
                        className="flex-shrink-0 px-3 py-1 rounded-full"
                        style={{ background: selectedGroup === g.id ? g.color : "#f5f5f5", color: selectedGroup === g.id ? "#fff" : "#666", fontSize: "0.72rem", fontWeight: 500 }}
                      >
                        {g.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Content */}
            {addTab === "browse" ? (
              <>
                <p style={{ fontSize: "0.75rem", color: "#999", marginBottom: 10 }}>
                  {addableCards.length} card{addableCards.length !== 1 ? "s" : ""} available
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {addableCards.map(card => (
                    <button
                      key={card.id}
                      onClick={() => addCard(card.id)}
                      className="rounded-xl overflow-hidden relative"
                      style={{ border: `2px solid ${collectionIds.includes(card.id) ? "#5CC0A8" : "#F0D8E8"}` }}
                    >
                      <PhotocardImage
                        groupId={card.groupId}
                        memberId={card.memberId}
                        memberName={card.memberName}
                        imgSeed={card.imgSeed}
                        databaseImageFilename={card.databaseImageFilename}
                        uploadImageFilename={card.uploadImageFilename}
                        className="w-full"
                        style={{ aspectRatio: "3/4.5" } as any}
                      />
                      {collectionIds.includes(card.id) && (
                        <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(39,174,96,0.4)" }}>
                          <Check size={24} color="#fff" strokeWidth={3} />
                        </div>
                      )}
                      <div className="p-1" style={{ background: "#fff" }}>
                        <div style={{ fontSize: "0.6rem", color: "#D4759A", fontWeight: 600 }}>{card.memberName}</div>
                        <div style={{ fontSize: "0.58rem", color: "#aaa" }}>{card.groupName}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : addTab === "photo" ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <Camera size={48} color="#D4759A" strokeWidth={1} />
                <div className="text-center">
                  <div style={{ fontWeight: 600, color: "#333" }}>Upload a Photo</div>
                  <p style={{ fontSize: "0.8rem", color: "#999", marginTop: 4 }}>
                    Take or upload a photo of your cards. Our AI will automatically identify and add them.
                  </p>
                </div>
                <div className="flex flex-col gap-2 w-full max-w-xs">
                  <button 
                    onClick={() => { cameraInputRef.current?.click(); }}
                    className="px-6 py-3 rounded-xl flex items-center justify-center gap-2" 
                    style={{ background: "#D4759A", color: "#fff", fontWeight: 600 }}
                  >
                    <Camera size={18} /> Take Photo
                  </button>
                  <button 
                    onClick={() => { galleryInputRef.current?.click(); }}
                    className="px-6 py-3 rounded-xl flex items-center justify-center gap-2" 
                    style={{ background: "#fff", color: "#D4759A", fontWeight: 600, border: "2px solid #D4759A" }}
                  >
                    <Image size={18} /> Choose from Gallery
                  </button>
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        toast.success("Photo captured! Processing...");
                        // In a real app, this would process the image
                      }
                    }}
                  />
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        toast.success("Photo selected! Processing...");
                        // In a real app, this would process the image
                      }
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <Upload size={48} color="#D4759A" strokeWidth={1} />
                <div className="text-center">
                  <div style={{ fontWeight: 600, color: "#333" }}>Use a Template</div>
                  <p style={{ fontSize: "0.8rem", color: "#999", marginTop: 4 }}>
                    Fill out a template or import from Instagram to bulk-add cards.
                  </p>
                </div>
                <button 
                  onClick={() => toast.info("Template download coming soon!")}
                  className="px-6 py-3 rounded-xl" 
                  style={{ background: "#D4759A", color: "#fff", fontWeight: 600 }}
                >
                  Get Template
                </button>
              </div>
            )}

            {/* Done button */}
            <button
              onClick={() => setShowAddModal(false)}
              className="w-full py-3 rounded-xl mt-6"
              style={{ background: "#D4759A", color: "#fff", fontWeight: 700, fontSize: "0.95rem" }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Method Selection Modal */}
      {showMethodModal && (
        <div className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div 
            className="w-full bg-white rounded-t-3xl px-5 py-6 max-w-md mx-auto"
            style={{ maxHeight: "80vh", overflowY: "auto" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ color: "#2d2d2d", fontWeight: 700 }}>How would you like to add cards?</h3>
              <button 
                onClick={() => setShowMethodModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "#f5f5f5" }}
              >
                <X size={16} color="#999" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {[
                { 
                  icon: Grid3x3, 
                  title: "Select Manually", 
                  desc: "Browse and select from the photocard library",
                  action: () => { setShowMethodModal(false); setAddTab("browse"); setShowAddModal(true); }
                },
                { 
                  icon: Camera, 
                  title: "Take a Photo", 
                  desc: "Use your camera to capture your cards",
                  action: () => { setShowMethodModal(false); cameraInputRef.current?.click(); }
                },
                { 
                  icon: Image, 
                  title: "Select from Camera Roll", 
                  desc: "Choose existing photos from your gallery",
                  action: () => { setShowMethodModal(false); galleryInputRef.current?.click(); }
                },
                { 
                  icon: Upload, 
                  title: "Upload Template", 
                  desc: "Import a bulk template or Instagram list",
                  action: () => { setShowMethodModal(false); setAddTab("template"); setShowAddModal(true); }
                },
              ].map((method, idx) => (
                <button
                  key={idx}
                  onClick={method.action}
                  className="flex items-start gap-4 p-4 rounded-2xl text-left transition-all"
                  style={{ background: "var(--background)", border: "2px solid #F0D8E8" }}
                >
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "#D4759A" }}
                  >
                    <method.icon size={20} color="#fff" />
                  </div>
                  <div className="flex-1">
                    <div style={{ fontWeight: 600, color: "#2d2d2d", fontSize: "0.92rem" }}>{method.title}</div>
                    <div style={{ fontSize: "0.78rem", color: "#999", marginTop: 2 }}>{method.desc}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Hidden file inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  toast.success("Photo captured! Processing...");
                  setTimeout(() => {
                    toast.info("In a real app, AI would identify your cards here");
                  }, 1000);
                }
              }}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  toast.success("Photo selected! Processing...");
                  setTimeout(() => {
                    toast.info("In a real app, AI would identify your cards here");
                  }, 1000);
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}