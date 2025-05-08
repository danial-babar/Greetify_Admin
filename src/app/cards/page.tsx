'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Link from 'next/link';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Card, cardAPI } from '@/services/api';
import { toast } from 'react-hot-toast';

export default function CardsPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  
  // Fetch cards from API
  useEffect(() => {
    const fetchCards = async () => {
      try {
        setLoading(true);
        let cardsData = await cardAPI.getAll();
        console.log("Cards data:", cardsData);
        cardsData = cardsData.data;
        // Handle different response formats
        if (Array.isArray(cardsData)) {
          setCards(cardsData);
        } else if (cardsData && Array.isArray(cardsData.data)) {
          setCards(cardsData.data);
        } else {
          console.error("Unexpected cards data format:", cardsData);
          setCards([]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching cards:", error);
        toast.error("Failed to load cards. Please try again.");
        setLoading(false);
      }
    };
    
    fetchCards();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this card?')) {
      try {
        setDeleting(id);
        await cardAPI.delete(id);
        setCards(cards.filter(card => card.id !== id));
        toast.success('Card deleted successfully');
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
            A list of all greeting cards including their name, category, and preview.
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

      {loading ? (
        <div className="mt-6 flex justify-center">
          <p className="text-gray-500">Loading cards...</p>
        </div>
      ) : cards.length === 0 ? (
        <div className="mt-6 text-center">
          <p className="text-gray-500">No cards found. Create your first card!</p>
        </div>
      ) : (
        <div className="mt-8 flex flex-col">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Name
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Preview
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Created
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Last Modified
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {cards.map((card) => (
                      <tr key={card.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {card.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="h-16 w-16 bg-gray-100 rounded overflow-hidden relative">
                            {card.preview_image ? (
                              <img 
                                src={card.preview_image} 
                                alt={card.name} 
                                className="h-full w-full object-cover" 
                              />
                            ) : card.background_image ? (
                              <img 
                                src={card.background_image} 
                                alt={card.name} 
                                className="h-full w-full object-cover" 
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-gray-200">
                                <span className="text-xs text-gray-500">No image</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {card.createdAt ? new Date(card.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {card.updatedAt ? new Date(card.updatedAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex space-x-3 justify-end">
                            <Link
                              href={`/cards/edit/${card.id}`}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              <PencilIcon className="h-5 w-5" aria-hidden="true" />
                              <span className="sr-only">Edit</span>
                            </Link>
                            <button
                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
                              onClick={() => handleDelete(card.id as string)}
                              disabled={deleting === card.id}
                            >
                              <TrashIcon className="h-5 w-5" aria-hidden="true" />
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