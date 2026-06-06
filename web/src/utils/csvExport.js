/**
 * CSV Export Utility
 * Không cần thư viện ngoài - dùng native Blob API
 * BOM prefix để Excel mở đúng tiếng Việt
 */

import i18n from "@/i18n";

const BOM = "﻿";

/**
 * Escape giá trị CSV (bao xử lý dấu phẩy, ngoặc kép, xuống dòng)
 */
function escapeCsvValue(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Xuất dữ liệu ra file CSV và tải về
 * @param {Object} options
 * @param {Array<{key: string, label: string}>} options.columns - Định nghĩa cột
 * @param {Array<Object>} options.data - Dữ liệu (mỗi phần tử là 1 object)
 * @param {string} options.filename - Tên file (không cần đuôi .csv)
 */
export function exportToCsv({ columns, data, filename }) {
  if (!data || data.length === 0) {
    alert(i18n.t("csvExport.noData"));
    return;
  }

  // Header row
  const header = columns.map((col) => escapeCsvValue(col.label)).join(",");

  // Data rows
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value =
          typeof col.key === "function"
            ? col.key(row)
            : row[col.key];
        return escapeCsvValue(value);
      })
      .join(",")
  );

  const csvContent = BOM + [header, ...rows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Fetch toàn bộ dữ liệu (xử lý phân trang tự động)
 * @param {Function} fetcher - async (params) => { data, pagination }
 * @param {Object} baseParams - Params gốc (không bao gồm page/limit)
 * @param {number} pageSize - Số item mỗi trang
 * @returns {Promise<Array>}
 */
export async function fetchAllPages(fetcher, baseParams = {}, pageSize = 100) {
  let allData = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const response = await fetcher({
      ...baseParams,
      page,
      limit: pageSize,
    });

    if (response.success && response.data) {
      allData = allData.concat(response.data);
      totalPages = response.pagination?.totalPages || 1;
    } else {
      break;
    }
    page++;
  }

  return allData;
}

/**
 * Format ngày giờ Việt Nam
 */
export function formatCsvDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Tạo tên file từ tiêu đề
 */
export function slugifyFilename(title) {
  return title
    .toLowerCase()
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a")
    .replace(/[èéẹẻẽêềếệểễ]/g, "e")
    .replace(/[ìíịỉĩ]/g, "i")
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o")
    .replace(/[ùúụủũưừứựửữ]/g, "u")
    .replace(/[ỳýỵỷỹ]/g, "y")
    .replace(/đ/g, "d")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}
