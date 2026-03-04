'use client';

import { RoundMetalButton } from '@/components/gacha/controls/RoundMetalButton';

export function OpenSkipOverlay({
  onOpen,
  onSkip,
  skipDisabled,
}: {
  onOpen: () => void;
  onSkip: () => void;
  skipDisabled?: boolean;
}) {
  return (
    <div className="absolute bottom-16 left-0 right-0 flex items-center justify-center gap-6 z-20">
      <RoundMetalButton
        label="OPEN"
        subLabel="開ける"
        onClick={onOpen}
      />
      <RoundMetalButton
        label="SKIP"
        subLabel="見送る"
        onClick={onSkip}
        disabled={skipDisabled}
      />
    </div>
  );
}
