const base64Url = (buf: ArrayBuffer) => {
  const bytes = new Uint8Array(buf);
  let str = "";
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

export const hasSecurePkceSupport = () =>
  typeof crypto !== "undefined" &&
  typeof crypto.getRandomValues === "function" &&
  typeof crypto.subtle?.digest === "function";

export const randomString = (len = 32) => {
  if (typeof crypto === "undefined" || typeof crypto.getRandomValues !== "function") {
    throw new Error("Web Crypto is not available in this browser.");
  }
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return base64Url(bytes.buffer);
};

export const sha256 = async (input: string) => {
  if (!hasSecurePkceSupport()) {
    throw new Error("PKCE requires a secure browser context.");
  }
  const data = new TextEncoder().encode(input);
  return crypto.subtle.digest("SHA-256", data);
};

export const createPKCE = async () => {
  const verifier = randomString(64);
  const challenge = base64Url(await sha256(verifier));
  return { verifier, challenge };
};
