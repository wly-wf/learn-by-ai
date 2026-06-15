export function Titlebar() {
  return (
    <div
      className="flex items-center h-[32px] px-3 flex-shrink-0 select-none"
      style={{
        background: "var(--bg-sidebar)",
        backdropFilter: "blur(20px)",
        borderBottom: "0.5px solid var(--border-subtle)",
      }}
    >
      <span className="text-[12px] font-medium" style={{ color: "var(--text-secondary)" }}>
        LearnByAI
      </span>
    </div>
  );
}
