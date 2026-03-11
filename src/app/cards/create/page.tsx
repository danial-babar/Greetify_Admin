"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import CardEditor, { UpdatedCardData } from "@/components/cards/CardEditor";
import {
  Category,
  SubCategory,
  Card,
  categoryAPI,
  subCategoryAPI,
  cardAPI,
} from "@/services/api";
import { toast } from "react-hot-toast";

export default function CreateCardPage() {
  const router = useRouter();
  const [cardName, setCardName] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredSubCategories, setFilteredSubCategories] = useState<
    SubCategory[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // const [previewImage, setPreviewImage] = useState<File | null>(null);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const categoriesData = await categoryAPI.getAll();
        console.log("Categories data:", categoriesData);
        // Check if the categories data is in the expected format
        if (Array.isArray(categoriesData)) {
          setCategories(categoriesData);
        } else if (categoriesData && Array.isArray(categoriesData.data)) {
          setCategories(categoriesData.data);
        } else {
          console.error("Unexpected categories data format:", categoriesData);
          toast.error("Invalid categories data format");
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load categories. Please try again.");
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Filter subcategories based on selected category
  useEffect(() => {
    if (selectedCategoryId) {
      const fetchSubCategories = async () => {
        try {
          setLoading(true);
          const response = await subCategoryAPI.getByCategory(
            selectedCategoryId
          );
          console.log("Subcategories by category response:", response);

          // Handle different response formats
          let subCategoriesData;
          if (Array.isArray(response)) {
            subCategoriesData = response;
          } else if (response && Array.isArray(response.data)) {
            subCategoriesData = response.data;
          } else {
            console.error(
              "Unexpected subcategories response format:",
              response
            );
            toast.error("Invalid subcategories data format");
            setFilteredSubCategories([]);
            return;
          }

          // Filter subcategories to ensure they belong to the selected category
          const filtered = subCategoriesData.filter(
            (subCat: SubCategory) => subCat.category_id === selectedCategoryId
          );

          console.log("Filtered subcategories:", filtered);
          setFilteredSubCategories(filtered);
        } catch (error) {
          console.error("Error fetching subcategories:", error);
          toast.error("Failed to load subcategories");
          setFilteredSubCategories([]);
        } finally {
          setLoading(false);
        }
      };

      fetchSubCategories();

      // Reset subcategory selection
      setSelectedSubCategoryId("");
    } else {
      setFilteredSubCategories([]);
      setSelectedSubCategoryId("");
    }
  }, [selectedCategoryId]);

  // const handlePreviewImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (file) setPreviewImage(file);
  // };

  const handleCardSave = async (cardData: UpdatedCardData) => {
    if (!cardName.trim()) {
      toast.error("Please enter a card name");
      return;
    }

    if (!selectedCategoryId) {
      toast.error("Please select a category");
      return;
    }

    if (!selectedSubCategoryId) {
      toast.error("Please select a subcategory");
      return;
    }

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("name", cardName);
      formData.append("category_id", selectedCategoryId);
      formData.append("subcategory_id", selectedSubCategoryId);

      // Make sure each element has all required properties for the mobile app
      const processedElements = cardData.elements.map((el) => {
        const posX =
          typeof el.positionX === "number" ? Math.round(el.positionX) : 0;
        const posY =
          typeof el.positionY === "number" ? Math.round(el.positionY) : 0;
        const scale = el.scale || 1;

        const isShape =
          el.type === "line" ||
          el.type === "rect-fill" ||
          el.type === "rect-border" ||
          el.type === "circle-fill" ||
          el.type === "circle-border";

        if (isShape) {
          return {
            ...el,
            lineHeight: 1,
            positionX: posX,
            positionY: posY,
          };
        }

        return {
          ...el,
          type: "text" as const,
          text: el.text || "",
          fontStyleIndex: el.fontStyleIndex ?? 0,
          color: (typeof el.color === "string" ? el.color : "#000000"),
          scale: scale,
          rotate: el.rotate || 0,
          bold: !!el.bold,
          italic: !!el.italic,
          alignment: el.alignment || "center",
          positionX: posX,
          positionY: posY,
          lineHeight: typeof el.lineHeight === "number" ? el.lineHeight : 1,
        };
      });

      // Convert elements to the format expected by the backend
      const elementsJson = JSON.stringify(processedElements);
      console.log("Saving elements:", elementsJson);
      formData.append("elements", elementsJson);

      // Handle background image upload
      if (cardData.background_image) {
        formData.append("background_image", cardData.background_image);
        formData.append("aspect_ratio", cardData.aspect_ratio?.toString() || '');
      }

      // Handle preview image upload
      if (cardData.preview_image) {
        formData.append("preview_image", cardData.preview_image);
      }


      // Save the card
      const response = await cardAPI.create(formData);
      console.log("Card save response:", response);

      toast.success("Card created successfully!");
      setSaving(false);
      router.push("/cards");
    } catch (error) {
      console.error("Error saving card:", error);
      toast.error("Failed to save card. Please try again.");
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Create New Card
        </h1>

        <div className="mt-6 bg-white shadow rounded-lg overflow-hidden">
          {/* Card Details Form */}
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Card Details
            </h2>

            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label
                  htmlFor="card-name"
                  className="block text-sm font-semibold text-gray-700 mb-1.5"
                >
                  Card Name
                </label>
                <input
                  type="text"
                  name="card-name"
                  id="card-name"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="e.g. Wedding Invitation"
                  className="block w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 shadow-sm transition-all duration-200 hover:border-gray-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:shadow-md disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
                />
              </div>

              <div className="sm:col-span-3">
                <label
                  htmlFor="category"
                  className="block text-sm font-semibold text-gray-700 mb-1.5"
                >
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  disabled={loading}
                  className="block w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2.5 text-gray-900 shadow-sm transition-all duration-200 hover:border-gray-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:shadow-md disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-60 sm:text-sm appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.5rem_1.5rem] bg-[right_0.5rem_center] bg-no-repeat pr-10"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <label
                  htmlFor="subcategory"
                  className="block text-sm font-semibold text-gray-700 mb-1.5"
                >
                  Subcategory
                </label>
                <select
                  id="subcategory"
                  name="subcategory"
                  value={selectedSubCategoryId}
                  onChange={(e) => setSelectedSubCategoryId(e.target.value)}
                  disabled={!selectedCategoryId || loading}
                  className="block w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2.5 text-gray-900 shadow-sm transition-all duration-200 hover:border-gray-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:shadow-md disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-60 sm:text-sm appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.5rem_1.5rem] bg-[right_0.5rem_center] bg-no-repeat pr-10"
                >
                  <option value="">Select a subcategory</option>
                  {filteredSubCategories.map((subCategory) => (
                    <option key={subCategory._id} value={subCategory._id}>
                      {subCategory.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* <div className="sm:col-span-3">
                <label
                  htmlFor="preview-image"
                  className="block text-sm font-medium text-gray-700"
                >
                  Preview Image
                </label>
                <div className="mt-1">
                  <input
                    type="file"
                    id="preview-image"
                    name="preview-image"
                    accept="image/*"
                    onChange={handlePreviewImageChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  />
                  {previewImage && (
                    <div className="mt-2">
                      <img
                        src={URL.createObjectURL(previewImage as Blob)}
                        alt="Preview image"
                        className="h-20 w-20 object-cover rounded"
                      />
                    </div>
                  )}
                </div>
              </div> */}
            </div>
          </div>

          {/* Card Editor */}
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Design Card
            </h2>

            <div className="min-h-[650px]">
              <CardEditor onSave={handleCardSave} />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
