import { Suspense } from 'react';
import ResetPasswordClient from './reset-password-client';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <ResetPasswordClient />
    </Suspense>
  );
}