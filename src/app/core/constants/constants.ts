export interface BundleService {
  id: string;
  name: string;
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

const bpaBundleService: BundleService = {
  id: 'bpa',
  name: 'Bioplatforms Australia Data Portal Terms and Conditions',
  termsUrl: 'https://data.bioplatforms.com/',
};

const galaxyBundleService: BundleService = {
  id: 'galaxy',
  name: 'Galaxy Australia Terms of Service',
  termsUrl: 'https://site.usegalaxy.org.au/about#terms-of-service',
};

const tsiBundleService: BundleService = {
  id: 'tsi',
  name: 'TSI Terms and Conditions',
  termsUrl: 'https://threatenedspeciesinitiative.com/',
};

export const BUNDLES: Bundle[] = [
  {
    id: 'data-portal-galaxy',
    name: 'Data Portal and Galaxy',
    logoUrls: ['/assets/bpa-logo.png', '/assets/galaxy-logo.png'],
    listItems: [
      'The <span class="font-medium text-gray-900">Data Portal</span> public data access',
      'The <span class="font-medium text-gray-900">Galaxy Australia</span> data access',
      'Easily import data into Galaxy from the Data Portal',
    ],
    services: [bpaBundleService, galaxyBundleService],
  },
  {
    id: 'tsi',
    name: 'Threatened Species Initiative',
    logoUrls: ['/assets/tsi-logo.jpg'],
    listItems: [
      'The <span class="font-medium text-gray-900">Data Portal</span> and <span class="font-medium text-gray-900">Galaxy Australia</span> data access',
      'TSI public and restricted datasets in the Data Portal',
      'Galaxy Australia 2TB storage space, high memory nodes, workflows and tools',
      'Easily import data into Galaxy from the Data Portal',
    ],
    services: [tsiBundleService, bpaBundleService, galaxyBundleService],
  },
  {
    id: 'fungi',
    name: "Fungi Functional 'Omics",
    logoUrls: ['/assets/aff-logo.png'],
    listItems: [],
    disabled: true,
    services: [],
  },
];
