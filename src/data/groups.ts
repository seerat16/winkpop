import type { Group } from "./types";

/**
 * Seed catalogue of K-pop groups, members, and eras.
 *
 * This stands in for the "photocard database" described in the research docs.
 * It is intentionally a small, representative slice — enough to exercise
 * group → member → era → card-type filtering end to end.
 */
export const GROUPS: Group[] = [
  {
    id: "newjeans",
    name: "NewJeans",
    abbr: "NJ",
    company: "ADOR",
    debutYear: 2022,
    generation: 5,
    gender: "girl",
    color: "#7BBFEA",
    eras: ["Supernatural", "How Sweet", "Get Up", "OMG", "New Jeans"],
    members: [
      { id: "nj-minji", name: "Minji", color: "#6BA8D6" },
      { id: "nj-hanni", name: "Hanni", color: "#E8A0C0" },
      { id: "nj-danielle", name: "Danielle", color: "#F4C06B" },
      { id: "nj-haerin", name: "Haerin", color: "#8ED1B8" },
      { id: "nj-hyein", name: "Hyein", color: "#C9A8E0" },
    ],
  },
  {
    id: "lesserafim",
    name: "LE SSERAFIM",
    abbr: "LSRFM",
    company: "Source Music",
    debutYear: 2022,
    generation: 5,
    gender: "girl",
    color: "#D4759A",
    eras: ["CRAZY", "EASY", "UNFORGIVEN", "ANTIFRAGILE", "FEARLESS"],
    members: [
      { id: "lsrfm-sakura", name: "Sakura", color: "#E880A4" },
      { id: "lsrfm-chaewon", name: "Chaewon", color: "#D4759A" },
      { id: "lsrfm-yunjin", name: "Yunjin", color: "#C9627E" },
      { id: "lsrfm-kazuha", name: "Kazuha", color: "#9AC0E8" },
      { id: "lsrfm-eunchae", name: "Eunchae", color: "#F0A8C0" },
    ],
  },
  {
    id: "ive",
    name: "IVE",
    abbr: "IVE",
    company: "Starship",
    debutYear: 2021,
    generation: 4,
    gender: "girl",
    color: "#C9A8E0",
    eras: ["IVE SWITCH", "I've MINE", "After LIKE", "LOVE DIVE", "ELEVEN"],
    members: [
      { id: "ive-yujin", name: "Yujin", color: "#B890D6" },
      { id: "ive-gaeul", name: "Gaeul", color: "#D4A8E0" },
      { id: "ive-rei", name: "Rei", color: "#E8A0C8" },
      { id: "ive-wonyoung", name: "Wonyoung", color: "#F0B8D0" },
      { id: "ive-liz", name: "Liz", color: "#A8C0E8" },
      { id: "ive-leeseo", name: "Leeseo", color: "#C0E0B8" },
    ],
  },
  {
    id: "stray-kids",
    name: "Stray Kids",
    abbr: "SKZ",
    company: "JYP",
    debutYear: 2018,
    generation: 4,
    gender: "boy",
    color: "#2D2D2D",
    eras: ["ATE", "樂-STAR", "5-STAR", "MAXIDENT", "ODDINARY"],
    members: [
      { id: "skz-bangchan", name: "Bang Chan", color: "#5A5A5A" },
      { id: "skz-leeknow", name: "Lee Know", color: "#7A7A7A" },
      { id: "skz-changbin", name: "Changbin", color: "#3A3A3A" },
      { id: "skz-hyunjin", name: "Hyunjin", color: "#6A6A6A" },
      { id: "skz-han", name: "Han", color: "#8A8A8A" },
      { id: "skz-felix", name: "Felix", color: "#F4C06B" },
      { id: "skz-seungmin", name: "Seungmin", color: "#9AC0E8" },
      { id: "skz-in", name: "I.N", color: "#C9A8E0" },
    ],
  },
  {
    id: "seventeen",
    name: "SEVENTEEN",
    abbr: "SVT",
    company: "Pledis",
    debutYear: 2015,
    generation: 3,
    gender: "boy",
    color: "#5CC0A8",
    eras: ["17 IS RIGHT HERE", "SEVENTEENTH HEAVEN", "FML", "Face the Sun", "Attacca"],
    members: [
      { id: "svt-scoups", name: "S.Coups", color: "#4AB096" },
      { id: "svt-jeonghan", name: "Jeonghan", color: "#6CCFB6" },
      { id: "svt-joshua", name: "Joshua", color: "#8ED1B8" },
      { id: "svt-woozi", name: "Woozi", color: "#5CC0A8" },
      { id: "svt-mingyu", name: "Mingyu", color: "#3A9A82" },
      { id: "svt-dk", name: "DK", color: "#7ABFA8" },
    ],
  },
  {
    id: "twice",
    name: "TWICE",
    abbr: "TWICE",
    company: "JYP",
    debutYear: 2015,
    generation: 3,
    gender: "girl",
    color: "#E880A4",
    eras: ["With YOU-th", "READY TO BE", "BETWEEN 1&2", "Formula of Love", "Fancy You"],
    members: [
      { id: "twice-nayeon", name: "Nayeon", color: "#E880A4" },
      { id: "twice-jeongyeon", name: "Jeongyeon", color: "#C9627E" },
      { id: "twice-momo", name: "Momo", color: "#F0A8C0" },
      { id: "twice-sana", name: "Sana", color: "#E8A0C8" },
      { id: "twice-jihyo", name: "Jihyo", color: "#D4759A" },
      { id: "twice-mina", name: "Mina", color: "#F4C0D4" },
    ],
  },
];

/** O(1) lookup map by group id. */
export const GROUP_MAP: Record<string, Group> = Object.fromEntries(GROUPS.map((g) => [g.id, g]));
