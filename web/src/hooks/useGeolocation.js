import { useState, useCallback, useRef, useEffect } from "react";

/**
 * Centralized geolocation hook for the web application.
 * Wraps the browser's navigator.geolocation API with proper state management.
 *
 * @param {Object} options
 * @param {boolean} options.watch - Continuously watch position (default: false)
 * @param {number} options.timeout - Timeout in ms (default: 10000)
 * @param {number} options.maximumAge - Max cache age in ms (default: 60000)
 * @returns {{ latitude, longitude, accuracy, loading, error, errorCode, locateNow, clearWatch }}
 */
const useGeolocation = ({
  watch = false,
  timeout = 10000,
  maximumAge = 60000,
} = {}) => {
  const [position, setPosition] = useState({
    latitude: null,
    longitude: null,
    accuracy: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorCode, setErrorCode] = useState(null);
  const watchIdRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const clearWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const handleSuccess = useCallback((pos) => {
    if (!mountedRef.current) return;
    setPosition({
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
    });
    setLoading(false);
    setError(null);
    setErrorCode(null);
  }, []);

  const handleError = useCallback((err) => {
    if (!mountedRef.current) return;
    setLoading(false);
    setError(err.message);
    setErrorCode(err.code);
  }, []);

  const geoOptions = { enableHighAccuracy: true, timeout, maximumAge };

  const locateNow = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser");
      setErrorCode(-1);
      return;
    }

    setLoading(true);
    setError(null);
    setErrorCode(null);

    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      geoOptions,
    );
  }, [handleSuccess, handleError, timeout, maximumAge]);

  // Auto-watch mode
  useEffect(() => {
    if (!watch) return;
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser");
      setErrorCode(-1);
      return;
    }

    setLoading(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      geoOptions,
    );

    return clearWatch;
  }, [watch, handleSuccess, handleError, clearWatch, timeout, maximumAge]);

  // Cleanup on unmount
  useEffect(() => {
    return clearWatch;
  }, [clearWatch]);

  return {
    ...position,
    loading,
    error,
    errorCode,
    locateNow,
    clearWatch,
  };
};

export default useGeolocation;
