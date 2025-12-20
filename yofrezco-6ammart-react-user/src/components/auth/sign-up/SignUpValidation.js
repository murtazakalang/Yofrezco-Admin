import * as Yup from "yup";
import { useTranslation } from "react-i18next";

const SignUpValidation = () => {
  const { t } = useTranslation();

  // Calculate the date 13 years ago
  const thirteenYearsAgo = new Date();
  thirteenYearsAgo.setFullYear(thirteenYearsAgo.getFullYear() - 13);

  return Yup.object({
    f_name: Yup.string().required(t("First name is required")),
    l_name: Yup.string().required(t("Last name is required")),
    email: Yup.string()
      .email(t("Must be a valid email"))
      .max(255)
      .required(t("Email is required")),
    phone: Yup.string()
      .required(t("Please give a phone number"))
      .min(10, "Number must be 10 digits"),
    gender: Yup.string().required(t("Gender is required")),
    nationality: Yup.string().required(t("Nationality is required")),
    birthdate: Yup.date()
      .required(t("Date of birth is required"))
      .max(thirteenYearsAgo, t("You must be at least 13 years old")),
    password: Yup.string()
      .required(t("Password is required"))
      .min(6, t("Password is too short - should be 6 chars minimum.")),
    confirm_password: Yup.string()
      .required(t("Confirm Password"))
      .oneOf([Yup.ref("password"), null], t("Passwords must match")),
  });
};

export default SignUpValidation;
