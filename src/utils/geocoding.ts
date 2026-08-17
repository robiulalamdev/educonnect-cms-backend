import { env } from "../config/env.js";

/**
 * Geocode an address to lat/lng coordinates using Google Geocoding API.
 * Returns null if geocoding fails (non-critical, don't block user flow).
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn("[Geocoding] GOOGLE_MAPS_API_KEY not set — skipping geocoding");
      return null;
    }

    const encoded = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${apiKey}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.status === "OK" && data.results?.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      return { lat, lng };
    }

    return null;
  } catch (err) {
    console.error("[Geocoding] Error:", err);
    return null;
  }
}

/**
 * Reverse geocode lat/lng to address components.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<{
  formatted_address?: string;
  country?: string;
  city?: string;
  area?: string;
} | null> {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) return null;

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status === "OK" && data.results?.length > 0) {
      const result = data.results[0];
      const components = result.address_components || [];

      const getComponent = (type: string) =>
        components.find((c: any) => c.types.includes(type))?.long_name;

      return {
        formatted_address: result.formatted_address,
        country: getComponent("country"),
        city: getComponent("locality") || getComponent("administrative_area_level_2"),
        area: getComponent("sublocality") || getComponent("administrative_area_level_3"),
      };
    }

    return null;
  } catch (err) {
    console.error("[Reverse Geocoding] Error:", err);
    return null;
  }
}
