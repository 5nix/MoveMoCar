import type { Locale } from "../locale";

export interface NotificationSubmission {
  phone: string;
  message: string;
  submittedAt: string;
  pageUrl: string;
  vehiclePlate: string;
  vehicleTitle: string;
  locale: Locale;
}
