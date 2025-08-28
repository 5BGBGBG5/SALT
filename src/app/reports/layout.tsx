import React from 'react';
import Link from "next/link";

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar for reports navigation */}
      <aside className="w-64 bg-gray-100 p-6 shadow-md">
        <nav>
          <ul className="space-y-4">
            <li>
              <Link href="/reports/post-likes" className="text-lg font-medium text-gray-700 hover:text-indigo-600">
                Post Likes Report
              </Link>
            </li>
            <li>
              <Link href="/reports/post-engagement" className="text-lg font-medium text-indigo-600 hover:text-indigo-700">
                Post Engagement Report
              </Link>
            </li>
            <li>
              <Link href="/reports/aieo" className="text-lg font-medium text-gray-700 hover:text-indigo-600">
                AiEO Report
              </Link>
            </li>
            <li>
              <Link href="/reports/competition-heatmap" className="text-lg font-medium text-gray-700 hover:text-indigo-600">
                Competition Heat Map
              </Link>
            </li>
          </ul>
        </nav>
      </aside>
      
      {/* Main content area */}
      <main className="flex-1 p-8 bg-gray-50">
        {children}
      </main>
    </div>
  );
}
