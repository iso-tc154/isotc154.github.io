export interface NavChild {
  label: string
  to: string
}
export interface NavItem {
  label: string
  to: string
  children?: NavChild[]
}

export const mainNav: NavItem[] = [
  {
    label: 'About',
    to: '/about/',
    children: [
      { label: 'About TC 154', to: '/about/' },
      { label: 'History', to: '/history/' },
      { label: 'Business Plan', to: '/business-plan/' },
      { label: 'Groups', to: '/groups/' },
      { label: 'Liaisons', to: '/liaisons/' },
      { label: 'National Bodies', to: '/national-bodies/' },
      { label: 'FAQ', to: '/faq/' },
      { label: 'Contact', to: '/contact/' },
    ],
  },
  {
    label: 'Our Work',
    to: '/standards/',
    children: [
      { label: 'Standards', to: '/standards/' },
      { label: 'Projects', to: '/projects/' },
    ],
  },
  {
    label: 'Meetings',
    to: '/meetings/',
  },
  {
    label: 'Members',
    to: '/members/',
  },
  {
    label: 'News',
    to: '/posts/',
  },
  {
    label: 'Resources',
    to: '/procedures/',
    children: [
      { label: 'Procedures', to: '/procedures/' },
      { label: 'Resolutions', to: '/resolutions/' },
    ],
  },
]
