import Constants from "expo-constants";

const ENV = {
  dev: {
    apiUrl: "http://192.168.1.13:8080/api", // Replace with your LAN IP
  },
  prod: {
    apiUrl: "https://api.didaugio.vn/api",
  },
};

const getEnvVars = (env = Constants.manifest?.releaseChannel) => {
  // What is __DEV__ ?
  // This variable is set to true when react-native is running in Dev mode.
  if (__DEV__) {
    return ENV.dev;
  } else {
    return ENV.prod;
  }
};

export const API_BASE_URL = getEnvVars().apiUrl;
export const TIMEOUT = 10000;
