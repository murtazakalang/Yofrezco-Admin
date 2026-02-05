import React, { useMemo } from "react";
import { Grid, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import FormControl from "@mui/material/FormControl";
import { useTranslation } from "react-i18next";
import { CustomStackFullWidth } from "../../../styled-components/CustomStyles.style";
import { getAllSchedule, getDayNumber } from "../../../utils/CustomFunctions";
import { DeliveryCaption, PreferableTimeInput } from "../CheckOut.style";
import CustomAlert from "../../alert/CustomAlert";

const RestaurantScheduleTime = (props) => {
	const {
		storeData,
		handleChange,
		today,
		tomorrow,
		numberOfDay,
		configData,
		setScheduleAt,
	} = props;
	const { t } = useTranslation();
	const slotDurationTime =
		configData?.schedule_order_slot_duration === 0
			? 30
			: configData?.schedule_order_slot_duration;

	// Filter schedule options to only show times between 10:00 and 20:00
	const filteredScheduleOptions = useMemo(() => {
		const allSchedules = getAllSchedule(
			getDayNumber(tomorrow), // Always use tomorrow's schedule
			storeData?.schedules,
			slotDurationTime
		);

		// Filter to only include slots between 10:00 and 20:00
		return allSchedules.filter((slot) => {
			if (!slot?.value) return false;
			const timeStr = slot.value.split(" - ")[0]; // Get start time
			const hour = parseInt(timeStr.split(":")[0], 10);
			return hour >= 10 && hour < 20;
		});
	}, [storeData?.schedules, slotDurationTime, tomorrow]);

	// Auto-select tomorrow's day on mount
	React.useEffect(() => {
		handleChange({ target: { value: getDayNumber(tomorrow) } });
	}, []);

	return (
		<>
			{storeData?.schedule_order && (
				<CustomStackFullWidth sx={{ height: "100%", paddingY: "10px" }}>
					<Grid container spacing={3}>
						<Grid item xs={12} md={12}>
							<DeliveryCaption
								const
								id="demo-row-radio-buttons-group-label"
							>
								{t("Preferable Time")}
							</DeliveryCaption>
						</Grid>
						<Grid item md={6} xs={12}>
							<FormControl fullWidth>
								<InputLabel>{t("Time")}</InputLabel>
								<Select
									label={t("Time")}
									onChange={handleChange}
									defaultValue={getDayNumber(tomorrow)}
									value={getDayNumber(tomorrow)}
								>
									<MenuItem
										value={getDayNumber(tomorrow)}
										sx={{
											"&:hover": {
												backgroundColor: "primary.main",
											},
										}}
									>
										{t("Tomorrow")}
									</MenuItem>
								</Select>
							</FormControl>
						</Grid>
						{filteredScheduleOptions.length !== 0 && (
							<Grid item md={6} xs={12}>
								{storeData?.schedules &&
									storeData?.schedules?.length > 0 && (
										<PreferableTimeInput
											key={numberOfDay}
											defaultValue=""
											disablePortal
											id="combo-box-demo"
											options={filteredScheduleOptions}
											onChange={(e, option) =>
												setScheduleAt(option?.value)
											}
											renderInput={(params) => (
												<TextField
													{...params}
													label={t("Schedule")}
												/>
											)}
										/>
									)}
							</Grid>
						)}
						{filteredScheduleOptions.length === 0 && (
							<Grid item xs={12}>
								<CustomAlert type="info" text="No delivery slots available for tomorrow between 10:00-20:00." />
							</Grid>
						)}
					</Grid>
				</CustomStackFullWidth>
			)}
		</>
	);
};

RestaurantScheduleTime.propTypes = {};

export default RestaurantScheduleTime;

