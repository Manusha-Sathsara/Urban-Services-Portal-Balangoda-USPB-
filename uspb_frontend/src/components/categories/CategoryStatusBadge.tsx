interface CategoryStatusBadgeProps {
  status: "active" | "inactive" | string;
  className?: string;
}

export function CategoryStatusBadge({
  status,
  className = "",
}: CategoryStatusBadgeProps) {
  const isActive = status?.toLowerCase() === "active";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide transition-colors ${
        isActive
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
          : "bg-amber-50 text-amber-700 border border-amber-200/80"
      } ${className}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isActive ? "bg-emerald-500" : "bg-amber-500"
        }`}
        aria-hidden="true"
      />
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

export default CategoryStatusBadge;
