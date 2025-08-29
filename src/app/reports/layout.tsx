import React from 'react';
import ProtectedRoute from "../components/ProtectedRoute";

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gray-50 p-8">
        {children}
      </main>
    </ProtectedRoute>
  );
}
