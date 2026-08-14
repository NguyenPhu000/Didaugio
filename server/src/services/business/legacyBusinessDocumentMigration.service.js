const LEGACY_DOCUMENT_FIELDS = [
  {
    field: "idCardFront",
    publicIdField: "idCardFrontPublicId",
    type: "id_card_front",
  },
  {
    field: "idCardBack",
    publicIdField: "idCardBackPublicId",
    type: "id_card_back",
  },
  {
    field: "businessLicense",
    publicIdField: "businessLicensePublicId",
    type: "business_license",
  },
];

export const buildLegacyBusinessDocumentCleanup = (
  business,
  encryptedDocumentTypes,
) => {
  const data = {};
  const missingTypes = [];

  for (const { field, publicIdField, type } of LEGACY_DOCUMENT_FIELDS) {
    if (!business[field] && !business[publicIdField]) continue;

    data[field] = null;
    data[publicIdField] = null;
    if (!encryptedDocumentTypes.has(type)) missingTypes.push(type);
  }

  return { data, missingTypes };
};
