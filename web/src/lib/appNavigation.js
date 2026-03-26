/**
 * Cho phép điều hướng SPA từ ngoài React (vd. axios interceptor).
 * Đăng ký một lần từ component trong <BrowserRouter>.
 */
let navigateRef = null;

export function registerAppNavigate(navigate) {
  navigateRef = navigate;
}

export function appNavigate(to, options) {
  if (typeof navigateRef === "function") {
    navigateRef(to, options);
    return;
  }
  if (typeof window !== "undefined") {
    window.location.assign(to);
  }
}
