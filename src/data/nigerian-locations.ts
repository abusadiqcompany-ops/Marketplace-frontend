// Nigerian States, Cities, and Coordinates for location-based discovery
// Coordinates are approximate city centers in latitude, longitude format

export interface NigerianState {
  name: string;
  code: string;
  cities: NigerianCity[];
}

export interface NigerianCity {
  name: string;
  state: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

export const NIGERIAN_STATES: NigerianState[] = [
  {
    name: 'Abia',
    code: 'AB',
    cities: [
      { name: 'Umuahia', state: 'Abia', latitude: 5.5320, longitude: 7.4866 },
      { name: 'Aba', state: 'Abia', latitude: 5.1060, longitude: 7.3667 },
      { name: 'Ohafia', state: 'Abia', latitude: 5.4500, longitude: 7.8500 },
    ],
  },
  {
    name: 'Adamawa',
    code: 'AD',
    cities: [
      { name: 'Yola', state: 'Adamawa', latitude: 9.2028, longitude: 12.4950 },
      { name: 'Mubi', state: 'Adamawa', latitude: 10.2667, longitude: 13.2667 },
      { name: 'Ganye', state: 'Adamawa', latitude: 7.2679, longitude: 12.3363 },
    ],
  },
  {
    name: 'Akwa Ibom',
    code: 'AK',
    cities: [
      { name: 'Uyo', state: 'Akwa Ibom', latitude: 5.0492, longitude: 7.9336 },
      { name: 'Eket', state: 'Akwa Ibom', latitude: 4.6365, longitude: 7.9272 },
      { name: 'Ikot Ekpene', state: 'Akwa Ibom', latitude: 5.1167, longitude: 7.7167 },
    ],
  },
  {
    name: 'Anambra',
    code: 'AN',
    cities: [
      { name: 'Awka', state: 'Anambra', latitude: 6.2100, longitude: 7.0714 },
      { name: 'Onitsha', state: 'Anambra', latitude: 6.1667, longitude: 6.7833 },
      { name: 'Nnewi', state: 'Anambra', latitude: 6.0167, longitude: 6.9167 },
    ],
  },
  {
    name: 'Bauchi',
    code: 'BA',
    cities: [
      { name: 'Bauchi', state: 'Bauchi', latitude: 10.3104, longitude: 9.8430 },
      { name: 'Azare', state: 'Bauchi', latitude: 11.6843, longitude: 10.1917 },
      { name: 'Misau', state: 'Bauchi', latitude: 11.6778, longitude: 10.2561 },
    ],
  },
  {
    name: 'Bayelsa',
    code: 'BY',
    cities: [
      { name: 'Yenagoa', state: 'Bayelsa', latitude: 4.9247, longitude: 6.2646 },
      { name: 'Brass', state: 'Bayelsa', latitude: 4.3219, longitude: 6.1532 },
      { name: 'Oporoma', state: 'Bayelsa', latitude: 4.9253, longitude: 6.1653 },
    ],
  },
  {
    name: 'Benue',
    code: 'BE',
    cities: [
      { name: 'Makurdi', state: 'Benue', latitude: 7.7333, longitude: 8.5333 },
      { name: 'Otukpo', state: 'Benue', latitude: 7.2083, longitude: 8.0878 },
      { name: 'Gboko', state: 'Benue', latitude: 7.3333, longitude: 9.0000 },
    ],
  },
  {
    name: 'Borno',
    code: 'BO',
    cities: [
      { name: 'Maiduguri', state: 'Borno', latitude: 11.8333, longitude: 13.1500 },
      { name: 'Bama', state: 'Borno', latitude: 11.6803, longitude: 13.6875 },
      { name: 'Dikwa', state: 'Borno', latitude: 12.1218, longitude: 13.6227 },
    ],
  },
  {
    name: 'Cross River',
    code: 'CR',
    cities: [
      { name: 'Calabar', state: 'Cross River', latitude: 4.9500, longitude: 8.3333 },
      { name: 'Ikom', state: 'Cross River', latitude: 6.1333, longitude: 8.5667 },
      { name: 'Ogoja', state: 'Cross River', latitude: 6.6667, longitude: 8.3167 },
    ],
  },
  {
    name: 'Delta',
    code: 'DE',
    cities: [
      { name: 'Asaba', state: 'Delta', latitude: 6.2000, longitude: 6.7833 },
      { name: 'Warri', state: 'Delta', latitude: 5.5167, longitude: 5.7500 },
      { name: 'Sapele', state: 'Delta', latitude: 5.9000, longitude: 5.7000 },
    ],
  },
  {
    name: 'Ebonyi',
    code: 'EB',
    cities: [
      { name: 'Abakaliki', state: 'Ebonyi', latitude: 6.3239, longitude: 8.1145 },
      { name: 'Afikpo', state: 'Ebonyi', latitude: 5.9167, longitude: 7.9333 },
      { name: 'Ikwo', state: 'Ebonyi', latitude: 6.1439, longitude: 7.8617 },
    ],
  },
  {
    name: 'Edo',
    code: 'ED',
    cities: [
      { name: 'Benin City', state: 'Edo', latitude: 6.3350, longitude: 5.6037 },
      { name: 'Auchi', state: 'Edo', latitude: 6.7333, longitude: 6.2333 },
      { name: 'Uromi', state: 'Edo', latitude: 6.7068, longitude: 6.3986 },
    ],
  },
  {
    name: 'Ekiti',
    code: 'EK',
    cities: [
      { name: 'Ado Ekiti', state: 'Ekiti', latitude: 7.6231, longitude: 5.2200 },
      { name: 'Ikere', state: 'Ekiti', latitude: 7.5722, longitude: 5.2286 },
      { name: 'Ise Ekiti', state: 'Ekiti', latitude: 7.4631, longitude: 5.2439 },
    ],
  },
  {
    name: 'Enugu',
    code: 'EN',
    cities: [
      { name: 'Enugu City', state: 'Enugu', latitude: 6.4969, longitude: 7.5519 },
      { name: 'Nsukka', state: 'Enugu', latitude: 6.8511, longitude: 7.3919 },
      { name: 'Igbo Etiti', state: 'Enugu', latitude: 6.1642, longitude: 7.3000 },
    ],
  },
  {
    name: 'Gombe',
    code: 'GO',
    cities: [
      { name: 'Gombe', state: 'Gombe', latitude: 10.2899, longitude: 11.1673 },
      { name: 'Biu', state: 'Gombe', latitude: 10.6194, longitude: 12.2047 },
      { name: 'Yamaltu Deba', state: 'Gombe', latitude: 10.3092, longitude: 11.4677 },
    ],
  },
  {
    name: 'Imo',
    code: 'IM',
    cities: [
      { name: 'Owerri', state: 'Imo', latitude: 5.4830, longitude: 7.0316 },
      { name: 'Orlu', state: 'Imo', latitude: 5.7919, longitude: 7.0575 },
      { name: 'Okigwe', state: 'Imo', latitude: 5.4806, longitude: 7.3511 },
    ],
  },
  {
    name: 'Jigawa',
    code: 'JI',
    cities: [
      { name: 'Dutse', state: 'Jigawa', latitude: 11.7611, longitude: 9.3622 },
      { name: 'Hadejia', state: 'Jigawa', latitude: 12.4531, longitude: 10.0414 },
      { name: 'Gumel', state: 'Jigawa', latitude: 12.5778, longitude: 10.1170 },
    ],
  },
  {
    name: 'Kaduna',
    code: 'KD',
    cities: [
      { name: 'Kaduna City', state: 'Kaduna', latitude: 10.5269, longitude: 7.4420 },
      { name: 'Zaria', state: 'Kaduna', latitude: 11.1679, longitude: 7.7124 },
      { name: 'Kafanchan', state: 'Kaduna', latitude: 9.3650, longitude: 8.4083 },
    ],
  },
  {
    name: 'Kano',
    code: 'KN',
    cities: [
      { name: 'Kano City', state: 'Kano', latitude: 12.0022, longitude: 8.5920 },
      { name: 'Tarauni', state: 'Kano', latitude: 12.0500, longitude: 8.5500 },
      { name: 'Fagge', state: 'Kano', latitude: 12.0333, longitude: 8.6000 },
    ],
  },
  {
    name: 'Katsina',
    code: 'KT',
    cities: [
      { name: 'Katsina', state: 'Katsina', latitude: 12.9858, longitude: 7.6178 },
      { name: 'Daura', state: 'Katsina', latitude: 12.4500, longitude: 7.3200 },
      { name: 'Funtua', state: 'Katsina', latitude: 11.5278, longitude: 7.3183 },
    ],
  },
  {
    name: 'Kebbi',
    code: 'KE',
    cities: [
      { name: 'Birnin Kebbi', state: 'Kebbi', latitude: 12.4536, longitude: 4.1992 },
      { name: 'Argungu', state: 'Kebbi', latitude: 12.7989, longitude: 4.4633 },
      { name: 'Yelwa', state: 'Kebbi', latitude: 12.2670, longitude: 4.2077 },
    ],
  },
  {
    name: 'Kogi',
    code: 'KO',
    cities: [
      { name: 'Lokoja', state: 'Kogi', latitude: 7.8028, longitude: 6.7333 },
      { name: 'Okene', state: 'Kogi', latitude: 7.5483, longitude: 6.7425 },
      { name: 'Idah', state: 'Kogi', latitude: 7.1333, longitude: 6.7333 },
    ],
  },
  {
    name: 'Kwara',
    code: 'KW',
    cities: [
      { name: 'Ilorin', state: 'Kwara', latitude: 8.5000, longitude: 4.5500 },
      { name: 'Offa', state: 'Kwara', latitude: 8.1500, longitude: 4.7833 },
      { name: 'Omu-Aran', state: 'Kwara', latitude: 8.1333, longitude: 4.9000 },
    ],
  },
  {
    name: 'Lagos',
    code: 'LA',
    cities: [
      { name: 'Lagos Island', state: 'Lagos', latitude: 6.4274, longitude: 3.4197 },
      { name: 'Ikeja', state: 'Lagos', latitude: 6.5833, longitude: 3.3667 },
      { name: 'Lekki', state: 'Lagos', latitude: 6.4500, longitude: 3.5667 },
    ],
  },
  {
    name: 'Nasarawa',
    code: 'NA',
    cities: [
      { name: 'Lafia', state: 'Nasarawa', latitude: 8.4856, longitude: 8.5244 },
      { name: 'Keffi', state: 'Nasarawa', latitude: 8.5194, longitude: 7.8806 },
      { name: 'Akwanga', state: 'Nasarawa', latitude: 8.6653, longitude: 8.5226 },
    ],
  },
  {
    name: 'Niger',
    code: 'NG',
    cities: [
      { name: 'Minna', state: 'Niger', latitude: 9.6133, longitude: 6.5562 },
      { name: 'Suleja', state: 'Niger', latitude: 9.1750, longitude: 7.1800 },
      { name: 'Kontagora', state: 'Niger', latitude: 10.3787, longitude: 5.5176 },
    ],
  },
  {
    name: 'Ogun',
    code: 'OG',
    cities: [
      { name: 'Abeokuta', state: 'Ogun', latitude: 7.1478, longitude: 3.3417 },
      { name: 'Ijebu Ode', state: 'Ogun', latitude: 6.8167, longitude: 3.9167 },
      { name: 'Sagamu', state: 'Ogun', latitude: 6.8472, longitude: 3.6494 },
    ],
  },
  {
    name: 'Ondo',
    code: 'ON',
    cities: [
      { name: 'Akure', state: 'Ondo', latitude: 7.2528, longitude: 5.1933 },
      { name: 'Ondo Town', state: 'Ondo', latitude: 7.1089, longitude: 5.2050 },
      { name: 'Owo', state: 'Ondo', latitude: 7.1964, longitude: 5.5889 },
    ],
  },
  {
    name: 'Osun',
    code: 'OS',
    cities: [
      { name: 'Osogbo', state: 'Osun', latitude: 7.7667, longitude: 4.5667 },
      { name: 'Ilesa', state: 'Osun', latitude: 7.6231, longitude: 4.7283 },
      { name: 'Ede', state: 'Osun', latitude: 7.7384, longitude: 4.3056 },
    ],
  },
  {
    name: 'Oyo',
    code: 'OY',
    cities: [
      { name: 'Ibadan', state: 'Oyo', latitude: 7.3964, longitude: 3.9476 },
      { name: 'Oyo Town', state: 'Oyo', latitude: 7.8333, longitude: 3.6333 },
      { name: 'Ogbomoso', state: 'Oyo', latitude: 8.1333, longitude: 4.2667 },
    ],
  },
  {
    name: 'Plateau',
    code: 'PL',
    cities: [
      { name: 'Jos', state: 'Plateau', latitude: 9.8965, longitude: 8.8583 },
      { name: 'Bukuru', state: 'Plateau', latitude: 9.8667, longitude: 8.8667 },
      { name: 'Pankshin', state: 'Plateau', latitude: 9.3628, longitude: 9.4417 },
    ],
  },
  {
    name: 'Rivers',
    code: 'RV',
    cities: [
      { name: 'Port Harcourt', state: 'Rivers', latitude: 4.7957, longitude: 7.0161 },
      { name: 'Obio-Akpor', state: 'Rivers', latitude: 4.8667, longitude: 7.0500 },
      { name: 'Bonny', state: 'Rivers', latitude: 4.4667, longitude: 7.1667 },
    ],
  },
  {
    name: 'Sokoto',
    code: 'SO',
    cities: [
      { name: 'Sokoto', state: 'Sokoto', latitude: 13.0059, longitude: 5.2470 },
      { name: 'Wurno', state: 'Sokoto', latitude: 12.9000, longitude: 5.1500 },
      { name: 'Gwadabawa', state: 'Sokoto', latitude: 13.7747, longitude: 5.2389 },
    ],
  },
  {
    name: 'Taraba',
    code: 'TA',
    cities: [
      { name: 'Jalingo', state: 'Taraba', latitude: 8.8931, longitude: 11.3607 },
      { name: 'Ussa', state: 'Taraba', latitude: 7.6400, longitude: 9.9800 },
      { name: 'Sardauna', state: 'Taraba', latitude: 7.4631, longitude: 11.2361 },
    ],
  },
  {
    name: 'Yobe',
    code: 'YB',
    cities: [
      { name: 'Dutse', state: 'Yobe', latitude: 11.7444, longitude: 10.1906 },
      { name: 'Potiskum', state: 'Yobe', latitude: 11.7139, longitude: 11.0847 },
      { name: 'Damaturu', state: 'Yobe', latitude: 11.7479, longitude: 11.9668 },
    ],
  },
  {
    name: 'Zamfara',
    code: 'ZA',
    cities: [
      { name: 'Gusau', state: 'Zamfara', latitude: 12.1719, longitude: 6.6611 },
      { name: 'Kaura Namoda', state: 'Zamfara', latitude: 12.4300, longitude: 6.5700 },
      { name: 'Talata Mafara', state: 'Zamfara', latitude: 12.6511, longitude: 6.2242 },
    ],
  },
  {
    name: 'Federal Capital Territory',
    code: 'FC',
    cities: [
      { name: 'Abuja', state: 'Federal Capital Territory', latitude: 9.0765, longitude: 7.3986 },
      { name: 'Garki', state: 'Federal Capital Territory', latitude: 9.0500, longitude: 7.4167 },
      { name: 'Wuse', state: 'Federal Capital Territory', latitude: 9.0730, longitude: 7.4233 },
    ],
  },
];

// Helper function to get all cities
export function getAllCities(): NigerianCity[] {
  return NIGERIAN_STATES.flatMap((state) => state.cities);
}

// Helper function to get all states
export function getAllStates(): string[] {
  return NIGERIAN_STATES.map((state) => state.name);
}

// Helper function to get cities by state
export function getCitiesByState(stateName: string): NigerianCity[] {
  const state = NIGERIAN_STATES.find((s) => s.name === stateName);
  return state ? state.cities : [];
}
