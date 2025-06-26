'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Category, SubCategory, subCategoryAPI, categoryAPI } from '@/services/api';
import { toast } from 'react-hot-toast';
import { HexAlphaColorPicker } from 'react-colorful';

export default function EditSubCategoryPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [background_color, setBackgroundColor] = useState('#000000FF');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subCategoryResponse, categoriesResponse] = await Promise.all([
        subCategoryAPI.getById(params.id),
        categoryAPI.getAll()
      ]);

      const subCategory = subCategoryResponse.data;
      const categoriesData = Array.isArray(categoriesResponse) ? categoriesResponse : categoriesResponse.data;

      setName(subCategory.name);
      setCategoryId(subCategory.category_id);
      setBackgroundColor(subCategory.background_color);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a subcategory name');
      return;
    }
    if (!categoryId) {
      toast.error('Please select a category');
      return;
    }

    try {
      setLoading(true);
      const data = {
        name,
        category_id: categoryId,
        background_color
      };

      await subCategoryAPI.update(params.id, data);
      toast.success('Subcategory updated successfully');
      router.push('/subcategories');
    } catch (error) {
      console.error('Error updating subcategory:', error);
      toast.error('Failed to update subcategory');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Edit Subcategory</h1>
            <p className="mt-2 text-sm text-gray-700">
              Update subcategory details.
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
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                required
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Background Color
              </label>
              <div className="relative mt-1 flex items-center">
                <button
                  type="button"
                  onClick={() => setShowColorPicker(true)}
                  className="mr-2 h-8 w-8 rounded border border-gray-300"
                  style={{ backgroundColor: background_color }}
                  aria-label="Pick a color"
                />
                <input
                  type="text"
                  value={background_color}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder="#RRGGBBAA"
                  maxLength={9}
                />
                {showColorPicker && (
                  <div className="absolute z-10 top-full left-0 mt-2 p-3 bg-white border border-gray-300 rounded-lg shadow-lg">
                    <HexAlphaColorPicker
                      color={background_color}
                      onChange={setBackgroundColor}
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        type="button"
                        className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                        onClick={() => setShowColorPicker(false)}
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-2 h-8 w-full rounded" style={{ backgroundColor: background_color }} />
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
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
} 