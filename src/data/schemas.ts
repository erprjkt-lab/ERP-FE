import { COMPANY, ERP_MODULES, FAQS, INDUSTRIES, PRODUCTS } from './site'
import { SITE_NAME, SITE_URL } from './seo'

export interface PageSchemaResult {
  webpageType: 'WebPage' | 'AboutPage' | 'CollectionPage' | 'ContactPage'
  extraSchemas: Record<string, unknown>[]
}

/**
 * Returns structured schema data (Schema.org / Google Rich Results compliant)
 * for each page route in the site. Shared across both the static prerender
 * build (scripts/prerender-seo.mjs) and the client-side navigation hook (src/hooks/useSeo.ts).
 */
export function getPageSchemas(pathname: string): PageSchemaResult {
  const url = `${SITE_URL}${pathname === '/' ? '' : pathname}`

  switch (pathname) {
    case '/': {
      return {
        webpageType: 'WebPage',
        extraSchemas: [
          {
            '@context': 'https://schema.org',
            '@type': 'ProfessionalService',
            name: COMPANY.name,
            url: SITE_URL,
            logo: `${SITE_URL}/logo-full.png`,
            image: `${SITE_URL}/og-image.png`,
            description:
              'ERP software and custom web development for engineering, healthcare, technology, manufacturing and trading businesses.',
            email: COMPANY.email,
            priceRange: '$$',
            address: {
              '@type': 'PostalAddress',
              streetAddress: "308, Shree Mahalaxmi Complex, Opp. to Saint Mary's High School, Kalavad Road",
              addressLocality: 'Rajkot',
              addressRegion: 'Gujarat',
              postalCode: '360005',
              addressCountry: 'IN',
            },
            geo: {
              '@type': 'GeoCoordinates',
              latitude: 22.2889,
              longitude: 70.7672,
            },
            areaServed: [
              { '@type': 'City', name: 'Rajkot' },
              { '@type': 'AdministrativeArea', name: 'Saurashtra' },
              { '@type': 'State', name: 'Gujarat' },
              { '@type': 'Country', name: 'India' },
              { '@type': 'Place', name: 'Worldwide' },
            ],
            knowsAbout: [
              'ERP Software in Rajkot',
              'Software Development Company in Rajkot',
              'Industrial Management System',
              'Manufacturing ERP Solutions',
              'Custom Web Development in Rajkot',
              'Enterprise Resource Planning (ERP)',
              'Production & Shop Floor Management',
              'Inventory & Supply Chain Software',
            ],
            openingHoursSpecification: {
              '@type': 'OpeningHoursSpecification',
              dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
              opens: '09:00',
              closes: '19:00',
            },
            hasOfferCatalog: {
              '@type': 'OfferCatalog',
              name: 'CoreFlowTech Solutions & Services in Rajkot',
              itemListElement: [
                {
                  '@type': 'Offer',
                  itemOffered: {
                    '@type': 'Service',
                    name: 'ERP Software & Industrial Management System in Rajkot',
                    url: `${SITE_URL}/services/erp-solutions`,
                    description:
                      'All-in-one ERP software and industrial management systems connecting production, inventory, HR, finance, and procurement.',
                  },
                },
                {
                  '@type': 'Offer',
                  itemOffered: {
                    '@type': 'Service',
                    name: 'Software Development & Custom Web Engineering in Rajkot',
                    url: `${SITE_URL}/services/web-development`,
                    description:
                      'Top software development company in Rajkot delivering custom web applications, enterprise portals, and high-performance websites.',
                  },
                },
              ],
            },
          },
        ],
      }
    }

    case '/about': {
      return {
        webpageType: 'AboutPage',
        extraSchemas: [
          {
            '@context': 'https://schema.org',
            '@type': 'AboutPage',
            name: 'About CoreFlowTech | ERP & Web Development Experts',
            description:
              "CoreFlowTech builds ERP software and web platforms for engineering, healthcare, technology and manufacturing teams. Learn about our approach, values, and engineering methodology.",
            url,
            mainEntity: {
              '@type': 'Organization',
              name: COMPANY.name,
              url: SITE_URL,
              email: COMPANY.email,
              knowsAbout: [
                'ERP Software in Rajkot',
                'Software Development Company in Rajkot',
                'Industrial Management System',
                'Enterprise Resource Planning (ERP)',
                'Web Application Development',
                'Manufacturing Workflow Optimization',
                'Supply Chain & Inventory Management',
                'Shop Floor Automation',
                'Cloud Architecture',
              ],
            },
          },
        ],
      }
    }

    case '/services': {
      return {
        webpageType: 'CollectionPage',
        extraSchemas: [
          {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: 'CoreFlowTech Services & Solutions',
            description:
              'Two core engineering disciplines: enterprise ERP software and custom web platforms.',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                item: {
                  '@type': 'Service',
                  name: 'ERP Solutions',
                  url: `${SITE_URL}/services/erp-solutions`,
                  description:
                    'A single connected system for HR, finance, inventory, production, procurement and sales.',
                  provider: {
                    '@type': 'Organization',
                    name: SITE_NAME,
                    url: SITE_URL,
                  },
                },
              },
              {
                '@type': 'ListItem',
                position: 2,
                item: {
                  '@type': 'Service',
                  name: 'Web Development',
                  url: `${SITE_URL}/services/web-development`,
                  description:
                    'Fast, modern websites and web platforms built to represent your business well.',
                  provider: {
                    '@type': 'Organization',
                    name: SITE_NAME,
                    url: SITE_URL,
                  },
                },
              },
            ],
          },
        ],
      }
    }

    case '/services/erp-solutions': {
      return {
        webpageType: 'WebPage',
        extraSchemas: [
          {
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'CoreFlowTech ERP',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web, Cloud, All Modern Browsers',
            description:
              'CoreFlowTech ERP unifies HR & payroll, finance, inventory, production, procurement and sales into one platform, configured around how your business runs.',
            url,
            featureList: ERP_MODULES.map(m => m.title),
            creator: {
              '@type': 'Organization',
              name: SITE_NAME,
              url: SITE_URL,
            },
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'INR',
              description: 'Custom rollout configured around your business workflow. Request a demo.',
            },
          },
          {
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'ERP Software & Industrial Management System Implementation in Rajkot',
            serviceType: 'Enterprise Resource Planning (ERP)',
            url,
            provider: {
              '@type': 'Organization',
              name: SITE_NAME,
              url: SITE_URL,
            },
            areaServed: [
              { '@type': 'City', name: 'Rajkot' },
              { '@type': 'State', name: 'Gujarat' },
              { '@type': 'Country', name: 'India' },
            ],
            description:
              'Custom ERP software implementation, industrial management systems, data migration, and shop floor tracking in Rajkot, Gujarat.',
          },
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQS.map(faq => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
              },
            })),
          },
        ],
      }
    }

    case '/services/web-development': {
      return {
        webpageType: 'WebPage',
        extraSchemas: [
          {
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'Software Development & Custom Web Engineering in Rajkot',
            serviceType: 'Software Development & Web Application Development',
            url,
            provider: {
              '@type': 'Organization',
              name: SITE_NAME,
              url: SITE_URL,
            },
            description:
              'Top software development company in Rajkot delivering custom web applications, B2B portals, and high-performance websites.',
            areaServed: [
              { '@type': 'City', name: 'Rajkot' },
              { '@type': 'State', name: 'Gujarat' },
              { '@type': 'Country', name: 'India' },
              { '@type': 'Place', name: 'Worldwide' },
            ],
            hasOfferCatalog: {
              '@type': 'OfferCatalog',
              name: 'Web Engineering Capabilities',
              itemListElement: [
                {
                  '@type': 'Offer',
                  itemOffered: {
                    '@type': 'Service',
                    name: 'Custom Web Platforms & Portals',
                  },
                },
                {
                  '@type': 'Offer',
                  itemOffered: {
                    '@type': 'Service',
                    name: 'High-Performance Marketing Websites',
                  },
                },
                {
                  '@type': 'Offer',
                  itemOffered: {
                    '@type': 'Service',
                    name: 'Full-Stack React & Node Architecture',
                  },
                },
                {
                  '@type': 'Offer',
                  itemOffered: {
                    '@type': 'Service',
                    name: 'REST API & Third-Party System Integrations',
                  },
                },
              ],
            },
          },
        ],
      }
    }

    case '/industries': {
      return {
        webpageType: 'CollectionPage',
        extraSchemas: [
          {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: 'ERP Solutions by Industry',
            description:
              'CoreFlowTech delivers ERP software tuned to how each industry runs.',
            itemListElement: INDUSTRIES.map((ind, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              item: {
                '@type': 'Service',
                name: `${ind.name} ERP Solutions`,
                description: ind.description,
                provider: {
                  '@type': 'Organization',
                  name: SITE_NAME,
                  url: SITE_URL,
                },
              },
            })),
          },
        ],
      }
    }

    case '/products': {
      return {
        webpageType: 'CollectionPage',
        extraSchemas: [
          {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: 'CoreFlowTech Products',
            description:
              'Software tools engineered by CoreFlowTech alongside custom ERP software and web development.',
            itemListElement: PRODUCTS.map((prod, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              item: {
                '@type': 'SoftwareApplication',
                name: prod.name,
                applicationCategory:
                  prod.category === 'Analytics' ? 'AnalyticsApplication' : 'BusinessApplication',
                operatingSystem: 'Web',
                description: prod.description,
                creator: {
                  '@type': 'Organization',
                  name: SITE_NAME,
                  url: SITE_URL,
                },
              },
            })),
          },
        ],
      }
    }

    case '/contact': {
      return {
        webpageType: 'ContactPage',
        extraSchemas: [
          {
            '@context': 'https://schema.org',
            '@type': 'ContactPoint',
            contactType: 'sales and customer service',
            email: COMPANY.email,
            areaServed: ['IN', 'Worldwide'],
            availableLanguage: ['English', 'Hindi', 'Gujarati'],
          },
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQS.map(faq => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
              },
            })),
          },
        ],
      }
    }

    default:
      return {
        webpageType: 'WebPage',
        extraSchemas: [],
      }
  }
}
