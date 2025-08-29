import React from 'react';
import { BarChart, FileText, Settings, ChevronDown, Search } from 'lucide-react';
import ReportClient from './components/ReportClient';

// Server component; client-side logic lives in ReportClient

// --- UI COMPONENTS ---

// Sidebar Navigation Component
const Sidebar = () => {
  return (
    <aside className="w-64 flex-shrink-0 bg-gray-50 border-r border-gray-200 flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">Ineca Marketing</h1>
      </div>
      <nav className="flex-1 px-4 py-4 space-y-2">
        <a
          href="#"
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg"
        >
          <BarChart className="w-5 h-5 mr-3" />
          Reports
        </a>
        <a
          href="#"
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <FileText className="w-5 h-5 mr-3" />
          Documents
        </a>
        <a
          href="#"
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <Settings className="w-5 h-5 mr-3" />
          Settings
        </a>
      </nav>
    </aside>
  );
};

// Header Component
const Header = () => {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
       <div className="relative">
         <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
         <input
            type="text"
            placeholder="Search reports..."
            className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
         />
       </div>
       <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
                JD
            </div>
            <span className="text-sm font-medium text-gray-700">John Doe</span>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </div>
       </div>
    </header>
  );
};

// --- MAIN APP COMPONENT ---
export default function App() {
  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <ReportClient />
          </div>
        </main>
      </div>
    </div>
  );
}
// Trigger deployment
