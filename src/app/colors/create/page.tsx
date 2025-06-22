"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { colorAPI } from "@/services/api";
import { HexAlphaColorPicker } from "react-colorful";

function toHex8(hex: string) {
  if (/^#[0-9a-fA-F]{8}$/.test(hex)) return hex.toUpperCase();
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) return hex.toUpperCase() + "FF";
  return "#000000FF";
}

export default function CreateColorPage() {
  const [color, setColor] = useState("#000000FF");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await colorAPI.create({ color: toHex8(color) });
      router.push("/colors");
    } catch (err) {
      alert("Failed to create color");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-md mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Add Color</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color (with opacity)</label>
            <HexAlphaColorPicker color={color} onChange={setColor} className="mb-2" />
            <input
              type="text"
              value={(color)}
              onChange={e => setColor((e.target.value))}
              className="block w-full rounded border border-gray-300 px-2 py-1 text-sm mt-2"
              maxLength={9}
              placeholder="#RRGGBBAA"
            />
            <span className="ml-3 text-xs">{(color)}</span>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-primary-600 text-white rounded"
            disabled={saving}
          >
            {saving ? "Saving..." : "Add Color"}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
} 