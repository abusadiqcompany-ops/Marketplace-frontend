import { Location } from '../types';

/**
 * Calculate distance between two geographic coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Format distance for display
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
}

/**
 * Filter listings by location and distance
 */
export function filterByDistance(
  listings: any[],
  userLocation: Location,
  radiusKm: number
): any[] {
  if (!userLocation.coordinates) {
    return listings;
  }

  return listings.filter((listing) => {
    if (!listing.location?.coordinates) {
      return false;
    }

    const distance = calculateDistance(
      userLocation.coordinates.latitude,
      userLocation.coordinates.longitude,
      listing.location.coordinates.latitude,
      listing.location.coordinates.longitude
    );

    return distance <= radiusKm;
  });
}

/**
 * Filter listings by city, state, or country
 */
export function filterByLocation(
  listings: any[],
  filters: {
    country?: string;
    state?: string;
    city?: string;
  }
): any[] {
  return listings.filter((listing) => {
    const loc = listing.location;
    if (!loc) return false;

    if (filters.country && loc.country !== filters.country) {
      return false;
    }
    if (filters.state && loc.state !== filters.state) {
      return false;
    }
    if (filters.city && loc.city !== filters.city) {
      return false;
    }

    return true;
  });
}

/**
 * Sort listings by distance from user location
 */
export function sortByDistance(
  listings: any[],
  userLocation: Location
): any[] {
  if (!userLocation.coordinates) {
    return listings;
  }

  return [...listings].sort((a, b) => {
    if (!a.location?.coordinates || !b.location?.coordinates) {
      return 0;
    }

    const distA = calculateDistance(
      userLocation.coordinates.latitude,
      userLocation.coordinates.longitude,
      a.location.coordinates.latitude,
      a.location.coordinates.longitude
    );

    const distB = calculateDistance(
      userLocation.coordinates.latitude,
      userLocation.coordinates.longitude,
      b.location.coordinates.latitude,
      b.location.coordinates.longitude
    );

    return distA - distB;
  });
}

/**
 * Get current user's location (browser geolocation)
 */
export async function getUserLocation(): Promise<Location | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          country: 'Nigeria',
          state: '', // Would be determined from coordinates
          city: '',
          coordinates: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
        });
      },
      () => {
        resolve(null);
      }
    );
  });
}

/**
 * Check if two locations are in the same city
 */
export function isSameCity(loc1: Location, loc2: Location): boolean {
  return loc1.city === loc2.city && loc1.state === loc2.state && loc1.country === loc2.country;
}

/**
 * Get location display string (City, State)
 */
export function getLocationDisplay(location: Location): string {
  if (location.city && location.state) {
    return `${location.city}, ${location.state}`;
  }
  if (location.state) {
    return location.state;
  }
  return location.country;
}
