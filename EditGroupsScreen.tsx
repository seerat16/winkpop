import { useState } from "react";
import { useNavigate } from "../router";
import { Check, ArrowLeft } from "lucide-react";
import { GROUPS_DATA } from "../data/groupData";
import {
  ENTIRE_GROUP_MEMBER_ID,
  getUserProfile,
  saveUserProfile,
} from "../data/userStore";

export default function EditGroupsScreen() {
  const navigate = useNavigate();
  const profile = getUserProfile();

  const [selectedGroups, setSelectedGroups] = useState<string[]>(profile.collectingGroups);
  const [selectedMembers, setSelectedMembers] = useState<Record<string, string[]>>(
    profile.collectingMembers || {},
  );
  const [groupFilter, setGroupFilter] = useState<"all" | "girl" | "boy">("all");

  const toggleGroup = (id: string) => {
    setSelectedGroups(prev => {
      if (!prev.includes(id)) return [...prev, id];
      setSelectedMembers(current => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      return prev.filter(groupId => groupId !== id);
    });
  };

  const toggleMember = (groupId: string, memberId: string) => {
    setSelectedMembers(current => {
      const groupMembers = current[groupId] || [];
      if (memberId === ENTIRE_GROUP_MEMBER_ID) {
        return {
          ...current,
          [groupId]: groupMembers.includes(ENTIRE_GROUP_MEMBER_ID)
            ? []
            : [ENTIRE_GROUP_MEMBER_ID],
        };
      }
      const individualMembers = groupMembers.filter(id => id !== ENTIRE_GROUP_MEMBER_ID);
      return {
        ...current,
        [groupId]: individualMembers.includes(memberId)
          ? individualMembers.filter(id => id !== memberId)
          : [...individualMembers, memberId],
      };
    });
  };

  const handleDone = () => {
    saveUserProfile({
      collectingGroups: selectedGroups,
      collectingMembers: selectedMembers,
    });
    navigate("/profile");
  };

  const filteredGroups = GROUPS_DATA.filter(g =>
    groupFilter === "all" || g.gender === groupFilter
  );

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-4 sticky top-0 z-10" style={{ background: "var(--background)" }}>
        <button
          onClick={() => navigate("/profile")}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "#fff", border: "1.5px solid #F0D8E8" }}
        >
          <ArrowLeft size={18} color="#333" />
        </button>
        <h2 style={{ color: "#2d2d2d", flex: 1 }}>Edit Collecting List</h2>
        <button
          onClick={handleDone}
          className="px-4 py-1.5 rounded-xl"
          style={{ background: "#D4759A", color: "#fff", fontWeight: 700, fontSize: "0.85rem" }}
        >
          Done
        </button>
      </div>

      <div className="px-4 pb-4 flex flex-col flex-1">
        {/* Gender filter */}
        <div className="flex gap-2 mb-3">
          {(["all", "girl", "boy"] as const).map(f => (
            <button
              key={f}
              onClick={() => setGroupFilter(f)}
              className="px-3 py-1.5 rounded-full"
              style={{
                background: groupFilter === f ? "#D4759A" : "#fff",
                color: groupFilter === f ? "#fff" : "#666",
                border: "1.5px solid #F0D8E8",
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

        <div className="flex flex-col gap-2">
          {filteredGroups.map(g => {
            const selected = selectedGroups.includes(g.id);
            return (
              <div
                key={g.id}
                className="rounded-2xl px-4 py-3"
                style={{
                  background: selected ? `${g.color}12` : "#fff",
                  border: `2px solid ${selected ? g.color : "#F0D8E8"}`,
                }}
              >
                <button
                  onClick={() => toggleGroup(g.id)}
                  className="flex w-full items-center gap-3"
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: g.color, fontSize: "0.55rem", color: "#fff", fontWeight: 700 }}
                  >
                    {g.abbr.slice(0, 4)}
                  </div>
                  <div className="flex-1 text-left">
                    <div style={{ color: "#2d2d2d", fontWeight: 600, fontSize: "0.88rem" }}>{g.name}</div>
                    {selected && (
                      <div style={{ color: "#999", fontSize: "0.7rem", marginTop: 2 }}>
                        {(selectedMembers[g.id] || []).includes(ENTIRE_GROUP_MEMBER_ID)
                          ? "Full group selected"
                          : `${(selectedMembers[g.id] || []).length} idol${
                              (selectedMembers[g.id] || []).length === 1 ? "" : "s"
                            } selected`}
                      </div>
                    )}
                  </div>
                  {selected && <Check size={16} color={g.color} />}
                </button>

                {selected && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => toggleMember(g.id, ENTIRE_GROUP_MEMBER_ID)}
                      className="rounded-full px-3 py-1.5"
                      style={{
                        background: (selectedMembers[g.id] || []).includes(ENTIRE_GROUP_MEMBER_ID)
                          ? g.color
                          : "var(--background)",
                        color: (selectedMembers[g.id] || []).includes(ENTIRE_GROUP_MEMBER_ID)
                          ? "#fff"
                          : "var(--foreground)",
                        border: `1px solid ${
                          (selectedMembers[g.id] || []).includes(ENTIRE_GROUP_MEMBER_ID)
                            ? g.color
                            : "var(--border)"
                        }`,
                        fontSize: "0.72rem",
                        fontWeight: 600,
                      }}
                    >
                      Full group
                    </button>
                    {g.members.filter(member => !member.former).map(member => {
                      const memberSelected = (selectedMembers[g.id] || []).includes(member.id);
                      return (
                        <button
                          key={member.id}
                          onClick={() => toggleMember(g.id, member.id)}
                          className="rounded-full px-3 py-1.5"
                          style={{
                            background: memberSelected ? g.color : "var(--background)",
                            color: memberSelected ? "#fff" : "var(--foreground)",
                            border: `1px solid ${memberSelected ? g.color : "var(--border)"}`,
                            fontSize: "0.72rem",
                            fontWeight: 600,
                          }}
                        >
                          {member.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
