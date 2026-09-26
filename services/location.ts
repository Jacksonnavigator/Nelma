import * as Location from "expo-location";

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type ResolvedAddress = {
  deliveryAddress: string;
  area: string;
};

export type LocationResult =
  | { status: "granted"; coordinates: Coordinates; address?: ResolvedAddress }
  | { status: "denied"; message: string }
  | { status: "unavailable"; message: string };

export const locationService = {
  /** A cheap position fix for the on-duty beacon: no address lookup, and only asks for permission when `prompt` is set. */
  async getDriverPosition(prompt: boolean): Promise<Coordinates | null> {
    const current = await Location.getForegroundPermissionsAsync();
    const granted = current.granted || (prompt && current.canAskAgain && (await Location.requestForegroundPermissionsAsync()).granted);
    if (!granted) {
      return null;
    }
    const recent = await Location.getLastKnownPositionAsync({ maxAge: 60_000 }).catch(() => null);
    const position = recent ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
    return { latitude: position.coords.latitude, longitude: position.coords.longitude };
  },

  async getCurrentCoordinates(): Promise<LocationResult> {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      return {
        status: "denied",
        message: "Location permission was denied. You can enter your delivery address manually."
      };
    }

    try {
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      let address: ResolvedAddress | undefined;
      try {
        const [geocoded] = await Location.reverseGeocodeAsync(position.coords);
        if (geocoded) {
          const addressParts = [geocoded.name, geocoded.street].filter((part, index, parts) => Boolean(part) && parts.indexOf(part) === index);
          const area = geocoded.district || geocoded.city || geocoded.subregion || geocoded.region;
          if (addressParts.length && area) {
            address = { deliveryAddress: addressParts.join(", "), area };
          }
        }
      } catch {
        address = undefined;
      }
      return {
        status: "granted",
        coordinates: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        },
        address
      };
    } catch {
      return {
        status: "unavailable",
        message: "Unable to read your current location. You can enter the address manually."
      };
    }
  }
};
