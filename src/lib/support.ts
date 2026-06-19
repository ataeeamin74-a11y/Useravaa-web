// Configure this in deployment with the official Useravaa support address.
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_USERAVAA_SUPPORT_EMAIL?.trim() || "Support@useravaa.ir";
export const SUPPORT_MAILTO = `mailto:${SUPPORT_EMAIL}`;
