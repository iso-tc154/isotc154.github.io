export const committee = {
  name: 'ISO/TC 154',
  title: 'Processes, data elements and documents in commerce, industry and administration',
  tagline: 'Standards for commerce, industry and administration',
  scope:
    'Standardization of processes, data elements and documents used in commerce, industry and administration, including the relevant regulatory, technical and supporting aspects.',

  secretariat: 'SAC (China)',
  chair: 'Mr. Pan Wei',
  established: 1972,
  publishedStandards: 40,
  participatingMembers: 21,
  observingMembers: 26,

  links: {
    iso: 'https://www.iso.org',
    isoCommittee: 'https://www.iso.org/committee/45876.html',
    committeeSite: 'https://committee.iso.org/home/tc154',
    linkedin: 'https://www.linkedin.com/company/iso-tc154/',
    github: 'https://github.com/ISO-TC154',
  },
} as const

export type Committee = typeof committee
