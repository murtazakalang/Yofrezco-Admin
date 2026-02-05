import React, { useMemo } from "react";
import { Grid, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import FormControl from "@mui/material/FormControl";
import { useTranslation } from "react-i18next";
import { CustomStackFullWidth } from "../../../styled-components/CustomStyles.style";
import { getDayNumber } from "../../../utils/CustomFunctions";
import { DeliveryCaption, PreferableTimeInput } from "../CheckOut.style";
import CustomAlert from "../../alert/CustomAlert";
import moment from "moment";

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

	// Generate time slots between 10:00 and 20:00 for tomorrow
	const filteredScheduleOptions = useMemo(() => {
		const slots = [];
		const tomorrowDate = moment().add(1, "days").format("yyyy-MM-DD");
		const dayNumber = getDayNumber(tomorrow);

		// Check if store has schedules for tomorrow
		const tomorrowSchedules = storeData?.schedules?.filter(
			(s) => s.day === dayNumber
		);

		if (!tomorrowSchedules || tomorrowSchedules.length === 0) {
			return [];
		}

		// Generate slots from 10:00 to 20:00
		let currentSlotStart = moment("10:00", "HH:mm");
		const endTime = moment("20:00", "HH:mm");

		while (currentSlotStart.isBefore(endTime)) {
			const slotEnd = moment(currentSlotStart).add(slotDurationTime, "minutes");

			// Don't go past 20:00
			if (slotEnd.isAfter(endTime)) {
				break;
			}

			// Check if this slot falls within any of the store's schedules for tomorrow
			const isWithinSchedule = tomorrowSchedules.some((schedule) => {
				const openTime = moment(schedule.opening_time, "HH:mm");
				const closeTime = moment(schedule.closing_time, "HH:mm");
				return (
					currentSlotStart.isSameOrAfter(openTime) &&
					slotEnd.isSameOrBefore(closeTime)
				);
			});

			if (isWithinSchedule) {
				const label = `${currentSlotStart.format("HH:mm")} - ${slotEnd.format("HH:mm")}`;
				slots.push({
					label: label,
					value: `${tomorrowDate} ${slotEnd.format("HH:mm")}`,
				});
			}

			currentSlotStart = slotEnd;
		}

		return slots;
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
								<CustomAlert type="info" text={t("No delivery slots available for tomorrow between 10:00-20:00.")} />
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


