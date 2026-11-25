"use client";

import { useEffect, useState } from "react";
import { CreateCategoryDto, UpdateCategoryDto, WasteCategory } from "@/types";
import { X, AlertCircle, Info, Sparkles } from "lucide-react";

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitCreate: (dto: CreateCategoryDto) => Promise<void>;
  onSubmitUpdate: (id: number, dto: UpdateCategoryDto) => Promise<void>;
  categoryToEdit: WasteCategory | null;
  isSubmitting: boolean;
}

const COMMON_UNITS = [
  { value: "kg", label: "Kilograms (kg) — Standard by weight" },
  { value: "g", label: "Grams (g)" },
  { value: "unit", label: "Units / Pieces (unit)" },
  { value: "liter", label: "Liters (liter)" },
  { value: "bottle", label: "Bottles (bottle)" },
];

export function CategoryFormModal({
  isOpen,
  onClose,
  onSubmitCreate,
  onSubmitUpdate,
  categoryToEdit,
  isSubmitting,
}: CategoryFormModalProps) {
  const isEdit = Boolean(categoryToEdit);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [measurementUnit, setMeasurementUnit] = useState("kg");
  const [pointsPerUnit, setPointsPerUnit] = useState<string>("10");
  const [status, setStatus] = useState<"active" | "inactive">("active");

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (categoryToEdit) {
      setName(categoryToEdit.name);
      setDescription(categoryToEdit.description || "");
      setMeasurementUnit(categoryToEdit.measurement_unit);
      setPointsPerUnit(categoryToEdit.current_points_per_unit.toString());
      setStatus(categoryToEdit.status);
    } else {
      setName("");
      setDescription("");
      setMeasurementUnit("kg");
      setPointsPerUnit("10");
      setStatus("active");
    }
    setFormErrors({});
  }, [categoryToEdit, isOpen]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    const trimmedName = name.trim();
    if (!trimmedName) {
      errors.name = "Category name is required.";
    } else if (trimmedName.length < 2) {
      errors.name = "Category name must be at least 2 characters.";
    } else if (trimmedName.length > 100) {
      errors.name = "Category name cannot exceed 100 characters.";
    }

    if (!measurementUnit.trim()) {
      errors.measurement_unit = "Measurement unit is required.";
    }

    if (!isEdit) {
      const rateNum = parseFloat(pointsPerUnit);
      if (isNaN(rateNum) || rateNum <= 0) {
        errors.points_per_unit = "Initial point rate must be a positive number greater than 0.";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (isEdit && categoryToEdit) {
      const updateDto: UpdateCategoryDto = {
        name: name.trim(),
        description: description.trim(),
        measurement_unit: measurementUnit.trim().toLowerCase(),
        status,
      };
      await onSubmitUpdate(categoryToEdit.id, updateDto);
    } else {
      const createDto: CreateCategoryDto = {
        name: name.trim(),
        description: description.trim(),
        measurement_unit: measurementUnit.trim().toLowerCase(),
        points_per_unit: parseFloat(pointsPerUnit),
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
      aria-labelledby="category-modal-title"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-xl animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div>
            <h2
              id="category-modal-title"
              className="text-lg font-bold text-stone-900"
            >
              {isEdit ? "Edit Waste Category" : "Register New Waste Category"}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              {isEdit
                ? "Update category metadata. To modify point rate, please use the Revise Rate action."
                : "Add a verified recyclable waste type eligible for school rewards points."}
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
          {/* Category Name */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Plastic & PET Bottles, Paper & Cardboard"
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
              Description & Sorting Instructions
            </label>
            <textarea
              rows={2}
              placeholder="Provide clean sorting requirements for schools, e.g. Clean beverage bottles, clean dry newspapers..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#800000] focus:outline-none focus:ring-1 focus:ring-[#800000] transition-colors resize-none"
            />
          </div>

          {/* Measurement Unit */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Measurement Unit <span className="text-red-500">*</span>
            </label>
            <select
              value={measurementUnit}
              onChange={(e) => {
                setMeasurementUnit(e.target.value);
                if (formErrors.measurement_unit) {
                  setFormErrors((prev) => ({ ...prev, measurement_unit: "" }));
                }
              }}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-[#800000] focus:outline-none focus:ring-1 focus:ring-[#800000] transition-colors"
            >
              {COMMON_UNITS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
            {isEdit && (
              <p className="mt-1 flex items-center gap-1 text-[11px] text-stone-500">
                <Info className="h-3 w-3 text-stone-400" />
                Note: Changing units on categories with recorded collections is restricted to preserve audit integrity.
              </p>
            )}
          </div>

          {/* Points Per Unit */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              {isEdit ? "Current Points Rate" : "Initial Point Rate (per unit)"}{" "}
              <span className="text-red-500">*</span>
            </label>
            {isEdit ? (
              <div className="flex items-center justify-between rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-semibold text-stone-800">
                <span>
                  {categoryToEdit?.current_points_per_unit.toFixed(1)} points per{" "}
                  {categoryToEdit?.measurement_unit}
                </span>
                <span className="text-xs font-normal text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                  Use Revise Rate to modify
                </span>
              </div>
            ) : (
              <div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    placeholder="e.g. 10.0"
                    value={pointsPerUnit}
                    onChange={(e) => {
                      setPointsPerUnit(e.target.value);
                      if (formErrors.points_per_unit) {
                        setFormErrors((prev) => ({ ...prev, points_per_unit: "" }));
                      }
                    }}
                    className={`w-full rounded-lg border px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 transition-colors ${
                      formErrors.points_per_unit
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "border-stone-300 focus:border-[#800000] focus:ring-[#800000]"
                    }`}
                  />
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-stone-400 pointer-events-none">
                    pts / {measurementUnit}
                  </span>
                </div>
                {formErrors.points_per_unit && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" /> {formErrors.points_per_unit}
                  </p>
                )}
              </div>
            )}
          </div>

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
                <span className="text-xs text-stone-400">(Available for school logging)</span>
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
                <span className="text-xs text-stone-400">(Hidden from teachers)</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-stone-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-stone-200 px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#800000] px-4 py-2 text-xs font-semibold text-white hover:bg-[#660000] disabled:opacity-50 transition-colors shadow-2xs"
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
                  Register Category
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CategoryFormModal;
