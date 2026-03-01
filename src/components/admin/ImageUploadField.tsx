'use client';

import { useState, useRef } from 'react';

interface ImageUploadFieldProps {
  name: string;
  label: string;
  prefix?: string;
  aspectHint?: string;
  defaultValue?: string;
}

export function ImageUploadField({
  name,
  label,
  prefix = 'thumbnails',
  aspectHint,
  defaultValue,
}: ImageUploadFieldProps) {
  const [url, setUrl] = useState(defaultValue ?? '');
  const [preview, setPreview] = useState(defaultValue ?? '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError('');
    setUploading(true);

    // クライアント側プレビュー
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    try {
      const body = new FormData();
      body.append('file', file);
      body.append('prefix', prefix);

      const res = await fetch('/api/upload', { method: 'POST', body });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'アップロードに失敗しました');
        setPreview(url); // 元に戻す
        return;
      }

      setUrl(data.url);
      setPreview(data.url);
    } catch {
      setError('アップロードに失敗しました');
      setPreview(url);
    } finally {
      setUploading(false);
      URL.revokeObjectURL(localUrl);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs text-white/60">
        {label}
        {aspectHint && <span className="ml-2 text-white/30">{aspectHint}</span>}
      </label>

      {/* hidden input: Server Action が読み取る値 */}
      <input type="hidden" name={name} value={url} />

      {/* プレビュー */}
      {preview && (
        <div className="relative w-full max-w-xs rounded-lg overflow-hidden border border-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="プレビュー" className="w-full h-auto object-cover" />
        </div>
      )}

      {/* アップロードボタン */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="px-4 py-2 rounded-lg text-sm font-bold bg-white/10 border border-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-50"
        >
          {uploading ? 'アップロード中…' : '画像を選択'}
        </button>

        {url && (
          <span className="text-xs text-white/40 truncate max-w-[200px]">{url.split('/').pop()}</span>
        )}
      </div>

      {/* ファイル入力（非表示） */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
