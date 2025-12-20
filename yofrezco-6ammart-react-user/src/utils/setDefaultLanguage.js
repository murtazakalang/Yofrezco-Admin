export const setDefaultLanguage = () => {
  const lan = "es";
  const country = "ES";
  localStorage.setItem("language-setting", JSON.stringify(lan));
  localStorage.setItem("country", JSON.stringify(country));
};
