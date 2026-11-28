/** WinKPop logo — the winking eye + wordmark, as inline SVG (crisp at any size). */
export function Logo({
  size = 120,
  showWordmark = true,
}: {
  size?: number;
  showWordmark?: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <svg width={size * 0.95} height={size * 0.45} viewBox="0 0 210 100" aria-label="WinKPop logo">
        {/* open winking eye (left) */}
        <ellipse cx="55" cy="55" rx="34" ry="42" fill="#2D2D2D" />
        <circle cx="44" cy="40" r="9" fill="#fff" />
        <path
          d="M55 72c-12-8-20-15-20-24 0-6 5-10 10-10 4 0 7 2 10 6 3-4 6-6 10-6 5 0 10 4 10 10 0 9-8 16-20 24z"
          fill="#C9A8E0"
        />
        <path
          d="M24 22l6 14M38 14l3 15M54 12l0 15"
          stroke="#2D2D2D"
          strokeWidth={3}
          strokeLinecap="round"
        />
        {/* winking brow (right) */}
        <path
          d="M120 52c18-14 46-16 70-4-6 10-20 16-34 15 6 3 11 8 13 14-10-4-18-11-22-19-9 1-18 1-27-6z"
          fill="#2D2D2D"
        />
      </svg>
      {showWordmark && (
        <span
          className="font-display font-extrabold text-wink-ink"
          style={{ fontSize: size * 0.28, marginTop: size * 0.03 }}
        >
          winkpop
        </span>
      )}
    </div>
  );
}
