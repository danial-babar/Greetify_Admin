'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import CardEditor from '@/components/cards/CardEditor';
import { Category, SubCategory, Card, categoryAPI, subCategoryAPI, cardAPI, dataURItoBlob } from '@/services/api';
import { toast } from 'react-hot-toast';

export default function CreateCardPage() {
  const router = useRouter();
  const [cardName, setCardName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [filteredSubCategories, setFilteredSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
        
        const subCategoriesData = await subCategoryAPI.getAll();
        console.log("Subcategories data:", subCategoriesData);
        // Check if the subcategories data is in the expected format
        if (Array.isArray(subCategoriesData)) {
          setSubCategories(subCategoriesData);
        } else if (subCategoriesData && Array.isArray(subCategoriesData.data)) {
          setSubCategories(subCategoriesData.data);
        } else {
          console.error("Unexpected subcategories data format:", subCategoriesData);
          toast.error("Invalid subcategories data format");
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
          const subCategoriesData = await subCategoryAPI.getByCategory(selectedCategoryId);
          console.log("Subcategories by category:", subCategoriesData);
          
          // Check if the subcategories data is in the expected format
          if (Array.isArray(subCategoriesData)) {
            setFilteredSubCategories(subCategoriesData);
          } else if (subCategoriesData && Array.isArray(subCategoriesData.data)) {
            setFilteredSubCategories(subCategoriesData.data);
          } else {
            console.error("Unexpected subcategories data format:", subCategoriesData);
            setFilteredSubCategories([]);
          }
          
        } catch (error) {
          console.error("Error fetching subcategories:", error);
          toast.error("Failed to load subcategories");
          setFilteredSubCategories([]);
        }
      };
      
      fetchSubCategories();
      
      // Reset subcategory selection
      setSelectedSubCategoryId('');
    } else {
      setFilteredSubCategories([]);
      setSelectedSubCategoryId('');
    }
  }, [selectedCategoryId]);

  const handleCardSave = async (cardData: Card) => {
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
      formData.append('name', cardName);
      formData.append('category_id', selectedCategoryId);
      formData.append('sub_category_id', selectedSubCategoryId);
      
      // Make sure each element has all required properties for the mobile app
      const processedElements = cardData.elements.map(el => {
        // Get the position value, ensuring it's consistent across all position properties
        const posX = typeof el.positionX === 'number' ? el.positionX : 0;
        const posY = typeof el.positionY === 'number' ? el.positionY : 0;
        
        return {
          ...el,
          // Ensure the type is text and all values are in the correct format
          type: 'text' as const,
          text: el.text || '',
          fontStyleIndex: el.fontStyleIndex || 0,
          colorIndex: el.colorIndex || 0,
          scale: el.scale || 1,
          rotate: el.rotate || 0,
          bold: !!el.bold,
          italic: !!el.italic,
          alignment: el.alignment || 'center',
          // Use consistent position values for all position-related properties
          positionX: posX,
          positionY: posY,
          translateX: posX,
          translateY: posY,
          centerX: posX,
          centerY: posY
        };
      });
      
      // Convert elements to the format expected by the backend
      const elementsJson = JSON.stringify(processedElements);
      console.log("Saving elements:", elementsJson);
      formData.append('elements', elementsJson);
      
      // Handle image uploads
      if (cardData.background_image && cardData.background_image.startsWith('data:')) {
        const backgroundBlob = dataURItoBlob(cardData.background_image);
        formData.append('background_image', backgroundBlob, 'background.jpg');
        
        // For preview image, we'll use the same image for simplicity
        formData.append('preview_image', backgroundBlob, 'preview.jpg');
      }
      
      console.log("Saving card with form data:", formData);
      
      // Save the card
      const response = await cardAPI.create(formData);
      console.log("Card save response:", response);
      
      toast.success("Card created successfully!");
      setSaving(false);
      router.push('/cards');
    } catch (error) {
      console.error("Error saving card:", error);
      toast.error("Failed to save card. Please try again.");
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Create New Card</h1>
        
        <div className="mt-6 bg-white shadow rounded-lg overflow-hidden">
          {/* Card Details Form */}
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Card Details</h2>
            
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="card-name" className="block text-sm font-medium text-gray-700">
                  Card Name
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="card-name"
                    id="card-name"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <div className="mt-1">
                  <select
                    id="category"
                    name="category"
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    disabled={loading}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700">
                  Subcategory
                </label>
                <div className="mt-1">
                  <select
                    id="subcategory"
                    name="subcategory"
                    value={selectedSubCategoryId}
                    onChange={(e) => setSelectedSubCategoryId(e.target.value)}
                    disabled={!selectedCategoryId || loading}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  >
                    <option value="">Select a subcategory</option>
                    {filteredSubCategories.map((subCategory) => (
                      <option key={subCategory.id} value={subCategory.id}>
                        {subCategory.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          {/* Card Editor */}
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Design Card</h2>
            
            <div className="min-h-[650px]">
              <CardEditor 
                onSave={handleCardSave}
              />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 