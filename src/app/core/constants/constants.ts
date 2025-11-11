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
      'The <a href="https://data.bioplatforms.com/" target="_blank" rel="noopener noreferrer" class="font-medium text-gray-900 hover:text-sky-500 hover:underline">Bioplatforms Australia Data Portal</a> and <a href="https://site.usegalaxy.org.au/" target="_blank" rel="noopener noreferrer" class="font-medium text-gray-900 hover:text-sky-500 hover:underline">Galaxy Australia</a> data access',
      'TSI public and restricted datasets in the <a href="https://data.bioplatforms.com/" target="_blank" rel="noopener noreferrer" class="font-medium text-gray-900 hover:text-sky-500 hover:underline">Bioplatforms Australia Data Portal</a>',
      '<a href="https://site.usegalaxy.org.au/" target="_blank" rel="noopener noreferrer" class="font-medium text-gray-900 hover:text-sky-500 hover:underline">Galaxy Australia</a> 2TB storage space, high memory nodes, workflows and tools',
      'Easily import data into <a href="https://site.usegalaxy.org.au/" target="_blank" rel="noopener noreferrer" class="font-medium text-gray-900 hover:text-sky-500 hover:underline">Galaxy Australia</a> from the <a href="https://data.bioplatforms.com/" target="_blank" rel="noopener noreferrer" class="font-medium text-gray-900 hover:text-sky-500 hover:underline">Bioplatforms Australia Data Portal</a>',
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
