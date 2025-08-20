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

export const biocommonsBundles: Bundle[] = [
  {
    id: 'data-portal-galaxy',
    name: 'Bioplatforms Australia Data Portal and Galaxy',
    logoUrls: ['/assets/bpa-logo.png', '/assets/galaxy-logo.png'],
    listItems: [
      'The <a href="https://data.bioplatforms.com/" target="_blank" rel="noopener noreferrer" class="font-medium text-gray-900 hover:text-blue-600 hover:underline">Bioplatforms Australia Data Portal</a> public data access',
      'The <a href="https://site.usegalaxy.org.au/" target="_blank" rel="noopener noreferrer" class="font-medium text-gray-900 hover:text-blue-600 hover:underline">Galaxy Australia</a> data access',
      'Easily import data into <a href="https://site.usegalaxy.org.au/" target="_blank" rel="noopener noreferrer" class="font-medium text-gray-900 hover:text-blue-600 hover:underline">Galaxy Australia</a> from the <a href="https://data.bioplatforms.com/" target="_blank" rel="noopener noreferrer" class="font-medium text-gray-900 hover:text-blue-600 hover:underline">Bioplatforms Australia Data Portal</a>',
    ],
    services: [bpaBundleService, galaxyBundleService],
  },
  {
    id: 'tsi',
    name: 'Threatened Species Initiative',
    logoUrls: ['/assets/tsi-logo.jpg'],
    listItems: [
      'The <a href="https://data.bioplatforms.com/" target="_blank" rel="noopener noreferrer" class="font-medium text-gray-900 hover:text-blue-600 hover:underline">Bioplatforms Australia Data Portal</a> and <a href="https://site.usegalaxy.org.au/" target="_blank" rel="noopener noreferrer" class="font-medium text-gray-900 hover:text-blue-600 hover:underline">Galaxy Australia</a> data access',
      'TSI public and restricted datasets in the <a href="https://data.bioplatforms.com/" target="_blank" rel="noopener noreferrer" class="font-medium text-gray-900 hover:text-blue-600 hover:underline">Bioplatforms Australia Data Portal</a>',
      '<a href="https://site.usegalaxy.org.au/" target="_blank" rel="noopener noreferrer" class="font-medium text-gray-900 hover:text-blue-600 hover:underline">Galaxy Australia</a> 2TB storage space, high memory nodes, workflows and tools',
      'Easily import data into <a href="https://site.usegalaxy.org.au/" target="_blank" rel="noopener noreferrer" class="font-medium text-gray-900 hover:text-blue-600 hover:underline">Galaxy Australia</a> from the <a href="https://data.bioplatforms.com/" target="_blank" rel="noopener noreferrer" class="font-medium text-gray-900 hover:text-blue-600 hover:underline">Bioplatforms Australia Data Portal</a>',
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
