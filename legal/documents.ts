export interface Heading {
  id: string
  text: string
  level: number
}

export interface LegalDocument {
  slug: string
  title: string
  description: string
  content?: string // Optional for remote sources
  remoteSource?: string // URL to fetch MDX content from
  headings?: Heading[]
}

const termsOfUseContent = `# Terms of Use

Last updated: October 22, 2024

## 1. Agreement to Terms

By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.

## 2. Use License

Permission is granted to temporarily download one copy of the materials (information or software) on our website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:

- Modifying or copying the materials
- Using the materials for any commercial purpose or for any public display
- Attempting to decompile or reverse engineer any software contained on the website
- Removing any copyright or other proprietary notations from the materials
- Transferring the materials to another person or "mirroring" the materials on any other server

## 3. Disclaimer

The materials on our website are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.

## 4. Limitations

In no event shall our company or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on our website.

## 5. Accuracy of Materials

The materials appearing on our website could include technical, typographical, or photographic errors. Our company does not warrant that any of the materials on our website are accurate, complete, or current.

## 6. Links

Our company has not reviewed all of the sites linked to our website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by our company of the site. Use of any such linked website is at the user's own risk.

## 7. Modifications

Our company may revise these terms of service for our website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.

## 8. Governing Law

These terms and conditions are governed by and construed in accordance with the laws of the jurisdiction in which the company is located, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
`

const privacyPolicyContent = `# Privacy Policy

Last updated: October 2024

## 1. Introduction

We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.

## 2. Information We Collect

We may collect information about you in a variety of ways. The information we may collect on the site includes:

### Personal Data
- Name
- Email address
- Phone number
- Billing address
- Payment information

### Automatically Collected Information
- Browser type and version
- IP address
- Operating system
- Pages visited
- Time and date of visits
- Time spent on pages

## 3. Use of Your Information

Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the site to:

- Generate a personal profile about you so that future visits to the site will be personalized
- Increase the efficiency and operation of the site
- Monitor and analyze usage and trends to improve your experience with the site
- Notify you of updates to the site
- Offer new products, services, and/or recommendations to you

## 4. Disclosure of Your Information

We may share or disclose your information in the following situations:

- By Law or to Protect Rights
- Third-Party Service Providers
- Business Transfers
- By Your Consent

## 5. Security of Your Information

We use administrative, technical, and physical security measures to protect your personal information. However, perfect security cannot be guaranteed.

## 6. Contact Us

If you have questions or comments about this Privacy Policy, please contact us at:

Email: support@protap.ph
Address: 5B, Crissant Plaza Building, 272 Commonwealth Ave, Quezon City, 1119 Metro Manila

## 7. Changes to This Privacy Policy

We may update this Privacy Policy from time to time to reflect changes in our practices and technology. We will notify you of any material changes by posting the new Privacy Policy on the site.
`

const purchasePolicyContent = `# Purchase Policy

Last updated: October 2024

## 1. Product Availability

All products and services are subject to availability. We reserve the right to limit quantities and to discontinue any product at any time.

## 2. Pricing

All prices are subject to change without notice. We reserve the right to correct any errors or omissions in pricing information.

## 3. Order Acceptance

We reserve the right to refuse or cancel any order. We will notify you if your order is cancelled and will provide a full refund.

## 4. Payment

We accept various payment methods including credit cards, debit cards, and digital payment systems. Payment must be received before order processing.

## 5. Shipping and Delivery

### Shipping Methods
We offer various shipping options. Shipping costs will be calculated and displayed before checkout.

### Delivery Times
Estimated delivery times are provided for reference only and are not guaranteed. We are not responsible for delays caused by shipping carriers or other third parties.

### Risk of Loss
Risk of loss passes to you upon delivery to the shipping carrier.

## 6. Returns and Refunds

### Return Period
Products may be returned within 30 days of purchase in original condition with all packaging and documentation.

### Return Process
1. Contact our customer service to initiate a return
2. Obtain a return authorization number
3. Ship the product back to us with the authorization number
4. Upon receipt and inspection, we will process your refund

### Refund Timeline
Refunds will be processed within 5-7 business days after we receive and inspect the returned item.

### Non-Returnable Items
The following items cannot be returned:
- Customized or personalized products
- Digital products or services
- Items damaged due to misuse

## 7. Damaged or Defective Products

If you receive a damaged or defective product, please contact us within 48 hours with photos of the damage. We will arrange for a replacement or refund.

## 8. Cancellation

Orders may be cancelled within 24 hours of purchase. After 24 hours, orders cannot be cancelled but may be returned according to our return policy.

## 9. Warranty

Products are provided with a standard manufacturer's warranty. Extended warranty options may be available for purchase.

## 10. Limitation of Liability

We are not liable for any indirect, incidental, special, or consequential damages arising from your purchase or use of our products.

## 11. Contact Information

For questions about this Purchase Policy, please contact:

Email: support@protap.com
Phone: +63-915-698-4207
Hours: Monday-Friday, 9 AM - 5 PM MANILA
`

export const legalDocuments: LegalDocument[] = [
  {
    slug: 'terms-of-use',
    title: 'Terms of Use',
    description: 'Our terms and conditions for using this website',
    content: termsOfUseContent,
  },
  {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    description: 'How we collect and use your information',
    content: privacyPolicyContent,
  },
  {
    slug: 'purchase-agreement',
    title: 'Purchase Agreement',
    description: 'Our policies regarding purchases and returns',
    content: purchasePolicyContent,
  },
  // Example: Remote MDX document
  // Uncomment and configure to load MDX from a remote URL:
  // {
  //   slug: 'remote-document',
  //   title: 'Remote Document',
  //   description: 'Document loaded from remote source',
  //   remoteSource: 'https://example.com/path/to/document.mdx',
  // },
]
