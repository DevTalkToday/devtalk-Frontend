const ADSENSE_CLIENT_FALLBACK = "ca-pub-6481460578393836";
const ADSENSE_CLIENT_PLACEHOLDER = "ca-pub-your-publisher-id";
const ADSENSE_SLOT_PLACEHOLDER = "your-display-ad-slot-id";
const ADSENSE_SELLER_HOST = "google.com";
const ADSENSE_RELATIONSHIP = "DIRECT";
const ADSENSE_CERTIFICATION_ID = "f08c47fec0942fa0";

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

export const getAdsenseAccountMeta = () => getAdsenseClient();

export const getAdsensePublisherId = () => getAdsenseClient().replace(/^ca-/, "");

export const getAdsTxtEntry = () =>
  `${ADSENSE_SELLER_HOST}, ${getAdsensePublisherId()}, ${ADSENSE_RELATIONSHIP}, ${ADSENSE_CERTIFICATION_ID}`;
