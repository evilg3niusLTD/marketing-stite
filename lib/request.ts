export const ROLES = [
  { value: "operator", label: "I will operate the desk" },
  { value: "affiliate", label: "I send traffic as an affiliate" },
  { value: "buyer", label: "I receive leads as a buyer" },
] as const;

export const VOLUMES = [
  "Under 1,000 leads a month",
  "1,000 to 10,000 leads a month",
  "More than 10,000 leads a month",
  "Not sure yet",
] as const;

export type RequestRole = (typeof ROLES)[number]["value"];
export type RequestVolume = (typeof VOLUMES)[number];

export type DeskRequest = {
  email: string;
  telegram: string;
  role: RequestRole;
  countries: string;
  volume: RequestVolume;
};

export type RequestErrors = Partial<Record<keyof DeskRequest, string>>;

const ROLE_VALUES = new Set<string>(ROLES.map((role) => role.value));
const VOLUME_VALUES = new Set<string>(VOLUMES);

export function telegramHandle(value: string) {
  const trimmed = value.trim();
  const fromLink = trimmed.match(/(?:https?:\/\/)?(?:t\.me|telegram\.me)\/([A-Za-z][A-Za-z0-9_]{4,31})/i);
  const raw = fromLink ? fromLink[1] : trimmed.replace(/^@/, "");
  if (!/^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(raw)) return "";
  return `@${raw}`;
}

export function parseDeskRequest(input: unknown): { ok: true; value: DeskRequest } | { ok: false; errors: RequestErrors } {
  const body = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const email = String(body.email || "").trim();
  const telegram = telegramHandle(String(body.telegram || ""));
  const role = String(body.role || "").trim();
  const countries = String(body.countries || "").trim().replace(/\s+/g, " ");
  const volume = String(body.volume || "").trim();
  const errors: RequestErrors = {};
  if (!/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(email)) errors.email = "Enter a valid email.";
  if (!telegram) errors.telegram = "Enter a Telegram username, like @yourname.";
  if (!ROLE_VALUES.has(role)) errors.role = "Choose operator, affiliate, or buyer.";
  if (countries.length < 2 || !/[A-Za-z]/.test(countries)) errors.countries = "Enter the countries you run.";
  if (countries.length > 120) errors.countries = "Keep the country list short.";
  if (!VOLUME_VALUES.has(volume)) errors.volume = "Choose a lead volume.";
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      email,
      telegram,
      role: role as RequestRole,
      countries,
      volume: volume as RequestVolume,
    },
  };
}
