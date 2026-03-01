'use client';

import { useRef, type ReactNode } from 'react';

interface AdminFormProps {
  action: (formData: FormData) => void;
  children: ReactNode;
}

export function AdminForm({ action, children }: AdminFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const wrappedAction = async (formData: FormData) => {
    // アップロード中なら送信を中止
    if (formRef.current?.querySelector('[data-uploading]')) {
      alert('画像をアップロード中です。完了後に保存してください。');
      return;
    }

    // data-field-name/value を持つ要素から値を読み取り FormData に注入
    formRef.current?.querySelectorAll<HTMLElement>('[data-field-name]').forEach((el) => {
      const name = el.dataset.fieldName;
      const value = el.dataset.fieldValue;
      if (name) formData.set(name, value ?? '');
    });

    await action(formData);
  };

  return (
    <form ref={formRef} action={wrappedAction} className="card-premium p-6 flex flex-col gap-4">
      {children}
    </form>
  );
}
