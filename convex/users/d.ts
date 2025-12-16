import {Infer, v} from 'convex/values'

// Address schema for shipping/billing addresses
export const addressSchema = v.object({
  id: v.string(), // Unique identifier for the address
  type: v.union(v.literal('shipping'), v.literal('billing'), v.literal('both')),
  firstName: v.string(), // Required for order processing
  lastName: v.string(), // Required for order processing
  company: v.optional(v.string()),
  addressLine1: v.string(),
  addressLine2: v.optional(v.string()),
  city: v.string(),
  state: v.string(),
  zipCode: v.string(),
  country: v.string(),
  phone: v.optional(v.string()),
  isDefault: v.optional(v.boolean()),
  visible: v.optional(v.boolean()),
  telegram: v.optional(v.string()),
  signal: v.optional(v.string()),
})

// Contact information schema
export const contactSchema = v.object({
  phone: v.optional(v.string()),
  alternateEmail: v.optional(v.string()),
  preferredContactMethod: v.optional(
    v.union(v.literal('email'), v.literal('phone'), v.literal('sms')),
  ),
})

// Social media links schema
export const socialMediaSchema = v.object({
  instagram: v.optional(v.string()),
  twitter: v.optional(v.string()),
  facebook: v.optional(v.string()),
  linkedin: v.optional(v.string()),
  tiktok: v.optional(v.string()),
  website: v.optional(v.string()),
})

// Payment method schema (matching orders schema)
const paymentMethodSchema = v.union(
  v.literal('credit_card'),
  v.literal('debit_card'),
  v.literal('paypal'),
  v.literal('apple_pay'),
  v.literal('google_pay'),
  v.literal('bank_transfer'),
  v.literal('cash'),
  v.literal('other'),
)

// Customer preferences schema
export const preferencesSchema = v.object({
  newsletter: v.optional(v.boolean()),
  marketingEmails: v.optional(v.boolean()),
  smsNotifications: v.optional(v.boolean()),
  preferredLanguage: v.optional(v.string()),
  currency: v.optional(v.string()),
  defaultPaymentMethod: v.optional(paymentMethodSchema), // Default payment method preference
})

export const userSchema = v.object({
  // Basic information
  email: v.string(),
  name: v.string(),
  firebaseId: v.string(),
  photoUrl: v.optional(v.string()),

  // Contact information
  contact: v.optional(contactSchema),

  // Addresses (array to support multiple addresses)
  addresses: v.optional(v.array(addressSchema)),
  
  // Default address references (for quick checkout)
  defaultShippingAddressId: v.optional(v.string()), // ID of default shipping address
  defaultBillingAddressId: v.optional(v.string()), // ID of default billing address

  // Social media links
  socialMedia: v.optional(socialMediaSchema),

  // Additional customer information
  dateOfBirth: v.optional(v.string()), // ISO date string
  gender: v.optional(
    v.union(
      v.literal('male'),
      v.literal('female'),
      v.literal('other'),
      v.literal('prefer-not-to-say'),
    ),
  ),

  // Preferences
  preferences: v.optional(preferencesSchema),

  // Timestamps
  createdAt: v.optional(v.number()),
  updatedAt: v.optional(v.number()),
})

export type UserType = Infer<typeof userSchema>
export type AddressType = Infer<typeof addressSchema>
export type ContactType = Infer<typeof contactSchema>
export type SocialMediaType = Infer<typeof socialMediaSchema>
export type PreferencesType = Infer<typeof preferencesSchema>
