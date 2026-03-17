"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import Link from "next/link";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { Card, Category, SubCategory, cardAPI, categoryAPI, subCategoryAPI } from "@/services/api";
import { toast } from "react-hot-toast";

export default function CardsPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Fetch categories and subcategories for filtering
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const [categoriesData, subCategoriesData] = await Promise.all([
          categoryAPI.getAll(),
          subCategoryAPI.getAll(),
        ]);

        if (Array.isArray(categoriesData)) {
          setCategories(categoriesData);
        } else if (categoriesData && Array.isArray(categoriesData.data)) {
          setCategories(categoriesData.data);
        } else {
          setCategories([]);
        }

        if (Array.isArray(subCategoriesData)) {
          setSubCategories(subCategoriesData);
        } else if (subCategoriesData && Array.isArray(subCategoriesData.data)) {
          setSubCategories(subCategoriesData.data);
        } else {
          setSubCategories([]);
        }
      } catch (error) {
        console.error("Error fetching filter data:", error);
        toast.error("Failed to load categories and subcategories.");
      }
    };

    fetchFilterData();
  }, []);

  // Fetch cards from API based on filters
  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setLoading(true);
        const cardsData = await cardAPI.getAll(
          {
            is_populate: true,
            search: searchTerm,
            category_id: selectedCategoryId || undefined,
            subcategory_id: selectedSubCategoryId || undefined,
          },
          controller,
        );

        if (Array.isArray(cardsData)) {
          setCards(cardsData);
        } else {
          console.error("Unexpected cards data format:", cardsData);
          setCards([]);
        }
      } catch (error: any) {
        if (error?.name !== "CanceledError" && error?.name !== "AbortError") {
          console.error("Error fetching cards:", error);
          toast.error("Failed to load cards. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [searchTerm, selectedCategoryId, selectedSubCategoryId]);

  const filteredSubCategories = selectedCategoryId
    ? subCategories.filter((subCategory) => subCategory.category_id === selectedCategoryId)
    : subCategories;

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this card?")) {
      try {
        setDeleting(id);
        await cardAPI.delete(id);
        setCards((prevCards) => prevCards.filter((card) => card._id !== id));
        toast.success("Card deleted successfully");
        setDeleting(null);
      } catch (error) {
        console.error("Error deleting card:", error);
        toast.error("Failed to delete card. Please try again.");
        setDeleting(null);
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Cards</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all greeting cards including their name, category, and
            preview.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            href="/cards/create"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            <PlusIcon className="-ml-1 mr-2 h-4 w-4" />
            Add Card
          </Link>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label
              htmlFor="card-search"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Search
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="card-search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by card name"
                className="block h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm text-gray-900 shadow-sm transition placeholder:text-gray-400 hover:border-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="category-filter"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Category
            </label>
            <select
              id="category-filter"
              value={selectedCategoryId}
              onChange={(e) => {
                const newCategoryId = e.target.value;
                setSelectedCategoryId(newCategoryId);
                setSelectedSubCategoryId("");
              }}
              className="block h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm transition hover:border-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="subcategory-filter"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Subcategory
            </label>
            <select
              id="subcategory-filter"
              value={selectedSubCategoryId}
              onChange={(e) => setSelectedSubCategoryId(e.target.value)}
              disabled={!selectedCategoryId}
              className="block h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm transition hover:border-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
            >
              <option value="">All subcategories</option>
              {filteredSubCategories.map((subCategory) => (
                <option key={subCategory._id} value={subCategory._id}>
                  {subCategory.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setSelectedCategoryId("");
              setSelectedSubCategoryId("");
            }}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          >
            Clear filters
          </button>
        </div>
      </div>

      {loading ? (
        <div className="mt-6 flex justify-center">
          <p className="text-gray-500">Loading cards...</p>
        </div>
      ) : cards.length === 0 ? (
        <div className="mt-6 text-center">
          <p className="text-gray-500">
            No cards found. Create your first card!
          </p>
        </div>
      ) : (
        <div className="mt-8 flex flex-col">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                      >
                        Name
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Category
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Subcategory
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Preview
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Created
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Last Modified
                      </th>
                      <th
                        scope="col"
                        className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                      >
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {cards.map((card) => (
                      <tr key={card._id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {card.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {card.category?.name || "N/A"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {card.subcategory?.name || "N/A"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <a
                            className="w-16 bg-gray-100 rounded overflow-hidden relative"
                            target="_blank"
                            rel="noreferrer"
                            href={card.preview_image}
                          >
                            {card.preview_image ? (
                              <img
                                src={card.preview_image}
                                alt={card.name}
                                style={{
                                  width: 180,
                                  height: 180 * card.aspect_ratio!,
                                }}
                                className=""
                              />
                            ) : card.background_image ? (
                              <img
                                src={card.background_image}
                                alt={card.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-gray-200">
                                <span className="text-xs text-gray-500">
                                  No image
                                </span>
                              </div>
                            )}
                          </a>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {card.createdAt
                            ? new Date(card.createdAt).toLocaleDateString()
                            : "N/A"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {card.updatedAt
                            ? new Date(card.updatedAt).toLocaleDateString()
                            : "N/A"}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex space-x-3 justify-end">
                            <Link
                              href={`/cards/edit/${card._id}`}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              <PencilIcon
                                className="h-5 w-5"
                                aria-hidden="true"
                              />
                              <span className="sr-only">Edit</span>
                            </Link>
                            <button
                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
                              onClick={() => handleDelete(card._id as string)}
                              disabled={deleting === card._id}
                            >
                              <TrashIcon
                                className="h-5 w-5"
                                aria-hidden="true"
                              />
                              <span className="sr-only">Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
