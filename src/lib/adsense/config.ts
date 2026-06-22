const ADSENSE_CLIENT_FALLBACK = "ca-pub-6481460578393836";
const ADSENSE_CLIENT_PLACEHOLDER = "ca-pub-your-publisher-id";
const ADSENSE_SLOT_PLACEHOLDER = "your-display-ad-slot-id";

export const getAdsenseClient = () => {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim();
  if (!client || client === ADSENSE_CLIENT_PLACEHOLDER) {
    return ADSENSE_CLIENT_FALLBACK;
  }

  return client;
};

export const getAdsenseSlot = () => {
  const slot = process.env.NEXT_PUBLIC_ADSENSE_TEST_SLOT?.trim();
  if (!slot || slot === ADSENSE_SLOT_PLACEHOLDER) {
    return undefined;
  }

  return slot;
};
