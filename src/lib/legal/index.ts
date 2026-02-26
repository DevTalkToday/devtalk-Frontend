import { termsDocument } from "@/lib/legal/terms";
import { privacyDocument } from "@/lib/legal/privacy";

export const legalDocuments = {
  terms: termsDocument,
  privacy: privacyDocument,
} as const;

export type LegalDocumentKey = keyof typeof legalDocuments;