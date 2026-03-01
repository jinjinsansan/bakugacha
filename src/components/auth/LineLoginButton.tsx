'use client';

import { useEffect, useState, useCallback } from 'react';
import liff from '@line/liff';

interface LineLoginButtonProps {
  liffId: string;
  fallbackUrl: string | null;
}

export function LineLoginButton({ liffId, fallbackUrl }: LineLoginButtonProps) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liffReady, setLiffReady] = useState(false);

  const processLiffLogin = useCallback(async () => {
    setProcessing(true);
    try {
      const accessToken = liff.getAccessToken();
      if (!accessToken) {
        setError('アクセストークンが取得できませんでした。');
        setProcessing(false);
        return;
      }

      const res = await fetch('/api/line/login/liff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ accessToken }),
      });

      if (res.ok) {
        window.location.href = '/home';
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'ログインに失敗しました。');
        setProcessing(false);
      }
    } catch (e) {
      console.error('LIFF login error', e);
      setError('ログイン中にエラーが発生しました。');
      setProcessing(false);
    }
  }, []);

  useEffect(() => {
    if (!liffId) {
      setLiffReady(true);
      return;
    }

    liff
      .init({ liffId })
      .then(() => {
        if (liff.isLoggedIn()) {
          // LIFF URL経由でLINEアプリ内ブラウザから開かれた
          // → 自動的にログイン処理を実行
          processLiffLogin();
        } else {
          setLiffReady(true);
        }
      })
      .catch((err) => {
        console.error('LIFF init error', err);
        setLiffReady(true);
      });
  }, [liffId, processLiffLogin]);

  // LIFF処理中（LINEアプリ内で認証→セッション作成中）
  if (processing) {
    return (
      <div
        className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-black text-sm text-white"
        style={{
          background: 'linear-gradient(135deg, #06c755, #00a64f)',
          opacity: 0.8,
        }}
      >
        <span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
        ログイン中...
      </div>
    );
  }

  // 初期化中
  if (!liffReady) {
    return (
      <div
        className="flex items-center justify-center w-full py-4 rounded-xl font-black text-sm text-white/50"
        style={{ background: 'linear-gradient(135deg, #06c755, #00a64f)', opacity: 0.6 }}
      >
        読み込み中...
      </div>
    );
  }

  // ── LIFF設定済み ──
  // 外部ブラウザ・LINE内ブラウザどちらでも liff.login() を呼ぶ。
  // モバイル（LINE インストール済み）では LINE アプリが起動して認証される。
  if (liffId) {
    return (
      <>
        {error && (
          <div
            className="mb-4 rounded-xl px-4 py-3 text-sm text-red-300"
            style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)' }}
          >
            {error}
          </div>
        )}
        <button
          onClick={() => liff.login()}
          className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-black tracking-wider text-sm text-white transition hover:opacity-90"
          style={{
            background: 'linear-gradient(135deg, #06c755, #00a64f)',
            boxShadow: '0 4px 20px rgba(6,199,85,0.3)',
          }}
        >
          LINEでログイン / 登録
        </button>
      </>
    );
  }

  // ── LIFFなし → 従来のOAuth直接リンク ──
  if (fallbackUrl) {
    return (
      <a
        href={fallbackUrl}
        className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-black tracking-wider text-sm text-white transition hover:opacity-90"
        style={{
          background: 'linear-gradient(135deg, #06c755, #00a64f)',
          boxShadow: '0 4px 20px rgba(6,199,85,0.3)',
        }}
      >
        LINEでログイン / 登録
      </a>
    );
  }

  return null;
}
