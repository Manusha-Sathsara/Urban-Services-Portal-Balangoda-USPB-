interface SchoolStatusBadgeProps {
  status: "active" | "inactive";
  className?: string;
}

export function SchoolStatusBadge({
  status,
  className = "",
}: SchoolStatusBadgeProps) {
  const isActive = status === "active";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider border ${
        isActive
          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
          : "bg-[#f0e6e5] text-[#8a5a58] border-[#dcc6c4]"
      } ${className}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isActive ? "bg-emerald-500 animate-pulse" : "bg-[#8a5a58]"
        }`}
        aria-hidden="true"
      />
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

export default SchoolStatusBadge;
