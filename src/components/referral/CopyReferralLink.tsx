'use client';

import { useState } from 'react';

interface Props {
  referralCode: string;
  bonusAmount: number;
}

export function CopyReferralLink({ referralCode, bonusAmount }: Props) {
  const [copied, setCopied] = useState(false);

  const referralUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/login?ref=${referralCode}`
    : `/login?ref=${referralCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // フォールバック: input select + execCommand
      const input = document.createElement('input');
      input.value = referralUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] tracking-[0.3em] text-gray-500 uppercase mb-1">友達紹介</p>
          <p className="text-sm text-white/70">
            友達を紹介すると <span className="text-gold font-bold">{bonusAmount}コイン</span> GET!
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white/60 truncate select-all">
          {referralUrl}
        </div>
        <button
          onClick={handleCopy}
          className="shrink-0 px-4 py-2 rounded-lg text-xs font-bold transition"
          style={{
            background: copied
              ? 'rgba(74, 222, 128, 0.2)'
              : 'linear-gradient(135deg, rgba(201,168,76,0.3), rgba(201,168,76,0.1))',
            border: copied ? '1px solid rgba(74, 222, 128, 0.4)' : '1px solid rgba(201,168,76,0.3)',
            color: copied ? '#4ade80' : '#c9a84c',
          }}
        >
          {copied ? 'コピー済み!' : 'コピー'}
        </button>
      </div>

      <p className="text-[10px] text-gray-600">
        このリンクから登録した友達にも特典コインがプレゼントされます
      </p>
    </div>
  );
}
