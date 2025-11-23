import axios from 'axios';
import Booking from '../models/booking.model.js';

// 1. Geocode a single address using Google Maps Geocoding API
export async function geocodeAddress(address, apiKey) {
  const url = 'https://maps.googleapis.com/maps/api/geocode/json';
  const { data } = await axios.get(url, {
    params: { address, key: apiKey }
  });

  if (data.status === "OK" && data.results && data.results.length > 0) {
    // Optionally filter to prefer a particular city/locality, e.g. Agra
    // const bestResult = data.results.find(r =>
    //   r.address_components.some(c =>
    //     c.long_name.toLowerCase().includes('agra')
    //   )
    // ) || data.results[0];
    // const loc = bestResult.geometry.location;

    const loc = data.results[0].geometry.location;
    return { lat: loc.lat, lng: loc.lng };
  }
  throw new Error(`Geocoding failed for: ${address}, status: ${data.status}`);
}

// 2. Geocode a batch of locations (address objects with {name, address})
export async function geocodeLocations(locations, apiKey) {
  return Promise.all(locations.map(async (loc) => {
    if (loc.lat && loc.lng) return loc;
    try {
      const coords = await geocodeAddress(loc.address, apiKey);
      return { ...loc, ...coords };
    } catch (e) {
      return { ...loc, lat: 0, lng: 0 }; // Mark as failed to geocode
    }
  }));
}

// 3. Extract unique drop points from a booking (uses bookingId, not _id)
export async function extractDropPointsFromBooking(bookingId, apiKey) {
  const booking = await Booking.findOne({ bookingId });
  if (!booking) throw new Error('Booking not found');
  const unique = {};
  booking.passengers.forEach((p) => {
    const key = p.dropPoint?.trim().toLowerCase();
    if (key && !unique[key]) {
      unique[key] = { name: p.dropPoint, address: p.dropPoint };
    }
  });
  return await geocodeLocations(Object.values(unique), apiKey);
}


// 4. Generate a Google Maps multi-stop link from origin + waypoints (all coordinates)
export function generateGoogleMapsLink(origin, waypoints) {
  const base = 'https://www.google.com/maps/dir/';
  const ordered = [origin].concat(waypoints);
  return base + ordered
    .map(loc => encodeURIComponent(`${loc.lat},${loc.lng}`)).join('/');
}

// 5. Dummy nearest-neighbor optimization for ordering waypoints (you can later replace with TSP or Matrix API for best results)
export function findOptimalOrder(locations) {
  // No actual TSP - just return 0..n-1 in input order, or implement your nearest neighbor here.
  return locations.map((_, idx) => idx);
}

// 6. Main optimization function (gets geocodes, creates ordered list, generates link)
export async function optimizeRoute(origin, dropPoints, apiKey) {
  const geocodedDropPoints = await geocodeLocations(dropPoints, apiKey);

  if (geocodedDropPoints.some(p => p.lat === 0 && p.lng === 0)) {
    throw new Error('Could not geocode all drop points');
  }

  // Find optimal order (override with real optimization if you have a distances API)
  const optimizedOrder = findOptimalOrder(geocodedDropPoints);
  const reordered = optimizedOrder.map(i => geocodedDropPoints[i]);

  // Compute simple total distance using Haversine (optional), or just skip for now
  const totalDistance = 0; // Implement if you want.
  const totalDuration = 0; // Implement if you want.

  const directionsUrl = generateGoogleMapsLink(origin, reordered);

  return {
    optimizedOrder,
    waypoints: reordered,
    totalDistance,
    totalDuration,
    directionsUrl
  };
}

// 7. Extract Pickup Points From Booking
export async function extractPickupPointsFromBooking(bookingId, apiKey) {
  const booking = await Booking.findOne({ bookingId });
  if (!booking) throw new Error('Booking not found');
  const unique = {};
  booking.passengers.forEach((p) => {
    const key = p.pickupPoint?.trim().toLowerCase();
    if (key && !unique[key]) {
      unique[key] = { name: p.pickupPoint, address: p.pickupPoint };
    }
  });
  return await geocodeLocations(Object.values(unique), apiKey);
}