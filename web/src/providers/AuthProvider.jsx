/**
 * AUTH PROVIDER
 * Zustand `persist` middleware already restores auth state from localStorage
 * synchronously before the first render. No manual restoration needed.
 */
export const AuthProvider = ({ children }) => children;
