'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { colorAPI, Color } from "@/services/api";
import DashboardLayout from "@/components/layouts/DashboardLayout";

export default function ColorsPage() {
  const [colors, setColors] = useState<Color[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    colorAPI.getAll().then((data) => {
      if (Array.isArray(data)) {
        setColors(data);
      } else if (Array.isArray(data?.data)) {
        setColors(data.data);
      } else {
        setColors([]);
      }
      setLoading(false);
    });
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this color?")) {
      await colorAPI.delete(id);
      setColors((prev) => prev.filter((c) => c.id !== id));
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Colors</h1>
          <Link href="/colors/create" className="px-4 py-2 bg-primary-600 text-white rounded">Add Color</Link>
        </div>
        {loading ? (
          <div>Loading...</div>
        ) : colors.length === 0 ? (
          <div>No colors found.</div>
        ) : (
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Color</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {colors.map((color) => (
                <tr key={color.id} className="border-t">
                  <td className="p-2">
                    <span className="inline-block w-8 h-8 rounded-full border border-gray-300" style={{ backgroundColor: color.color }} />
                    <span className="ml-2 text-xs">{color.color}</span>
                  </td>
                  <td className="p-2 flex gap-2">
                    <Link href={`/colors/edit/${color.id}`} className="px-2 py-1 bg-blue-500 text-white rounded">Edit</Link>
                    <button onClick={() => handleDelete(color.id)} className="px-2 py-1 bg-red-500 text-white rounded">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  );
} 