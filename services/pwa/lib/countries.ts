export interface Country {
  code: string;
  name: string;
}

export interface State {
  code: string;
  name: string;
}

export const COUNTRIES: Country[] = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IN', name: 'India' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SG', name: 'Singapore' },
  { code: 'ID', name: 'Indonesia' },
];

export const US_STATES: State[] = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
  { code: 'DC', name: 'District of Columbia' },
];

export const CA_PROVINCES: State[] = [
  { code: 'AB', name: 'Alberta' },
  { code: 'BC', name: 'British Columbia' },
  { code: 'MB', name: 'Manitoba' },
  { code: 'NB', name: 'New Brunswick' },
  { code: 'NL', name: 'Newfoundland and Labrador' },
  { code: 'NS', name: 'Nova Scotia' },
  { code: 'NT', name: 'Northwest Territories' },
  { code: 'NU', name: 'Nunavut' },
  { code: 'ON', name: 'Ontario' },
  { code: 'PE', name: 'Prince Edward Island' },
  { code: 'QC', name: 'Quebec' },
  { code: 'SK', name: 'Saskatchewan' },
  { code: 'YT', name: 'Yukon' },
];

export const AU_STATES: State[] = [
  { code: 'NSW', name: 'New South Wales' },
  { code: 'QLD', name: 'Queensland' },
  { code: 'SA', name: 'South Australia' },
  { code: 'TAS', name: 'Tasmania' },
  { code: 'VIC', name: 'Victoria' },
  { code: 'WA', name: 'Western Australia' },
  { code: 'ACT', name: 'Australian Capital Territory' },
  { code: 'NT', name: 'Northern Territory' },
];

export const GB_REGIONS: State[] = [
  { code: 'ENG', name: 'England' },
  { code: 'SCT', name: 'Scotland' },
  { code: 'WLS', name: 'Wales' },
  { code: 'NIR', name: 'Northern Ireland' },
];

export const IN_STATES: State[] = [
  { code: 'AN', name: 'Andaman and Nicobar Islands' },
  { code: 'AP', name: 'Andhra Pradesh' },
  { code: 'AR', name: 'Arunachal Pradesh' },
  { code: 'AS', name: 'Assam' },
  { code: 'BR', name: 'Bihar' },
  { code: 'CH', name: 'Chandigarh' },
  { code: 'CT', name: 'Chhattisgarh' },
  { code: 'DH', name: 'Dadra and Nagar Haveli and Daman and Diu' },
  { code: 'DL', name: 'Delhi' },
  { code: 'GA', name: 'Goa' },
  { code: 'GJ', name: 'Gujarat' },
  { code: 'HR', name: 'Haryana' },
  { code: 'HP', name: 'Himachal Pradesh' },
  { code: 'JK', name: 'Jammu and Kashmir' },
  { code: 'JH', name: 'Jharkhand' },
  { code: 'KA', name: 'Karnataka' },
  { code: 'KL', name: 'Kerala' },
  { code: 'LA', name: 'Ladakh' },
  { code: 'LD', name: 'Lakshadweep' },
  { code: 'MP', name: 'Madhya Pradesh' },
  { code: 'MH', name: 'Maharashtra' },
  { code: 'MN', name: 'Manipur' },
  { code: 'ML', name: 'Meghalaya' },
  { code: 'MZ', name: 'Mizoram' },
  { code: 'NL', name: 'Nagaland' },
  { code: 'OR', name: 'Odisha' },
  { code: 'PY', name: 'Puducherry' },
  { code: 'PB', name: 'Punjab' },
  { code: 'RJ', name: 'Rajasthan' },
  { code: 'SK', name: 'Sikkim' },
  { code: 'TN', name: 'Tamil Nadu' },
  { code: 'TS', name: 'Telangana' },
  { code: 'TR', name: 'Tripura' },
  { code: 'UP', name: 'Uttar Pradesh' },
  { code: 'UK', name: 'Uttarakhand' },
  { code: 'WB', name: 'West Bengal' },
];

export const AE_EMIRATES: State[] = [
  { code: 'AZ', name: 'Abu Dhabi' },
  { code: 'AJ', name: 'Ajman' },
  { code: 'DU', name: 'Dubai' },
  { code: 'FU', name: 'Fujairah' },
  { code: 'RK', name: 'Ras Al Khaimah' },
  { code: 'SH', name: 'Sharjah' },
  { code: 'UQ', name: 'Umm Al Quwain' },
];

export const ID_PROVINCES: State[] = [
  { code: 'AC', name: 'Aceh' },
  { code: 'BA', name: 'Bali' },
  { code: 'BB', name: 'Bangka Belitung Islands' },
  { code: 'BT', name: 'Banten' },
  { code: 'BE', name: 'Bengkulu' },
  { code: 'JT', name: 'Central Java' },
  { code: 'KT', name: 'Central Kalimantan' },
  { code: 'ST', name: 'Central Sulawesi' },
  { code: 'GO', name: 'Gorontalo' },
  { code: 'JK', name: 'Jakarta' },
  { code: 'JA', name: 'Jambi' },
  { code: 'JI', name: 'East Java' },
  { code: 'KI', name: 'East Kalimantan' },
  { code: 'NT', name: 'East Nusa Tenggara' },
  { code: 'LA', name: 'Lampung' },
  { code: 'MA', name: 'Maluku' },
  { code: 'KU', name: 'North Kalimantan' },
  { code: 'MU', name: 'North Maluku' },
  { code: 'SA', name: 'North Sulawesi' },
  { code: 'SB', name: 'North Sumatra' },
  { code: 'PA', name: 'Papua' },
  { code: 'RI', name: 'Riau' },
  { code: 'KR', name: 'Riau Islands' },
  { code: 'SG', name: 'Southeast Sulawesi' },
  { code: 'KS', name: 'South Kalimantan' },
  { code: 'SN', name: 'South Sulawesi' },
  { code: 'SS', name: 'South Sumatra' },
  { code: 'JB', name: 'West Java' },
  { code: 'KB', name: 'West Kalimantan' },
  { code: 'NB', name: 'West Nusa Tenggara' },
  { code: 'PB', name: 'West Papua' },
  { code: 'SR', name: 'West Sulawesi' },
  { code: 'SU', name: 'West Sumatra' },
  { code: 'YO', name: 'Yogyakarta' },
];

export function getStatesForCountry(countryCode: string): State[] {
  switch (countryCode) {
    case 'US':
      return US_STATES;
    case 'CA':
      return CA_PROVINCES;
    case 'AU':
      return AU_STATES;
    case 'GB':
      return GB_REGIONS;
    case 'IN':
      return IN_STATES;
    case 'AE':
      return AE_EMIRATES;
    case 'ID':
      return ID_PROVINCES;
    default:
      return [];
  }
}

export function countryRequiresState(countryCode: string): boolean {
  return ['US', 'CA', 'AU', 'GB', 'IN', 'AE', 'ID'].includes(countryCode);
}

export function validateCountryCode(code: string): boolean {
  return COUNTRIES.some(c => c.code === code);
}

export function validateStateCode(countryCode: string, stateCode: string): boolean {
  const states = getStatesForCountry(countryCode);
  return states.some(s => s.code === stateCode);
}
