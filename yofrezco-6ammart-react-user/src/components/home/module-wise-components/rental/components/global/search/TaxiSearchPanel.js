import CustomContainer from "components/container";
import { Box, Stack } from "@mui/system";
import { alpha, Button, Radio, Select, useTheme } from "@mui/material";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import OutlinedInput from "@mui/material/OutlinedInput";
import NearMeOutlinedIcon from "@mui/icons-material/NearMeOutlined";
import MenuItem from "@mui/material/MenuItem";
import ListItemText from "@mui/material/ListItemText";
import DateTimePicker from "components/home/module-wise-components/rental/components/global/DateTimePicker";
import React, { useEffect, useRef, useState } from "react";
import { CustomTextField } from "styled-components/CustomStyles.style";
import RentalSearchLocation from "components/home/module-wise-components/rental/components/global/search/RentalSearchLocation";
import useGetAutocompletePlace from "api-manage/hooks/react-query/google-api/usePlaceAutoComplete";
import { useDispatch, useSelector } from "react-redux";
import useGetPlaceDetails from "api-manage/hooks/react-query/google-api/useGetPlaceDetails";
import { useRouter } from "next/router";
import { setRentalSearch } from "redux/slices/rentalSearch";
import useGetDistance from "api-manage/hooks/react-query/google-api/useGetDistance";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { usePathname } from "next/navigation";
import dayjs from "dayjs";
import { t } from "i18next";
import { toast } from "react-hot-toast";
import { updateDestinationLocations } from "components/home/module-wise-components/rental/components/utils/bookingHepler";
import MapModal from "components/Map/MapModal";

const TaxiSearchPanel = ({
													 isSticky,
													 height,
													 position,
													 mt,
													 top = "auto",
													 bottom = 0,
													 showSearch = true,
												 }) => {
	const theme = useTheme();
	const router = useRouter();
	const pathname = usePathname();
	const dispatch = useDispatch();
	const mode = "DRIVE";
	const [openMap, setOpenMap] = useState(false);
	const { configData } = useSelector((state) => state.configData);
	const { rentalSearch } = useSelector((state) => state?.rentalSearch);
	const [open, setOpen] = useState(false);
	const [tripType, setTripType] = useState("distance_wise");
	const [duration, setDuration] = useState(rentalSearch?.duration || "");
	const [selectedDate, setSelectedDate] = useState(dayjs);
	// Destination Location
	const [locations, setLocations] = useState({
		...configData?.default_location,
	});
	const [searchKey, setSearchKey] = useState("");
	const [placeId, setPlaceId] = useState("");
	const [predictions, setPredictions] = useState([]);
	const [isFocused, setIsFocused] = useState(false);
	const [expand, setExpand] = useState(false);
	const [showArrowButton, setShowArrowButton] = useState(false);
	const formControlRef = useRef(null);
	const inputRef = useRef(null);


	useEffect(() => {
		const handleClickOutside = (event) => {
			if (
				formControlRef.current &&
				!formControlRef.current.contains(event.target)
			) {
				if (tripType === "hourly" || rentalSearch?.tripType === "hourly" || tripType==="day_wise" || rentalSearch?.tripType==="day_wise") {
					
					if (
						inputRef.current &&
						!inputRef.current.contains(event.target)
					) {
						setOpen(false);
					}
				} else {
					if (tripType === "distance_wise") {
						setOpen(false);
					}
				}
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [tripType]);

	// Scroll event listener to show/hide arrow button
	useEffect(() => {
		const handleScroll = () => {
			if (window.scrollY > 100) {
				// Change 100 to your desired scroll threshold
				setShowArrowButton(true);
			} else {
				setShowArrowButton(false);
			}
		};

		window.addEventListener("scroll", handleScroll);

		// Cleanup the event listener on component unmount
		return () => {
			window.removeEventListener("scroll", handleScroll);
		};
	}, []);

	const pickup_location =
		typeof window !== "undefined"
			? JSON.parse(localStorage.getItem("currentLatLng"))
			: false;
	const location_name =
		typeof window !== "undefined"
			? window.localStorage.getItem("location")
			: false;

	const { data: places } = useGetAutocompletePlace(searchKey, !!searchKey);
	const { data: placeDetails } = useGetPlaceDetails(placeId, !!placeId);
	const { data: distanceData, refetch } = useGetDistance(
		pickup_location,
		locations,
		mode
	);



	useEffect(() => {
		if (places) {
			const tempData = places?.suggestions?.map((item) => ({
				place_id: item?.placePrediction?.placeId,
				description: `${item?.placePrediction?.structuredFormat?.mainText?.text}, ${item?.placePrediction?.structuredFormat?.secondaryText?.text}`,
			}));

			setPredictions(tempData);
		}	
	}, [places]);

	useEffect(() => {
		if (placeDetails?.location) {
			setLocations((prev) => ({
				location_name: placeDetails?.formattedAddress,
				lat: placeDetails?.location?.latitude,
				lng: placeDetails?.location?.longitude,
			}));
		}
	}, [placeDetails]);

	useEffect(() => {
		refetch();
	}, [locations]);

	const handleLocationChange = (field, value) => {
		if (value) {
			setPlaceId(value.place_id);
		}
	};

	const handleSearchChange = (event) => setSearchKey(event.target.value);
	useEffect(() => {
		dispatch(
			setRentalSearch({
				...rentalSearch,
				destination_location: locations,
			})
		);
		setSearchKey(rentalSearch?.destination_location?.location_name);
	}, [locations, rentalSearch?.destination_location?.location_name]);

	useEffect(() => {
		if (
			rentalSearch?.distanceData?.destination_addresses &&
			router.pathname !== "/home"
		) {
			setSearchKey(rentalSearch.distanceData.destination_addresses[0]);
			setDuration(rentalSearch.duration);
		}
	}, [rentalSearch, router.pathname]);

	const handleFocus = () => {
		setIsFocused(true);
	};

	//Date
	const handleDateChange = (newValue) => {
		setSelectedDate(newValue);
	};
	useEffect(() => {
		dispatch(
			setRentalSearch({
				...rentalSearch,
				selectedDate,
			})
		);
	}, [selectedDate]);

	// Trip Type
	const handleTripTypeChange = (e) => {
		setTripType(e.target.value);
	};
	useEffect(() => {
		dispatch(
			setRentalSearch({
				...rentalSearch,
				tripType,
			})
		);
	}, [tripType]);
	const handleOpen = () => setOpen(true);

	//Duration
	const handleDurationChange = (e) => {
		setDuration(e.target.value);
	};
	useEffect(() => {
		dispatch(
			setRentalSearch({
				...rentalSearch,
				duration,
			})
		);
	}, [duration]);

	//Search Button Click
	const handleSearchClick = (event) => {
		if (!searchKey) {
			toast.error("Please Add Destination Address!");
			return;
		}
		if (!selectedDate) {
			toast.error("Please Select the Date!");
			return;
		}
		if (!tripType) {
			toast.error("Please Select a Trip Type!");
			return;
		}
		if (tripType === "hourly" || tripType==="day_wise") {
			if (!duration || isNaN(duration) || Number(duration) <= 0) {
				toast.error(
					!duration
						? "Please Add Duration!"
						: isNaN(duration)
							? "Duration must be a valid number!"
							: "Please Add a Valid Duration!"
				);
				return;
			}
		}
		updateDestinationLocations(locations);
		
		dispatch(
			setRentalSearch({
				selectedDate,
				destination_location: locations,
				pickup_location: { location_name, ...pickup_location },
				tripType,
				duration,
				distanceData,
			})
		);
		router.push({
			pathname: "/rental/vehicle-search",
			query: {
				from: "from_search",
			},
		});
	};

	useEffect(() => {
		if (router.pathname === "/home") {
		
			setTripType("distance_wise");
			setDuration("");
			dispatch(setRentalSearch(null));
		}
	}, [router.pathname]);

	const handleClick = (e, type) => {
		e.stopPropagation();
		if (type === "distance_wise") {
			setTripType("distance_wise");
			if(rentalSearch){
				dispatch(
					setRentalSearch({
						...rentalSearch,
						tripType: "distance_wise",
					})
				);
			}
			
			setOpen(false);	
		}
		if (type === "hourly" ) {
			setTripType("hourly");
			if(rentalSearch){
				dispatch(
					setRentalSearch({
						...rentalSearch,
						tripType: "hourly",
					})
				);
			}
			setOpen(true);
		}
		if (type === "day_wise") {
			setTripType("day_wise");
			if(rentalSearch){
				dispatch(
					setRentalSearch({
						...rentalSearch,
						tripType: "day_wise",
					})
				);
			}
			setOpen(true);
		}
	};
	const pickLocationFormAddress = (value) => {
		setSearchKey(value?.address);
		setLocations({
			lat: value.latitude,
			lng: value.longitude,
			location_name: value?.address,
		});
	};
	const isSearchPage = router.pathname === "/vehicle-search";
	const handleLocation = (location, locationName) => {
		
		 
		setLocations({
			lat: location.lat,
			lng: location.lng,
			location_name: locationName,
		});
	};


	return (
		<CustomContainer sx={{ position: "relative" }}>
			{pathname !== "/home" && showArrowButton && (
				<Box
					sx={{
						position: "absolute",
						width: "100%",
						display: { xs: "flex", sm: "none" },
						justifyContent: "center",
						textAlign: "center",
						bottom: "-38px",
						left: "50%",
						zIndex: 1000,
						transform: "translate(-50%, -50%)",
					}}
				>
					<Button
						onClick={() => {
							setExpand(!expand);
						}}
						variant="contained"
						sx={{
							"&:hover": {
								backgroundColor: theme.palette.background.paper,
							},
							backgroundColor: theme.palette.background.paper,
							borderRadius: "50%",
							width: "34px",
							height: "34px",
							minWidth: "unset",
							padding: 0,
						}}
					>
						<KeyboardArrowDownIcon
							sx={{
								color: theme.palette.primary.main,
								transform: expand
									? "rotate(180deg)"
									: "rotate(0deg)",
							}}
						/>
					</Button>
				</Box>
			)}
			<Box
				p={"15px"}
				sx={{
					width: "100%",
					mt: mt,
					height: height,
					position: position,
					top: top,
					zIndex: 50,
					boxShadow: (theme) => {
						return {
							xs: "none",
							md: `0px 15px 30px 0px ${alpha(
								theme.palette.neutral[1000],
								theme.palette.mode === "dark" ? 0 : 0.1
							)}`,
						};
					},

					bottom: bottom,
					left: !showSearch && "0%",
					right: !showSearch && "0%",
					marginTop:
						isSearchPage && !isSticky
							? { xs: "-120px", sm: "-180px" }
							: "-42px",
					maxWidth: {
						xs: "100%",
						sm: isSticky
							? { xs: "fit-content", md: "100%" }
							: "fit-content",
					},
					marginInline: "auto",
					backgroundColor: theme.palette.background.paper,
					borderRadius: "15px",
					borderTopLeftRadius:isSticky ? "0px" : "15px",
					borderTopRightRadius: isSticky ? "0px" : "15px",
				}}
			>
				<Stack
					direction="row"
					flexWrap={{ xs: "wrap", md: "nowrap" }}
					gap={2}
					justifyContent={!showSearch && "center"}
					sx={{
						"> *": {
							flexBasis: { xs: "100%", sm: "48%", md: "auto" },
						},
					}}
				>
					<RentalSearchLocation
						key={router.pathname}
						setOpenMap={setOpenMap}
						fromHome
						getCurrentLocation={pickLocationFormAddress}
						pickLocationFormAddress={pickLocationFormAddress}
						predictions={predictions}
						handleChange={(event, value) =>
							handleLocationChange("destination", value)
						}
						HandleChangeForSearch={handleSearchChange}
						label={t("Destination")}
						height="53px"
						onFocus={handleFocus}
						disabled={!locations.pickup}
						value={{
							description: searchKey,
						}}
						width={isSticky ? "70%" : 500}
						isFocused={isFocused}
						focusedField="destination"
						endIcon={
							<NearMeOutlinedIcon
								sx={{
									color: (theme) =>
										alpha(theme.palette.neutral[400], 0.5),
								}}
							/>
						}
					/>

					<DateTimePicker
						value={dayjs(rentalSearch?.selectedDate)}
						handleDateChange={handleDateChange}
						label="Pickup Time"
						sx={{
							display: pathname !== "/home" && {
								xs:
									(!showArrowButton && "flex") || expand
										? "flex"
										: "none" || showArrowButton
											? "none"
											: "flex",
								sm: "flex",
							},
							"& .MuiOutlinedInput-root": {
								"&.Mui-focused fieldset": {
									border: "1px solid",
									borderColor: (theme) =>
										alpha(theme.palette.primary.main, 0.4),
								},
							},
						}}
					/>

					<FormControl
						ref={formControlRef}
						sx={{
							display: pathname !== "/home" && {
								xs:
									(!showArrowButton && "flex") || expand
										? "flex"
										: "none" || showArrowButton
											? "none"
											: "flex",
								sm: "flex",
							},
							width: 300,
							"& .MuiOutlinedInput-root": {
								"& fieldset>legend": {
									fontSize: "25px",
								},
								"&.Mui-focused fieldset": {
									border: "1px solid",
									borderColor: (theme) =>
										theme.palette.primary.main,
								},
							},
						}}
					>
						<InputLabel id="demo-checkbox-label">
							{t("Trip Type")}
						</InputLabel>
						<Select
							labelId="demo-checkbox-label"
							id="demo-checkbox"
							value={
								rentalSearch?.tripType
									? t(
										rentalSearch.tripType.replaceAll(
											"_",
											" "
										)
									)
									: t(tripType?.replaceAll("_", " "))
							}
							sx={{ textTransform: "capitalize" }}
							onChange={(e) => {
								handleTripTypeChange(e);
							}}
							open={open}
							onOpen={handleOpen}
							input={<OutlinedInput label="Tag" />}
							renderValue={(selected) => selected}
						>
							<MenuItem
								value="hourly"
								onClick={(e) => handleClick(e, "hourly")}
							>
								<Radio
									checked={
										rentalSearch?.tripType === "hourly"
									}
								/>
								<ListItemText primary={t("Hourly")} />
							</MenuItem>
							<MenuItem
								value="day_wise"
								onClick={(e) => handleClick(e, "day_wise")}
							>
								<Radio
									checked={
										rentalSearch?.tripType === "day_wise"
									}
								/>
								<ListItemText primary={t("Per Day")} />
							</MenuItem>

							<MenuItem
								value="distance_wise"
								onClick={(e) => handleClick(e, "distance_wise")}
							>
								<Radio
									checked={
										rentalSearch?.tripType ===
										"distance_wise" ||
										!rentalSearch?.tripType
									}
								/>
								<ListItemText primary={t("Distance Wise")} />
							</MenuItem>
							{(rentalSearch?.tripType === "hourly" ||  rentalSearch?.tripType==="day_wise" )&&  (
								<Box
									ref={inputRef}
									sx={{
										px: "10px",
										mt: "20px",
										pb: "10px",
									}}
								>
									<CustomTextField
										label={t("Duration")}
										value={duration}
										onChange={handleDurationChange}
										sx={{ width: "100%" }}
									/>
								</Box>
							)}
						</Select>
					</FormControl>

					{showSearch && (
						<Button variant="contained" onClick={handleSearchClick}>
							{t("Search")}
						</Button>
					)}
				</Stack>
			</Box>
			{openMap && (
				<MapModal
					handleLocation={handleLocation}
					open={openMap}
					handleClose={() => setOpenMap(false)}
					toparcel="1"
					fromReceiver="1"
				/>
			)}
		</CustomContainer>
	);
};

export default TaxiSearchPanel;
