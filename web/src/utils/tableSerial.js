export const getTableSerialNumber = (totalItems, rowIndex, page = 1, pageSize = totalItems) => {
  const total = Number(totalItems) || 0;
  const index = Number(rowIndex) || 0;
  const currentPage = Math.max(Number(page) || 1, 1);
  const limit = Math.max(Number(pageSize) || total || 1, 1);
  const absoluteIndex = (currentPage - 1) * limit + index;

  return Math.max(total - absoluteIndex, 0);
};

export const formatTableSerial = (
  totalItems,
  rowIndex,
  { page = 1, pageSize = totalItems, pad = 2 } = {},
) => String(getTableSerialNumber(totalItems, rowIndex, page, pageSize)).padStart(pad, "0");
