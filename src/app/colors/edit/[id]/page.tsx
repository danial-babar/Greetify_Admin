"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { colorAPI, Color } from "@/services/api";
import { HexAlphaColorPicker } from "react-colorful";
import EyedropperButton from "@/components/ui/EyedropperButton";

function toHex8(hex: string) {
  if (/^#[0-9a-fA-F]{8}$/.test(hex)) return hex.toUpperCase();
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) return hex.toUpperCase() + "FF";
  return "#000000FF";
}

export default function EditColorPage({ params }: { params: { id: string } }) {
  const [color, setColor] = useState("#000000FF");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    colorAPI.getById(params.id).then((data) => {
      if (data && typeof data.color === "string") {
        setColor(toHex8(data.color));
      } else if (data && data.data && typeof data.data.color === "string") {
        setColor(toHex8(data.data.color));
      }
      setLoading(false);
    });
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await colorAPI.update(params.id, { color: toHex8(color) });
      router.push("/colors");
    } catch (err) {
      alert("Failed to update color");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <DashboardLayout><div className="p-6">Loading...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="max-w-md mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Edit Color</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color (with opacity)</label>
            <div className="flex items-center gap-2 mb-2">
              <HexAlphaColorPicker color={color} onChange={setColor} className="flex-1" />
              <EyedropperButton
                onPick={setColor}
                title="Pick color from screen"
                className="w-10 h-10 shrink-0"
              />
            </div>
            <input
              type="text"
              value={color}
              onChange={e => setColor(e.target.value)}
              className="block w-full rounded border border-gray-300 px-2 py-1 text-sm mt-2"
              maxLength={9}
              placeholder="#RRGGBBAA"
            />
            <span className="ml-3 text-xs">{color}</span>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-primary-600 text-white rounded"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
} 