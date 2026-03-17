"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Category, subCategoryAPI, categoryAPI } from "@/services/api";
import { toast } from "react-hot-toast";

type FormValues = {
  name: string;
  categoryId: string;
};

export default function EditSubCategoryPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [initialValues, setInitialValues] = useState<FormValues>({
    name: "",
    categoryId: "",
  });

  const formik = useFormik<FormValues>({
    enableReinitialize: true,
    initialValues,
    validate: (values) => {
      const errors: Partial<Record<keyof FormValues, string>> = {};

      if (!values.name.trim()) errors.name = "Name is required";
      if (!values.categoryId) errors.categoryId = "Category is required";

      return errors;
    },
    onSubmit: async (values, { setSubmitting }) => {
      try {
        setLoading(true);
        await subCategoryAPI.update(params.id, {
          name: values.name.trim(),
          category_id: values.categoryId,
        });
        toast.success("Subcategory updated successfully");
        router.push("/subcategories");
      } catch (error) {
        console.error("Error updating subcategory:", error);
        toast.error("Failed to update subcategory");
      } finally {
        setLoading(false);
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subCategoryResponse, categoriesResponse] = await Promise.all([
        subCategoryAPI.getById(params.id),
        categoryAPI.getAll(),
      ]);

      const subCategory = subCategoryResponse;

      if (subCategoryResponse) {
        setInitialValues({
          name: subCategory.name || "",
          categoryId: subCategory.category_id || "",
        });
      }
      const categoriesData = Array.isArray(categoriesResponse)
        ? categoriesResponse
        : categoriesResponse?.data || [];
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">
              Edit Subcategory
            </h1>
            <p className="mt-2 text-sm text-gray-700">
              Update subcategory details.
            </p>
          </div>
        </div>

        <form onSubmit={formik.handleSubmit} className="mt-8">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-800"
              >
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`mt-1.5 block h-11 w-full rounded-lg border bg-white px-3 text-sm shadow-sm transition focus:outline-none focus:ring-2 ${
                  formik.touched.name && formik.errors.name
                    ? "border-red-300 focus:border-red-400 focus:ring-red-200"
                    : "border-gray-300 focus:border-primary-500 focus:ring-primary-200"
                }`}
                required
              />
              {formik.touched.name && formik.errors.name && (
                <p className="mt-1 text-xs text-red-600">{formik.errors.name}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-800"
              >
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                name="categoryId"
                value={formik.values.categoryId}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`mt-1.5 block h-11 w-full rounded-lg border bg-white px-3 text-sm shadow-sm transition focus:outline-none focus:ring-2 ${
                  formik.touched.categoryId && formik.errors.categoryId
                    ? "border-red-300 focus:border-red-400 focus:ring-red-200"
                    : "border-gray-300 focus:border-primary-500 focus:ring-primary-200"
                }`}
                required
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {formik.touched.categoryId && formik.errors.categoryId && (
                <p className="mt-1 text-xs text-red-600">
                  {formik.errors.categoryId}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || formik.isSubmitting}
              className="inline-flex justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              {loading || formik.isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
