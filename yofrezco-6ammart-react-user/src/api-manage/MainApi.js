import axios from "axios";
export const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
const MainApi = axios.create({
  baseURL: baseUrl,
});

// Cache for localStorage values to avoid reading on every request
let headerCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 3000; // 3 seconds cache - updates quickly but reduces reads

const getHeadersFromStorage = () => {
  const now = Date.now();

  // Return cached headers if still fresh
  if (headerCache && (now - cacheTimestamp) < CACHE_TTL) {
    return headerCache;
  }

  // Read from localStorage and update cache
  if (typeof window !== "undefined") {
    try {
      headerCache = {
        zoneid: localStorage.getItem("zoneid"),
        token: localStorage.getItem("token"),
        language: JSON.parse(localStorage.getItem("language-setting") || "null"),
        currentLocation: JSON.parse(localStorage.getItem("currentLatLng") || "null"),
        moduleid: JSON.parse(localStorage.getItem("module") || "null")?.id
      };
      cacheTimestamp = now;
    } catch (error) {
      // Fallback to empty headers if parsing fails
      console.warn("Error parsing localStorage:", error);
      headerCache = {};
    }
  } else {
    headerCache = {};
  }

  return headerCache;
};

// Function to invalidate cache when localStorage changes
export const invalidateHeaderCache = () => {
  headerCache = null;
  cacheTimestamp = 0;
};

MainApi.interceptors.request.use(function (config) {
  const software_id = 33571750;
  const hostname = process.env.NEXT_CLIENT_HOST_URL;

  // Get cached headers
  const headers = getHeadersFromStorage();

  if (headers.currentLocation) {
    config.headers.latitude = headers.currentLocation.lat;
    config.headers.longitude = headers.currentLocation.lng;
  }
  if (headers.zoneid) config.headers.zoneid = headers.zoneid;
  if (headers.moduleid) config.headers.moduleId = headers.moduleid;
  if (headers.token) config.headers.authorization = `Bearer ${headers.token}`;
  if (headers.language) config.headers["X-localization"] = headers.language;
  if (hostname) config.headers["origin"] = hostname;
  config.headers["X-software-id"] = software_id;
  config.headers["Accept"] = 'application/json';
  config.headers["ngrok-skip-browser-warning"] = true;

  return config;
});
// MainApi.interceptors.response.use(
//     (response) => response,
//     (error) => {
//         if (error.response.status === 401) {
//             toast.error(t('Your token has been expired.please sign in again'), {
//                 id: 'error',
//             })
//             localStorage.removeItem('token')
//             store.dispatch(removeToken())
//         }
//         return Promise.reject(error)
//     }
// )

export default MainApi;
