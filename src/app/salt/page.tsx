import React from 'react';
import SearchInput from '../components/SearchInput';
import PoweredBySALT from '../components/PoweredBySALT';
import ProtectedRoute from '../components/ProtectedRoute';

export default function SaltPage() {
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
        <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-6 animated-gradient">
          <div className="w-full max-w-3xl mx-auto text-center">
            <SearchInput />
            <PoweredBySALT />
          </div>
        </div>
      </>
    </ProtectedRoute>
  );
}
