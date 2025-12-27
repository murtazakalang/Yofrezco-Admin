export const getZoneId = () => {
  if (typeof window !== "undefined") {
    return window.localStorage.getItem("zoneid");
  }
  return null;
};
