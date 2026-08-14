import {
  deleteDocument as removeStoredDocument,
  uploadDocument,
} from "../document/documentStorage.service.js";

const BUSINESS_DOCUMENT_FIELDS = [
  { field: "idCardFront", type: "id_card_front" },
  { field: "idCardBack", type: "id_card_back" },
  { field: "businessLicense", type: "business_license" },
  { field: "certificate", type: "certificate" },
];

export const collectBusinessSensitiveDocuments = (files = {}) =>
  BUSINESS_DOCUMENT_FIELDS.flatMap(({ field, type }) => {
    const filesForField = files[field] || [];
    return filesForField.flatMap((file) =>
      file?.buffer
        ? [
            {
              type,
              buffer: file.buffer,
              mimeType: file.mimetype,
              originalName: file.originalname,
            },
          ]
        : [],
    );
  });

export const withoutBusinessSensitiveDocumentFields = ({
  idCardFront: _idCardFront,
  idCardBack: _idCardBack,
  businessLicense: _businessLicense,
  certificate: _certificate,
  ...data
} = {}) => data;

export const removeBusinessSensitiveDocuments = async ({
  businessId,
  documents = [],
  deleteDocument = removeStoredDocument,
}) =>
  Promise.allSettled(
    documents
      .filter((document) => document?.id)
      .map((document) =>
        deleteDocument({ businessId, documentId: document.id }),
      ),
  );

export const storeBusinessSensitiveDocuments = async ({
  businessId,
  documents = [],
  uploadDocument: persistDocument = uploadDocument,
  deleteDocument = removeStoredDocument,
}) => {
  const stored = [];

  try {
    for (const document of documents) {
      const record = await persistDocument({
        businessId,
        ...document,
      });
      stored.push(record);
    }
    return stored;
  } catch (error) {
    await removeBusinessSensitiveDocuments({
      businessId,
      documents: stored,
      deleteDocument,
    });
    throw error;
  }
};
