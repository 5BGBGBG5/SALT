import React from 'react';
import ResetPasswordComponent from './ResetPasswordComponent';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function ResetPasswordPage() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordComponent />
    </React.Suspense>
  );
}
