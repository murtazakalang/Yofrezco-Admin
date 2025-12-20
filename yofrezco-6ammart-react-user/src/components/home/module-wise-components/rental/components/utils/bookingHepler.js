
export const cardTotalPrice = (price, tripHours, quantity) => {
  return price * tripHours * quantity || 1;
};

export const cardDiscount = (
  price,
  tripHours,
  quantity,
  discount,
  discountType,
  storeDiscount,
  max_discount
) => {
  let mainPrice = price * (tripHours || 1) * (quantity || 1); // Calculate the base price

  if (discount && discount > 0) {
    // Apply user-provided discount
    if (discountType === "amount") {
      mainPrice -= discount * (quantity || 1);
    } else if (discountType === "percent") {
      mainPrice -= (discount / 100) * mainPrice;
    }
  }

  return mainPrice > 0 ? mainPrice : 0; // Ensure the final price is not negative
};

export function mainPrice(data,tripType) {
  if(tripType){
    if (tripType === "distance_wise") {
      return data.distance_price;
    } else if (tripType === "hourly") {
      return data.hourly_price;
    } else if (tripType === "day_wise") {
      return data.day_wise_price;
    } else {
      return 0;
    }
  }else{
  if (data?.trip_hourly === 1 && data?.trip_distance === 1 && data?.trip_day_wise === 1) {
    return Math.min(data.hourly_price, data.distance_price, data.day_wise_price);
  } else if (data?.trip_hourly === 1) {
    return data.hourly_price;
  } else if (data?.trip_distance === 1) {
    return data.distance_price;
  }
  else if(data?.trip_day_wise === 1) {
    return data.day_wise_price;
  }
  else {
      return 0;
    }
  }
}

export function updateDestinationLocations(newLocations) {
  const locationsArray = Array.isArray(newLocations)
    ? newLocations
    : [newLocations];
  const existingLocations =
    JSON.parse(localStorage.getItem("destination_location")) || [];
  locationsArray.forEach((location) => {
    if (
      !existingLocations.some(
        (existingLocation) =>
          JSON.stringify(existingLocation) === JSON.stringify(location)
      )
    ) {
      existingLocations.push(location);
      if (existingLocations.length > 5) {
        existingLocations.shift();
      }
    }
  });

  localStorage.setItem(
    "destination_location",
    JSON.stringify(existingLocations)
  );
}
