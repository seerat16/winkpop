/** Map expo-router style hrefs ("/(tabs)/home") onto react-router paths ("/home"). */
export function normalizeHref(href: string): string {
  const out = href.replace(/\/\((?:tabs|auth)\)/g, "");
  return out === "" ? "/" : out;
}
