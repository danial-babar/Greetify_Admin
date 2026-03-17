"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { categoryAPI } from "@/services/api";
import { toast } from "react-hot-toast";

type FormValues = {
  name: string;
  startColor: string;
  endColor: string;
  image: File | null;
};

export default function EditCategoryPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [initialValues, setInitialValues] = useState<FormValues>({
    name: "",
    startColor: "#000000",
    endColor: "#ffffff",
    image: null,
  });

  const isValidHexColor = (value: string) =>
    /^#([0-9A-Fa-f]{6})$/.test(value.trim());

  const formik = useFormik<FormValues>({
    enableReinitialize: true,
    initialValues,
    validate: (values) => {
      const errors: Partial<Record<keyof FormValues, string>> = {};

      if (!values.name.trim()) {
        errors.name = "Name is required";
      }

      if (!values.image && !currentImage) {
        errors.image = "Image is required";
      }

      if (!values.startColor.trim()) {
        errors.startColor = "Start color is required";
      } else if (!isValidHexColor(values.startColor)) {
        errors.startColor = "Use a valid hex color (e.g. #000000)";
      }

      if (!values.endColor.trim()) {
        errors.endColor = "End color is required";
      } else if (!isValidHexColor(values.endColor)) {
        errors.endColor = "Use a valid hex color (e.g. #ffffff)";
      }

      return errors;
    },
    onSubmit: async (values, { setSubmitting }) => {
      try {
        setLoading(true);
        const formData = new FormData();
        formData.append("name", values.name.trim());

        if (values.image) {
          formData.append("image", values.image);
        }

        formData.append("background_linear_gradient[0]", values.startColor);
        formData.append("background_linear_gradient[1]", values.endColor);

        await categoryAPI.update(params.id, formData);
        toast.success("Category updated successfully");
        router.push("/categories");
      } catch (error) {
        console.error("Error updating category:", error);
        toast.error("Failed to update category");
      } finally {
        setLoading(false);
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    fetchCategory();
  }, [params.id]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const fetchCategory = async () => {
    try {
      setLoading(true);
      const category = await categoryAPI.getById(params.id);
      if (category) {
        const [startColor = "#000000", endColor = "#ffffff"] =
          category.background_linear_gradient || [];
        setInitialValues({
          name: category.name || "",
          image: null,
          startColor,
          endColor,
        });
        setCurrentImage(category.image);
      }
    } catch (error) {
      console.error("Error fetching category:", error);
      toast.error("Failed to load category");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      formik.setFieldValue("image", file);
      formik.setFieldTouched("image", true, false);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">
              Edit Category
            </h1>
            <p className="mt-2 text-sm text-gray-700">
              Update category details.
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
                htmlFor="image"
                className="block text-sm font-medium text-gray-800"
              >
                Image <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                id="image"
                name="image"
                accept="image/*"
                onChange={handleImageChange}
                className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white text-sm text-gray-600 shadow-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-700 hover:file:bg-primary-100"
                required={!currentImage}
              />
              {formik.touched.image && formik.errors.image && (
                <p className="mt-1 text-xs text-red-600">{formik.errors.image}</p>
              )}
              {(previewUrl || currentImage) && (
                <div className="mt-3 inline-block rounded-lg border border-gray-200 bg-gray-50 p-2">
                  <img
                    src={previewUrl || currentImage || ""}
                    alt="Preview"
                    className="h-32 w-32 rounded-md object-cover"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800">
                Background Linear Gradient <span className="text-red-500">*</span>
              </label>
              <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="startColor"
                    className="block text-xs font-medium text-gray-500"
                  >
                    Start Color
                  </label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <input
                      type="color"
                      id="startColor"
                      name="startColor"
                      value={formik.values.startColor}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="h-10 w-10 cursor-pointer rounded-md border border-gray-300 bg-white p-1"
                    />
                    <input
                      type="text"
                      name="startColor"
                      value={formik.values.startColor}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`block h-10 w-full rounded-lg border bg-white px-3 text-sm shadow-sm transition focus:outline-none focus:ring-2 ${
                        formik.touched.startColor && formik.errors.startColor
                          ? "border-red-300 focus:border-red-400 focus:ring-red-200"
                          : "border-gray-300 focus:border-primary-500 focus:ring-primary-200"
                      }`}
                      placeholder="#000000"
                      required
                    />
                  </div>
                  {formik.touched.startColor && formik.errors.startColor && (
                    <p className="mt-1 text-xs text-red-600">
                      {formik.errors.startColor}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="endColor"
                    className="block text-xs font-medium text-gray-500"
                  >
                    End Color
                  </label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <input
                      type="color"
                      id="endColor"
                      name="endColor"
                      value={formik.values.endColor}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="h-10 w-10 cursor-pointer rounded-md border border-gray-300 bg-white p-1"
                    />
                    <input
                      type="text"
                      name="endColor"
                      value={formik.values.endColor}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`block h-10 w-full rounded-lg border bg-white px-3 text-sm shadow-sm transition focus:outline-none focus:ring-2 ${
                        formik.touched.endColor && formik.errors.endColor
                          ? "border-red-300 focus:border-red-400 focus:ring-red-200"
                          : "border-gray-300 focus:border-primary-500 focus:ring-primary-200"
                      }`}
                      placeholder="#ffffff"
                      required
                    />
                  </div>
                  {formik.touched.endColor && formik.errors.endColor && (
                    <p className="mt-1 text-xs text-red-600">
                      {formik.errors.endColor}
                    </p>
                  )}
                </div>
              </div>
              <div
                className="mt-3 h-10 w-full rounded-lg border border-gray-200"
                style={{
                  background: `linear-gradient(to right, ${formik.values.startColor}, ${formik.values.endColor})`,
                }}
              />
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
