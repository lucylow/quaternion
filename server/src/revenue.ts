// revenue.ts
export type CreatorShare = {
  creatorId?: string | null;
  creatorPct: number; // 0..1
  platformPct: number;
  studioPct: number;
};

export function computeShares(grossCents: number, share: CreatorShare) {
  const creator = Math.round(grossCents * share.creatorPct);
  const platform = Math.round(grossCents * share.platformPct);
  const studio = grossCents - creator - platform;
  return { creator, platform, studio };
}

// default split: platform (20%), creator (30% if code present), rest to studio
export function defaultSplit(hasCreator: boolean) {
  if (hasCreator) return { creatorPct: 0.30, platformPct: 0.20, studioPct: 0.50 };
  return { creatorPct: 0, platformPct: 0.20, studioPct: 0.80 };
}

