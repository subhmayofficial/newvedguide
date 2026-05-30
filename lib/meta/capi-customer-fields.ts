/** Normalize customer fields for Meta CAPI user_data (pre-hash). */

export interface MetaCapiCustomerFields {
  firstName?: string | null;
  lastName?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
}

type BirthDetailsRow = {
  full_name?: string | null;
  gender?: string | null;
  date_of_birth?: string | null;
  birth_place?: string | null;
  birth_city?: string | null;
  birth_state?: string | null;
  birth_country?: string | null;
};

type PhysicalShippingRow = {
  shipping_full_name?: string | null;
  shipping_city?: string | null;
  shipping_state?: string | null;
  shipping_pincode?: string | null;
  shipping_country?: string | null;
};

const COUNTRY_ALIASES: Record<string, string> = {
  india: "in",
  in: "in",
  ind: "in",
  bharat: "in",
};

export function splitFullName(fullName: string | null | undefined): {
  firstName: string | null;
  lastName: string | null;
} {
  const raw = fullName?.trim();
  if (!raw) return { firstName: null, lastName: null };
  const parts = raw.split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: null, lastName: null };
  if (parts.length === 1) return { firstName: parts[0], lastName: null };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function parseBirthPlace(place: string | null | undefined): {
  city: string | null;
  state: string | null;
  country: string | null;
} {
  const raw = place?.trim();
  if (!raw) return { city: null, state: null, country: null };

  const segments = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (segments.length >= 3) {
    return {
      city: segments[0],
      state: segments[1],
      country: segments[segments.length - 1],
    };
  }
  if (segments.length === 2) {
    return { city: segments[0], state: segments[1], country: null };
  }
  return { city: segments[0], state: null, country: null };
}

function normalizeCountryCode(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const key = raw.trim().toLowerCase().replace(/[^a-z]/g, "");
  if (COUNTRY_ALIASES[key]) return COUNTRY_ALIASES[key];
  if (/^[a-z]{2}$/.test(key)) return key;
  return null;
}

export function resolveMetaCapiCustomerFields(input: {
  customerFullName?: string | null;
  birthDetails?: BirthDetailsRow | null;
  physicalShipping?: PhysicalShippingRow | null;
}): MetaCapiCustomerFields {
  const birth = input.birthDetails;
  const ship = input.physicalShipping;
  const parsedPlace = parseBirthPlace(birth?.birth_place);

  const nameSource =
    birth?.full_name?.trim() ||
    ship?.shipping_full_name?.trim() ||
    input.customerFullName?.trim() ||
    null;
  const { firstName, lastName } = splitFullName(nameSource);

  const city =
    ship?.shipping_city?.trim() ||
    birth?.birth_city?.trim() ||
    parsedPlace.city ||
    null;

  const state =
    ship?.shipping_state?.trim() ||
    birth?.birth_state?.trim() ||
    parsedPlace.state ||
    null;

  const zip = ship?.shipping_pincode?.trim() || null;

  const country =
    normalizeCountryCode(ship?.shipping_country) ||
    normalizeCountryCode(birth?.birth_country) ||
    normalizeCountryCode(parsedPlace.country) ||
    "in";

  return {
    firstName,
    lastName,
    gender: birth?.gender ?? null,
    dateOfBirth: birth?.date_of_birth ?? null,
    city,
    state,
    zip,
    country,
  };
}
