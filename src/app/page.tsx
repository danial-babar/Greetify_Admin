'use client';

import { useEffect } from 'react';
import { redirect } from 'next/navigation';

export default function Home() {
  useEffect(() => {
    // Using useEffect for client-side redirection
    window.location.href = '/dashboard';
  }, []);
  
  // This keeps the page content minimal while the redirect happens
  return null;
} 