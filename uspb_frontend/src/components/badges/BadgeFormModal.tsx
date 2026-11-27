"use client";

import { useEffect, useState } from "react";
import { BadgeDefinition, CreateBadgeDto, UpdateBadgeDto } from "@/types";
import { AVAILABLE_BADGE_ICONS, BadgeIconHelper } from "./BadgeIconHelper";
import { X, AlertCircle, Info, Sparkles } from "lucide-react";

interface BadgeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitCreate: (dto: CreateBadgeDto) => Promise<void>;
  onSubmitUpdate: (id: number, dto: UpdateBadgeDto) => Promise<void>;
  badgeToEdit: BadgeDefinition | null;
  isSubmitting: boolean;
}

export function BadgeFormModal({
  isOpen,
  onClose,
  onSubmitCreate,
  onSubmitUpdate,
  badgeToEdit,
  isSubmitting,
}: BadgeFormModalProps) {
  const isEdit = Boolean(badgeToEdit);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [iconName, setIconName] = useState("Award");
  const [threshold, setThreshold] = useState<string>("50");
  const [metric, setMetric] = useState<"lifetime_earned" | "available_points">("lifetime_earned");
  const [status, setStatus] = useState<"active" | "inactive">("active");

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (badgeToEdit) {
      setName(badgeToEdit.name);
      setDescription(badgeToEdit.description || "");
      setIconName(badgeToEdit.icon_name || "Award");
      setThreshold(badgeToEdit.milestone_threshold.toString());
      setMetric(badgeToEdit.eligibility_metric);
      setStatus(badgeToEdit.status);
    } else {
      setName("");
      setDescription("");
      setIconName("Award");
      setThreshold("50");
      setMetric("lifetime_earned");
      setStatus("active");
    }
    setFormErrors({});
  }, [badgeToEdit, isOpen]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    const trimmedName = name.trim();
    if (!trimmedName) {
      errors.name = "Badge name is required.";
    } else if (trimmedName.length < 2) {
      errors.name = "Badge name must be at least 2 characters.";
    } else if (trimmedName.length > 100) {
      errors.name = "Badge name cannot exceed 100 characters.";
    }

    if (!isEdit) {
      const thNum = parseFloat(threshold);
      if (isNaN(thNum) || thNum <= 0) {
        errors.threshold = "Milestone threshold must be a positive number greater than 0.";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (isEdit && badgeToEdit) {
      const updateDto: UpdateBadgeDto = {
        name: name.trim(),
        description: description.trim(),
        icon_name: iconName,
        status,
      };
      await onSubmitUpdate(badgeToEdit.id, updateDto);
    } else {
      const createDto: CreateBadgeDto = {
        name: name.trim(),
        description: description.trim(),
        icon_name: iconName,
        milestone_threshold: parseFloat(threshold),
        eligibility_metric: metric,
        status,
      };
      await onSubmitCreate(createDto);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="badge-modal-title"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div>
            <h2 id="badge-modal-title" className="text-lg font-bold text-stone-900">
              {isEdit ? "Edit Badge Definition" : "Register New Badge Definition"}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              {isEdit
                ? "Update badge visual representation and details."
                : "Configure a new milestone honor in the Balangoda school rewards programme."}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Badge Name */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Badge Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Eco-Sprout, Waste Warrior, Recycling Champion"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: "" }));
              }}
              className={`w-full rounded-lg border px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 transition-colors ${
                formErrors.name
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : "border-stone-300 focus:border-[#800000] focus:ring-[#800000]"
              }`}
            />
            {formErrors.name && (
              <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                <AlertCircle className="h-3 w-3" /> {formErrors.name}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Description & Merit Criteria
            </label>
            <textarea
              rows={2}
              placeholder="Explain the environmental significance of this achievement..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#800000] focus:outline-none focus:ring-1 focus:ring-[#800000] transition-colors resize-none"
            />
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Badge Insignia / Icon <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {AVAILABLE_BADGE_ICONS.map((item) => {
                const isSelected = iconName === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setIconName(item.name)}
                    className={`flex items-center gap-2 rounded-lg border p-2 text-xs transition-colors cursor-pointer text-left ${
                      isSelected
                        ? "border-[#800000] bg-red-50/50 text-[#800000] font-semibold"
                        : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                    }`}
                  >
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-md ${
                        isSelected
                          ? "bg-[#800000] text-white"
                          : "bg-stone-100 text-stone-600"
                      }`}
                    >
                      <item.icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="truncate">{item.label.split("/")[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Milestone Threshold */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              {isEdit ? "Current Milestone Threshold" : "Milestone Threshold (Points)"}{" "}
              <span className="text-red-500">*</span>
            </label>
            {isEdit ? (
              <div className="flex items-center justify-between rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-semibold text-stone-800">
                <span>{badgeToEdit?.milestone_threshold.toFixed(0)} points</span>
                <span className="text-xs font-normal text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                  Use Revise Threshold to adjust
                </span>
              </div>
            ) : (
              <div>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    min="1"
                    placeholder="e.g. 100"
                    value={threshold}
                    onChange={(e) => {
                      setThreshold(e.target.value);
                      if (formErrors.threshold) {
                        setFormErrors((prev) => ({ ...prev, threshold: "" }));
                      }
                    }}
                    className={`w-full rounded-lg border px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 transition-colors ${
                      formErrors.threshold
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "border-stone-300 focus:border-[#800000] focus:ring-[#800000]"
                    }`}
                  />
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-stone-400 pointer-events-none">
                    points
                  </span>
                </div>
                {formErrors.threshold && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" /> {formErrors.threshold}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Eligibility Metric */}
          {!isEdit && (
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Eligibility Measurement Basis
              </label>
              <select
                value={metric}
                onChange={(e) => setMetric(e.target.value as "lifetime_earned" | "available_points")}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-[#800000] focus:outline-none focus:ring-1 focus:ring-[#800000] transition-colors"
              >
                <option value="lifetime_earned">
                  Lifetime Earned Points (Recommended — Cumulative historical effort)
                </option>
                <option value="available_points">
                  Available Balance Points (Net of redemptions)
                </option>
              </select>
              <p className="mt-1 text-[11px] text-stone-500 flex items-center gap-1">
                <Info className="h-3 w-3 text-stone-400" />
                Council policy evaluates cumulative student commitment over time.
              </p>
            </div>
          )}

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Operational Status
            </label>
            <div className="flex gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-stone-800">
                <input
                  type="radio"
                  name="status"
                  value="active"
                  checked={status === "active"}
                  onChange={() => setStatus("active")}
                  className="text-[#800000] focus:ring-[#800000]"
                />
                <span className="text-emerald-700 font-medium">Active</span>
                <span className="text-xs text-stone-400">(Available for awards)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-sm text-stone-800">
                <input
                  type="radio"
                  name="status"
                  value="inactive"
                  checked={status === "inactive"}
                  onChange={() => setStatus("inactive")}
                  className="text-[#800000] focus:ring-[#800000]"
                />
                <span className="text-amber-700 font-medium">Inactive</span>
                <span className="text-xs text-stone-400">(Paused / Deprecated)</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-stone-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-stone-200 px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#800000] px-4 py-2 text-xs font-semibold text-white hover:bg-[#660000] disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : isEdit ? (
                "Save Changes"
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Register Badge
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BadgeFormModal;
