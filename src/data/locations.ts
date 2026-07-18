// Worldwide Location System
// Uses Google Places API for state/city autocomplete
// Fallback static data for common countries

export interface LocationConfig {
  countries: string[];
}

// Common countries list (can be expanded)
export const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Argentina", "Australia",
  "Bangladesh", "Belgium", "Brazil", "Canada", "China",
  "Denmark", "Egypt", "Finland", "France", "Germany",
  "Ghana", "Greece", "India", "Indonesia", "Iran",
  "Iraq", "Ireland", "Israel", "Italy", "Japan",
  "Jordan", "Kenya", "Kuwait", "Lebanon", "Malaysia",
  "Mexico", "Morocco", "Nepal", "Netherlands", "New Zealand",
  "Nigeria", "Norway", "Oman", "Pakistan", "Palestine",
  "Philippines", "Poland", "Portugal", "Qatar", "Romania",
  "Russia", "Saudi Arabia", "Singapore", "South Africa", "South Korea",
  "Spain", "Sri Lanka", "Sweden", "Switzerland", "Thailand",
  "Tunisia", "Turkey", "UAE", "Uganda", "Ukraine",
  "United Kingdom", "United States", "Uzbekistan", "Vietnam", "Yemen",
];

// Location selection flow:
// 1. User selects country from searchable dropdown
// 2. State/province field → Google Places autocomplete (filtered by country)
// 3. City field → Google Places autocomplete (filtered by state)
// 4. Area field → free text with Google Places autocomplete
// 5. On save → Geocode to get lat/lng

// Google API endpoints:
// - Places Autocomplete: https://maps.googleapis.com/maps/api/place/autocomplete/json
// - Geocoding: https://maps.googleapis.com/maps/api/geocode/json
// - Countries/States: Use Google Places with type=(regions) and components=country:{code}

export function getCountryCode(countryName: string): string | null {
  const codes: Record<string, string> = {
    "United States": "us",
    "United Kingdom": "gb",
    "Bangladesh": "bd",
    "India": "in",
    "Pakistan": "pk",
    "Canada": "ca",
    "Australia": "au",
    "Germany": "de",
    "France": "fr",
    "Japan": "jp",
    "China": "cn",
    "Brazil": "br",
    "Nigeria": "ng",
    "South Africa": "za",
    "UAE": "ae",
    "Saudi Arabia": "sa",
    "Singapore": "sg",
    "Malaysia": "my",
    "Indonesia": "id",
    "Philippines": "ph",
    "Thailand": "th",
    "Vietnam": "vn",
    "Egypt": "eg",
    "Turkey": "tr",
    "Kenya": "ke",
    "Ghana": "gh",
    "Nepal": "np",
    "Sri Lanka": "lk",
  };
  return codes[countryName] || null;
}
