'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { categoryAPI } from '@/services/api';
import { toast } from 'react-hot-toast';

export default function CreateCategoryPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [background_linear_gradient, setBackgroundLinearGradient] = useState<[string, string]>(['#000000', '#ffffff']);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleColorChange = (index: number, value: string) => {
    const newGradient = [...background_linear_gradient] as [string, string];
    newGradient[index] = value;
    setBackgroundLinearGradient(newGradient);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('name', name);
      if (image) {
        formData.append('image', image);
      }
      background_linear_gradient.map((color, index) => {
        formData.append(`background_linear_gradient[${index}]`, color);
      });

      await categoryAPI.create(formData);
      toast.success('Category created successfully');
      router.push('/categories');
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Create Category</h1>
            <p className="mt-2 text-sm text-gray-700">
              Add a new category to your application.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="image" className="block text-sm font-medium text-gray-700">
                Image
              </label>
              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleImageChange}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="mt-2 h-32 w-32 object-cover rounded-lg"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Background Linear Gradient
              </label>
              <div className="mt-1 grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startColor" className="block text-xs text-gray-500">
                    Start Color
                  </label>
                  <div className="mt-1 flex items-center space-x-2">
                    <input
                      type="color"
                      id="startColor"
                      value={background_linear_gradient[0]}
                      onChange={(e) => handleColorChange(0, e.target.value)}
                      className="h-8 w-8 rounded border border-gray-300"
                    />
                    <input
                      type="text"
                      value={background_linear_gradient[0]}
                      onChange={(e) => handleColorChange(0, e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      placeholder="#000000"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="endColor" className="block text-xs text-gray-500">
                    End Color
                  </label>
                  <div className="mt-1 flex items-center space-x-2">
                    <input
                      type="color"
                      id="endColor"
                      value={background_linear_gradient[1]}
                      onChange={(e) => handleColorChange(1, e.target.value)}
                      className="h-8 w-8 rounded border border-gray-300"
                    />
                    <input
                      type="text"
                      value={background_linear_gradient[1]}
                      onChange={(e) => handleColorChange(1, e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-2 h-8 w-full rounded"
                style={{
                  background: `linear-gradient(to right, ${background_linear_gradient[0]}, ${background_linear_gradient[1]})`
                }}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              {loading ? 'Creating...' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
} 