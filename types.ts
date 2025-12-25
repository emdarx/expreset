export type VpnServiceType = 'v2ray' | 'express' | null;

export interface Plan {
  id: string;
  durationLabel: string; // e.g., "1 Month"
  userCount: number;
  price: number;
  formattedPrice: string;
  badge?: string;
}

export type Step = 'welcome' | 'service-selection' | 'plan-selection' | 'contact-method' | 'payment' | 'free-test';

export type ContactType = 'email' | 'instagram';

export interface AppState {
  currentStep: Step;
  selectedService: VpnServiceType;
  selectedPlan: Plan | null;
  contactInfo: string;
  contactType: ContactType;
  finalPriceRial: number | null; // To store the randomized price
  selectedCardIndex: number | null; // To persist the selected bank card
}