export interface Bundle {
  id: string;
  name: string;
  logoUrls: string[];
  listItems: string[];
  requireReason?: boolean;
  disabled?: boolean;
  approved?: boolean;
  pending?: boolean;
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

export const BIOCOMMONS_BUNDLES: Bundle[] = [
  {
    id: 'tsi',
    name: 'Threatened Species Initiative (TSI)',
    logoUrls: ['/assets/tsi-logo.jpg'],
    requireReason: true,
    listItems: [
      'Access all <a href="https://data.bioplatforms.com/" target="_blank" rel="noopener noreferrer" class="font-medium text-gray-900 hover:text-sky-500 hover:underline">Bioplatforms Australia Data Portal</a> open data.',
      'Access embargoed TSI data from <a href="https://data.bioplatforms.com/" target="_blank" rel="noopener noreferrer" class="font-medium text-gray-900 hover:text-sky-500 hover:underline">Bioplatforms Australia Data Portal</a>',
      'Easily transfer data from the <a href="https://data.bioplatforms.com/" target="_blank" rel="noopener noreferrer" class="font-medium text-gray-900 hover:text-sky-500 hover:underline">Bioplatforms Australia Data Portal</a> to <a href="https://site.usegalaxy.org.au/" target="_blank" rel="noopener noreferrer" class="font-medium text-gray-900 hover:text-sky-500 hover:underline">Galaxy Australia</a> (coming soon)',
      'Full access to <a href="https://site.usegalaxy.org.au/" target="_blank" rel="noopener noreferrer" class="font-medium text-gray-900 hover:text-sky-500 hover:underline">Galaxy Australia</a> service, including interactive tools (e.g. RStudio and Jupyter)',
      'Run large genome assemblies and genome annotation <a href="https://www.biocommons.org.au/fgenesh-plus-plus" target="_blank" rel="noopener noreferrer" class="font-medium text-gray-900 hover:text-sky-500 hover:underline">Fgenesh++</a> pipelines on <a href="https://site.usegalaxy.org.au/" target="_blank" rel="noopener noreferrer" class="font-medium text-gray-900 hover:text-sky-500 hover:underline">Galaxy Australia</a>',
    ],
  },
  {
    id: 'sbp_workflow_execution',
    name: 'SBP Workflow Execution Bundle',
    logoUrls: ['/assets/biocommons-favicon.png'],
    listItems: [
      'Unrestricted access to all Structural Biology Platform (SBP) tools.',
      'Run jobs using your available credits (1000/month). Your balance resets on the first of every month.',
      'Monitor job execution status in the job dashboard.',
      'Browse jobs results in summary reports.',
      'Download output files for local analysis.',
    ],
  },
];

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
