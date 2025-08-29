import React from 'react';
import CommandPalette from './components/CommandPalette';
import ProtectedRoute from './components/ProtectedRoute';

export default function HomePage() {
  return (
    <ProtectedRoute>
      <>
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes gradientShift {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            .animated-gradient {
              background: linear-gradient(135deg, #124D3D 0%, #1a6b54 25%, #227d62 50%, #2a8f70 75%, #32a17e 100%);
              background-size: 400% 400%;
              animation: gradientShift 15s ease infinite;
            }
          `
        }} />
        <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 animated-gradient">
          <CommandPalette />
        </main>
      </>
    </ProtectedRoute>
  );
}