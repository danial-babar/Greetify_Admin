'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { SubCategory, Category, subCategoryAPI, categoryAPI } from '@/services/api';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function SubCategoriesPage() {
  const router = useRouter();
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subCategoriesResponse, categoriesResponse] = await Promise.all([
        subCategoryAPI.getAll(),
        categoryAPI.getAll()
      ]);

      const subCategoriesData = Array.isArray(subCategoriesResponse) ? subCategoriesResponse : subCategoriesResponse.data;
      const categoriesData = Array.isArray(categoriesResponse) ? categoriesResponse : categoriesResponse.data;

      setSubCategories(subCategoriesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subcategory?')) return;

    try {
      await subCategoryAPI.delete(id);
      toast.success('Subcategory deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting subcategory:', error);
      toast.error('Failed to delete subcategory');
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat._id === categoryId);
    return category ? category.name : 'Unknown Category';
  };

  const filteredSubCategories = selectedCategoryId
    ? subCategories.filter((subCategory) => subCategory.category_id === selectedCategoryId)
    : subCategories;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Subcategories</h1>
            <p className="mt-2 text-sm text-gray-700">
              A list of all subcategories in your application.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <Link
              href="/subcategories/create"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:w-auto"
            >
              Add Subcategory
            </Link>
          </div>
        </div>

        <div className="mt-8 flex flex-col">
          <div className="mb-5 w-full max-w-sm rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <label
              htmlFor="category-filter"
              className="block text-sm font-medium text-gray-800"
            >
              Filter by category
            </label>
            <select
              id="category-filter"
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="mt-1.5 block h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm transition hover:border-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Name
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Category
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {loading ? (
                      <tr>
                        <td colSpan={3} className="px-3 py-4 text-center text-sm text-gray-500">
                          Loading...
                        </td>
                      </tr>
                    ) : filteredSubCategories.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-3 py-4 text-center text-sm text-gray-500">
                          No subcategories found
                        </td>
                      </tr>
                    ) : (
                      filteredSubCategories.map((subCategory) => (
                        <tr key={subCategory._id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            {subCategory.name}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {getCategoryName(subCategory.category_id)}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <button
                              onClick={() => router.push(`/subcategories/edit/${subCategory._id}`)}
                              className="text-primary-600 hover:text-primary-900 mr-4"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(subCategory._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 