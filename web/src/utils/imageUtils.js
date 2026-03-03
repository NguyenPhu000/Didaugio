import { IMAGE_UPLOAD_CONFIG } from "@/constants/placeConstants";

const { MAX_WIDTH, MAX_HEIGHT, JPEG_QUALITY } = IMAGE_UPLOAD_CONFIG;

export const compressImage = (file, currentImagesLength) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
        resolve({
          imageData: dataUrl,
          caption: "",
          isCover: currentImagesLength === 0,
          order: currentImagesLength,
        });
      };
      img.onerror = () => reject("Định dạng hình ảnh không hợp lệ");
    };
    reader.onerror = () => reject("Không thể đọc file");
  });
};
