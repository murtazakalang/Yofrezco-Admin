import { Avatar, Grid } from "@mui/material";
import { Box } from "@mui/system";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getImageUrl } from "utils/CustomFunctions";
import useGetModule from "../../../api-manage/hooks/react-query/useGetModule";
import { getLanguage } from "helper-functions/getLanguage";
import { setModules } from "redux/slices/configData";
import {
	CustomBoxFullWidth,
	CustomStackFullWidth,
} from "styled-components/CustomStyles.style";
import CustomImageContainer from "../../CustomImageContainer";
import AddressReselect from "../top-navbar/address-reselect/AddressReselect";
import DrawerMenu from "../top-navbar/drawer-menu/DrawerMenu";
import MobileModuleSelection from "./mobile-module-select";
import CustomLogo from "components/logo/CustomLogo";

const ModuleWiseNav = (props) => {
	const {
		router,
		configData,
		token,
		setToggled,
		location,
		setOpenSignIn,
		setModalFor,
	} = props;

	const { modules } = useSelector((state) => state.configData);
	const [openDrawer, setOpenDrawer] = useState(false);
	const { data, refetch } = useGetModule();
	const { profileInfo } = useSelector((state) => state.profileInfo);
	const profileImageUrl = `${getImageUrl(
		profileInfo?.storage,
		"customer_image_url",
		configData
	)}/${profileInfo?.image}`;
	const favIcon = configData?.logo_full_url;
	const lanDirection = getLanguage();
	const dispatch = useDispatch();
	useEffect(() => {
		if (modules?.length === 0) {
			refetch();
			//dispatch(setModules(data));
		}
	}, [modules]);
	useEffect(() => {
		if (data?.length > 0) {
			dispatch(setModules(data));
		}
	}, [data]);
	const handleProfileClick = () => {
		if (token) {
			router.push(
				{ pathname: "/profile", query: { page: "profile-settings" } },
				undefined,
				{ shallow: true }
			);
		} else {
			setModalFor("sign-in");
			setOpenSignIn(true);
		}
	};

	const handleFlexendSide = () => (
		<CustomStackFullWidth
			direction="row"
			justifyContent="flex-end"
			alignItems="center"
		>
			<DrawerMenu
				setToggled={setToggled}
				setOpenDrawer={setOpenDrawer}
				openDrawer={openDrawer}
			/>
		</CustomStackFullWidth>
	);
	const handleIconClick = () => {
		if (location) {
			router.push("/home");
		} else {
			router.push("/");
		}
	};
	const getIcon = () => (
		<Box
			onClick={handleIconClick}
			sx={{
				height: "40px",
				position: "relative",
				cursor: "pointer",
				display: "flex",
				justifyContent: "flex-start", // aligns left
				alignItems: "center",
				p: 0, // remove padding
				m: 0, // remove margin
				"& img": {
					maxHeight: "100%",
					display: "block",
				},
			}}
		>
			<CustomLogo
				atlText="logo"
				logoImg={favIcon}
				width="150px"
				height="40px"
				objectFit="contain"
				style={{ marginLeft: 0 }} // force left if needed
			/>
		</Box>
	);
	return (
		<CustomStackFullWidth>
			{!!modules && (
				<Box sx={{ width: '100%' }}>
					{/* Row 1: Centered Logo */}
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
							width: '100%',
							py: 1,
						}}
					>
						{router.pathname === "/home" && !router.query.search ? (
							modules.length >= 2 ? (
								<MobileModuleSelection />
							) : (
								<Box
									onClick={handleIconClick}
									sx={{
										height: "40px",
										cursor: "pointer",
										display: "flex",
										justifyContent: "center",
										alignItems: "center",
									}}
								>
									<CustomLogo
										atlText="logo"
										logoImg={favIcon}
										width="150px"
										height="40px"
										objectFit="contain"
									/>
								</Box>
							)
						) : (
							<Box
								onClick={handleIconClick}
								sx={{
									height: "40px",
									cursor: "pointer",
									display: "flex",
									justifyContent: "center",
									alignItems: "center",
								}}
							>
								<CustomLogo
									atlText="logo"
									logoImg={favIcon}
									width="150px"
									height="40px"
									objectFit="contain"
								/>
							</Box>
						)}
					</Box>

					{/* Row 2: Address (left) and Menu (right) */}
					<Grid container alignItems="center" sx={{ py: 0.5 }}>
						<Grid item xs={10} align="left">
							{location ? (
								<AddressReselect
									setOpenDrawer={setOpenDrawer}
									location={location}
									openDrawer={openDrawer}
								/>
							) : null}
						</Grid>
						<Grid item xs={2} align="right">
							{handleFlexendSide()}
						</Grid>
					</Grid>
				</Box>
			)}
		</CustomStackFullWidth>
	);
};

ModuleWiseNav.propTypes = {};

export default React.memo(ModuleWiseNav);
