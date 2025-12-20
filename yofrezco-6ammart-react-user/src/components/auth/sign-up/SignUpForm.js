import React from "react";
import { CustomStackFullWidth } from "styled-components/CustomStyles.style";
import CustomTextFieldWithFormik from "../../form-fields/CustomTextFieldWithFormik";
import CustomPhoneInput from "../../custom-component/CustomPhoneInput";
import { t } from "i18next";
import { alpha, Grid, InputAdornment, NoSsr, useTheme, MenuItem, TextField } from "@mui/material";
import { getLanguage } from "helper-functions/getLanguage";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import MailIcon from "@mui/icons-material/Mail";
import LockIcon from "@mui/icons-material/Lock";
import GroupIcon from "@mui/icons-material/Group";
import PublicIcon from "@mui/icons-material/Public";
import CakeIcon from "@mui/icons-material/Cake";
import WcIcon from "@mui/icons-material/Wc";

const SignUpForm = ({
  configData,
  handleOnChange,
  passwordHandler,
  lNameHandler,
  fNameHandler,
  confirmPasswordHandler,
  emailHandler,
  ReferCodeHandler,
  signUpFormik,
  genderHandler,
  nationalityHandler,
  birthdateHandler,
}) => {
  const lanDirection = getLanguage() ? getLanguage() : "ltr";
  const theme = useTheme();

  const genderOptions = [
    { value: "male", label: t("Male") },
    { value: "female", label: t("Female") },
    { value: "other", label: t("Other") },
    { value: "prefer_not_to_say", label: t("Prefer not to say") },
  ];

  return (
    <NoSsr>
      <Grid container spacing={2.5}>
        {/* First Name */}
        <Grid item xs={12} md={6}>
          <CustomTextFieldWithFormik
            required
            label={t("First Name")}
            placeholder={t("Enter first name")}
            touched={signUpFormik.touched.f_name}
            errors={signUpFormik.errors.f_name}
            fieldProps={signUpFormik.getFieldProps("f_name")}
            onChangeHandler={fNameHandler}
            value={signUpFormik.values.f_name}
            startIcon={
              <InputAdornment position="start">
                <AccountCircleIcon
                  sx={{
                    color:
                      signUpFormik.touched.f_name && !signUpFormik.errors.f_name
                        ? theme.palette.primary.main
                        : alpha(theme.palette.neutral[500], 0.4),
                  }}
                />
              </InputAdornment>
            }
          />
        </Grid>

        {/* Last Name */}
        <Grid item xs={12} md={6}>
          <CustomTextFieldWithFormik
            required
            label={t("Last Name")}
            placeholder={t("Enter last name")}
            touched={signUpFormik.touched.l_name}
            errors={signUpFormik.errors.l_name}
            fieldProps={signUpFormik.getFieldProps("l_name")}
            onChangeHandler={lNameHandler}
            value={signUpFormik.values.l_name}
            startIcon={
              <InputAdornment position="start">
                <AccountCircleIcon
                  sx={{
                    color:
                      signUpFormik.touched.l_name && !signUpFormik.errors.l_name
                        ? theme.palette.primary.main
                        : alpha(theme.palette.neutral[500], 0.4),
                  }}
                />
              </InputAdornment>
            }
          />
        </Grid>

        {/* Email */}
        <Grid item xs={12} md={6}>
          <CustomTextFieldWithFormik
            required
            label={t("Email")}
            placeholder={t("Email")}
            touched={signUpFormik.touched.email}
            errors={signUpFormik.errors.email}
            fieldProps={signUpFormik.getFieldProps("email")}
            onChangeHandler={emailHandler}
            value={signUpFormik.values.email}
            startIcon={
              <InputAdornment position="start">
                <MailIcon
                  sx={{
                    color:
                      signUpFormik.touched.email && !signUpFormik.errors.email
                        ? theme.palette.primary.main
                        : alpha(theme.palette.neutral[500], 0.4),
                  }}
                />
              </InputAdornment>
            }
          />
        </Grid>

        {/* Phone */}
        <Grid item xs={12} md={6}>
          <CustomPhoneInput
            value={signUpFormik.values.phone}
            onHandleChange={handleOnChange}
            initCountry={configData?.country}
            touched={signUpFormik.touched.phone}
            errors={signUpFormik.errors.phone}
            lanDirection={lanDirection}
            height="45px"
            borderRadius="10px"
          />
        </Grid>

        {/* Gender */}
        <Grid item xs={12} md={6}>
          <TextField
            select
            fullWidth
            required
            label={t("Gender")}
            value={signUpFormik.values.gender || ""}
            onChange={(e) => {
              signUpFormik.setFieldValue("gender", e.target.value);
              if (genderHandler) genderHandler(e.target.value);
            }}
            error={signUpFormik.touched.gender && Boolean(signUpFormik.errors.gender)}
            helperText={signUpFormik.touched.gender && signUpFormik.errors.gender}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <WcIcon
                    sx={{
                      color:
                        signUpFormik.touched.gender && !signUpFormik.errors.gender
                          ? theme.palette.primary.main
                          : alpha(theme.palette.neutral[500], 0.4),
                    }}
                  />
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
              },
            }}
          >
            {genderOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Birthdate */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            required
            type="date"
            label={t("Date of Birth")}
            value={signUpFormik.values.birthdate || ""}
            onChange={(e) => {
              signUpFormik.setFieldValue("birthdate", e.target.value);
              if (birthdateHandler) birthdateHandler(e.target.value);
            }}
            error={signUpFormik.touched.birthdate && Boolean(signUpFormik.errors.birthdate)}
            helperText={signUpFormik.touched.birthdate && signUpFormik.errors.birthdate}
            InputLabelProps={{
              shrink: true,
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CakeIcon
                    sx={{
                      color:
                        signUpFormik.touched.birthdate && !signUpFormik.errors.birthdate
                          ? theme.palette.primary.main
                          : alpha(theme.palette.neutral[500], 0.4),
                    }}
                  />
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
              },
            }}
          />
        </Grid>

        {/* Nationality */}
        <Grid item xs={12} md={6}>
          <CustomTextFieldWithFormik
            required
            label={t("Nationality")}
            placeholder={t("Enter nationality")}
            touched={signUpFormik.touched.nationality}
            errors={signUpFormik.errors.nationality}
            fieldProps={signUpFormik.getFieldProps("nationality")}
            onChangeHandler={nationalityHandler}
            value={signUpFormik.values.nationality}
            startIcon={
              <InputAdornment position="start">
                <PublicIcon
                  sx={{
                    color:
                      signUpFormik.touched.nationality && !signUpFormik.errors.nationality
                        ? theme.palette.primary.main
                        : alpha(theme.palette.neutral[500], 0.4),
                  }}
                />
              </InputAdornment>
            }
          />
        </Grid>

        {/* Refer Code */}
        {configData?.customer_wallet_status === 1 &&
          configData?.ref_earning_status === 1 && (
            <Grid item xs={12} md={6}>
              <CustomTextFieldWithFormik
                label={t("Refer Code (Optional)")}
                touched={signUpFormik.touched.ref_code}
                errors={signUpFormik.errors.ref_code}
                fieldProps={signUpFormik.getFieldProps("ref_code")}
                onChangeHandler={ReferCodeHandler}
                value={signUpFormik.values.ref_code}
                placeholder={t("Refer Code")}
                startIcon={
                  <InputAdornment position="start">
                    <GroupIcon
                      sx={{
                        color:
                          signUpFormik.touched.ref_code &&
                          !signUpFormik.errors.ref_code
                            ? theme.palette.primary.main
                            : alpha(theme.palette.neutral[500], 0.4),
                      }}
                    />
                  </InputAdornment>
                }
              />
            </Grid>
          )}

        {/* Password */}
        <Grid item xs={12} md={6}>
          <CustomTextFieldWithFormik
            required
            type="password"
            label={t("Password")}
            placeholder={t("Minimum 8 characters")}
            touched={signUpFormik.touched.password}
            errors={signUpFormik.errors.password}
            fieldProps={signUpFormik.getFieldProps("password")}
            onChangeHandler={passwordHandler}
            value={signUpFormik.values.password}
            startIcon={
              <InputAdornment position="start">
                <LockIcon
                  sx={{
                    color:
                      signUpFormik.touched.password &&
                      !signUpFormik.errors.password
                        ? theme.palette.primary.main
                        : alpha(theme.palette.neutral[500], 0.4),
                  }}
                />
              </InputAdornment>
            }
          />
        </Grid>

        {/* Confirm Password */}
        <Grid item xs={12} md={6}>
          <CustomTextFieldWithFormik
            required
            type="password"
            label={t("Confirm Password")}
            placeholder={t("Re-enter your password")}
            touched={signUpFormik.touched.confirm_password}
            errors={signUpFormik.errors.confirm_password}
            fieldProps={signUpFormik.getFieldProps("confirm_password")}
            onChangeHandler={confirmPasswordHandler}
            value={signUpFormik.values.confirm_password}
            startIcon={
              <InputAdornment position="start">
                <LockIcon
                  sx={{
                    color:
                      signUpFormik.touched.confirm_password &&
                      !signUpFormik.errors.confirm_password
                        ? theme.palette.primary.main
                        : alpha(theme.palette.neutral[500], 0.4),
                  }}
                />
              </InputAdornment>
            }
          />
        </Grid>
      </Grid>
    </NoSsr>
  );
};

export default SignUpForm;
