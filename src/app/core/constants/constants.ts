export interface BundleService {
  id: string;
  termsTitle: string;
  termsUrl: string;
}

export interface Bundle {
  id: string;
  name: string;
  logoUrls: string[];
  listItems: string[];
  disabled?: boolean;
  services: BundleService[];
}

export type PlatformId = 'galaxy' | 'bpa_data_portal' | 'sbp';

export interface Platform {
  id: PlatformId;
  name: string;
  logoUrl: string;
  url: string;
}

export const PLATFORMS: Record<PlatformId, Platform> = {
  galaxy: {
    id: 'galaxy',
    name: 'Galaxy Australia',
    logoUrl: '/assets/galaxy-logo.png',
    url: 'https://site.usegalaxy.org.au/',
  },
  bpa_data_portal: {
    id: 'bpa_data_portal',
    name: 'Bioplatforms Australia Data Portal',
    logoUrl: '/assets/bpa-logo.png',
    url: 'https://data.bioplatforms.com/',
  },
  sbp: {
    id: 'sbp',
    name: 'Structural Biology Platform',
    logoUrl: '/assets/biocommons-logo.png',
    url: 'https://sbp.biocommons.org.au/',
  },
} as const;

/**
 * Allowed email domains for SBP (Structural Biology Platform) registration
 */
export const SBP_ALLOWED_EMAIL_DOMAINS = [
  // UNSW
  'unsw.edu.au',
  'ad.unsw.edu.au',
  'student.unsw.edu.au',
  // BioCommons
  'biocommons.org.au',
  // USyd
  'sydney.edu.au',
  'uni.sydney.edu.au',
  // WEHI
  'wehi.edu.au',
  // Monash
  'monash.edu',
  'student.monash.edu',
  // Griffith
  'griffith.edu.au',
  'griffithuni.edu.au',
  // UoM
  'unimelb.edu.au',
  'student.unimelb.edu.au',
] as const;

const tsiBundleService: BundleService = {
  id: 'tsi',
  termsTitle: 'TSI Terms and Conditions',
  termsUrl: 'https://threatenedspeciesinitiative.com/',
};

const fgeneshBundleService: BundleService = {
  id: 'fgenesh',
  termsTitle: 'Fgenesh++ Terms and Conditions',
  termsUrl: 'https://site.usegalaxy.org.au/fgenesh-terms.html',
};

export const biocommonsBundles: Bundle[] = [
  {
    id: 'tsi',
    name: 'Threatened Species Initiative (TSI)',
    logoUrls: ['/assets/tsi-logo.jpg'],
    listItems: [
      'Access Bioplatforms Data Portal open data',
      'Access embargoed TSI data from Bioplatforms Data Portal',
      'Easily transfer data from the Bioplatforms Data Portal to Galaxy Australia',
      'Full access to Galaxy Australia service',
      'Run large genome assemblies and genome annotation FgenesH++ pipelines on Galaxy Australia',
    ],
    services: [tsiBundleService, fgeneshBundleService],
  },
  {
    id: 'fungi',
    name: "Fungi Functional 'Omics",
    logoUrls: ['/assets/aff-logo.png'],
    listItems: ['Coming soon!'],
    disabled: true,
    services: [],
  },
];
