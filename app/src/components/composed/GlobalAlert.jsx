import { useAlertStore } from "../../stores/alertStore";
import CustomAlertModal from "./CustomAlertModal";

export const GlobalAlert = () => {
  const { visible, title, message, type, buttons, options, hideAlert } = useAlertStore();

  const handleConfirm = () => {
    hideAlert();
  };

  return (
    <CustomAlertModal
      visible={visible}
      title={title}
      message={message}
      type={type}
      buttons={buttons}
      onConfirm={handleConfirm}
      isLoading={options?.isLoading}
    />
  );
};
