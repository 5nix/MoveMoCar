export const MAX_PHONE_DIGITS = 15;

export const normalizePhoneInput = (value: string) =>
  value.replace(/\D/g, "").slice(0, MAX_PHONE_DIGITS);

export const normalizeConfiguredPhone = (value: string) => {
  const phone = value.replace(/\D/g, "");
  if (!phone || phone.length > MAX_PHONE_DIGITS) {
    throw new Error("手机号码无效");
  }
  return phone;
};
