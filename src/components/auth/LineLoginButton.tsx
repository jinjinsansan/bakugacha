'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import liff from '@line/liff';
import { isLineInAppBrowser, isMobileBrowser, openLineAppWithFallback } from '@/lib/auth/line-client';

interface LineLoginButtonProps {
  liffId: string;
  fallbackUrl: string | null;
}

export function LineLoginButton({ liffId, fallbackUrl }: LineLoginButtonProps) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liffReady, setLiffReady] = useState(false);
  const isInClientRef = useRef(false);
  const autoLoginTriedRef = useRef(false);
  const authInFlightRef = useRef(false);
  const liffInitializedRef = useRef(false);

  const processLiffLogin = useCallback(async () => {
    if (authInFlightRef.current) return;

    authInFlightRef.current = true;
    setProcessing(true);
    setError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    let redirected = false;

    try {
      const accessToken = liff.getAccessToken();
      if (!accessToken) {
        setError('アクセストークンが取得できませんでした。');
        return;
      }

      const res = await fetch('/api/line/login/liff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ accessToken }),
        signal: controller.signal,
      });

      if (res.ok) {
        redirected = true;
        window.location.href = '/home';
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'ログインに失敗しました。');
      }
    } catch (e) {
      console.error('LIFF login error', e);
      if (e instanceof DOMException && e.name === 'AbortError') {
        setError('ログイン処理がタイムアウトしました。もう一度お試しください。');
      } else {
        setError('ログイン中にエラーが発生しました。');
      }
    } finally {
      clearTimeout(timeoutId);
      authInFlightRef.current = false;
      if (!redirected) setProcessing(false);
    }
  }, []);

  useEffect(() => {
    if (!liffId) {
      setLiffReady(true);
      return;
    }

    // liff.init() がハングした場合の安全タイムアウト
    const timer = setTimeout(() => {
      setLiffReady(true);
      setError((prev) => prev ?? '初期化に時間がかかっています。ボタンを押して続行してください。');
    }, 10000);

    let cancelled = false;

    liff
      .init({ liffId })
      .then(() => {
        if (cancelled) return;
        clearTimeout(timer);
        liffInitializedRef.current = true;
        setLiffReady(true);
        isInClientRef.current = liff.isInClient();
        if (liff.isLoggedIn() && !autoLoginTriedRef.current) {
          autoLoginTriedRef.current = true;
          void processLiffLogin();
        }
      })
      .catch((err) => {
        if (cancelled) return;
        clearTimeout(timer);
        console.error('LIFF init error', err);
        setLiffReady(true);
        setError((prev) => prev ?? 'LINE初期化に失敗しました。再度お試しください。');
      });

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
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
        読み込み中...（最大10秒）
      </div>
    );
  }

  // ── LIFF設定済み ──
  if (liffId) {
    const handleClick = () => {
      if (processing) return;
      setError(null);

      const loginViaLiff = () => {
        if (!liffInitializedRef.current) {
          setError('LINE初期化中です。数秒後に再度お試しください。');
          return;
        }
        try {
          setProcessing(true);
          liff.login({ redirectUri: `${window.location.origin}/login` });
        } catch (e) {
          console.error('LIFF login start error', e);
          setProcessing(false);
          setError('LINEログインを開始できませんでした。');
        }
      };

      // LINE内ブラウザの場合: line://app/ は再度LINEを開こうとしてループするため
      // liff.login() を直接呼ぶ
      if (isInClientRef.current || isLineInAppBrowser()) {
        loginViaLiff();
        return;
      }

      // 外部モバイルブラウザ: line:// URL Scheme でLINEアプリを直接起動
      if (isMobileBrowser()) {
        openLineAppWithFallback(liffId, loginViaLiff);
      } else {
        loginViaLiff();
      }
    };

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
          onClick={handleClick}
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
