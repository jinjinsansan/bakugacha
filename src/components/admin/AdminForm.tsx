'use client';

import type { ReactNode } from 'react';

interface AdminFormProps {
  action: (formData: FormData) => void;
  children: ReactNode;
}

export function AdminForm({ action, children }: AdminFormProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const uploading = e.currentTarget.querySelector('[data-uploading]');
    if (uploading) {
      e.preventDefault();
      alert('画像をアップロード中です。完了後に保存してください。');
    }
  };

  return (
    <form action={action} onSubmit={handleSubmit} className="card-premium p-6 flex flex-col gap-4">
      {children}
    </form>
  );
}
