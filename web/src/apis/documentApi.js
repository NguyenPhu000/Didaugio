import api from "@/constants/api";

const BASE_URL = "/documents";

export const uploadDocument = async (businessId, type, file) => {
  // Lấy CSRF token từ Server trước khi upload tài liệu bảo mật
  const csrfResponse = await api.get("/auth/csrf");
  const csrfToken = csrfResponse?.data?.csrfToken || csrfResponse?.csrfToken;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);
  
  const response = await api.post(
    `${BASE_URL}/${businessId}/upload`,
    formData,
    {
      headers: { 
        "Content-Type": "multipart/form-data",
        "X-CSRF-Token": csrfToken,
      },
    },
  );
  return response;
};

export const getDocumentStatus = async (businessId) => {
  const response = await api.get(`${BASE_URL}/${businessId}/status`);
  return response;
};

export const downloadDocument = async (documentId) => {
  const response = await api.get(`${BASE_URL}/download/${documentId}`, {
    responseType: "blob",
  });
  return response;
};

export const deleteDocument = async (businessId, documentId) => {
  const response = await api.delete(`${BASE_URL}/${businessId}/${documentId}`);
  return response;
};

export default {
  uploadDocument,
  getDocumentStatus,
  downloadDocument,
  deleteDocument,
};
