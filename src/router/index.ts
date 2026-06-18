import type { RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
  },
  {
    path: '/resolutions/',
    name: 'resolutions',
    component: () => import('../views/ResolutionsListView.vue'),
  },
  {
    path: '/resolutions/meetings/',
    name: 'resolutions-meetings',
    component: () => import('../views/MeetingsTimelineView.vue'),
  },
  {
    path: '/resolutions/:sourceType/:sourceFile/:id/',
    name: 'resolution-detail',
    component: () => import('../views/ResolutionDetailView.vue'),
  },
  {
    path: '/members/',
    name: 'members',
    component: () => import('../views/MembersListView.vue'),
  },
  {
    path: '/members/:id/',
    name: 'member-detail',
    component: () => import('../views/MemberDetailView.vue'),
  },
  {
    path: '/groups/',
    name: 'groups',
    component: () => import('../views/GroupsListView.vue'),
  },
  {
    path: '/groups/:id/',
    name: 'group-detail',
    component: () => import('../views/GroupDetailView.vue'),
  },
  {
    path: '/standards/',
    name: 'standards',
    component: () => import('../views/StandardsListView.vue'),
  },
  {
    path: '/standards/:id/',
    name: 'standard-detail',
    component: () => import('../views/StandardDetailView.vue'),
  },
  {
    path: '/projects/',
    name: 'projects',
    component: () => import('../views/ProjectsListView.vue'),
  },
  {
    path: '/projects/:id/',
    name: 'project-detail',
    component: () => import('../views/ProjectDetailView.vue'),
  },
  {
    path: '/liaisons/',
    name: 'liaisons',
    component: () => import('../views/LiaisonsListView.vue'),
  },
  {
    path: '/liaisons/:id/',
    name: 'liaison-detail',
    component: () => import('../views/LiaisonDetailView.vue'),
  },
  {
    path: '/national-bodies/',
    name: 'national-bodies',
    component: () => import('../views/NationalBodiesListView.vue'),
  },
  {
    path: '/national-bodies/:id/',
    name: 'national-body-detail',
    component: () => import('../views/NationalBodyDetailView.vue'),
  },
  {
    path: '/meetings/',
    name: 'meetings',
    component: () => import('../views/MeetingsListView.vue'),
  },
  {
    path: '/meetings/:ordinal/',
    name: 'meeting-detail',
    component: () => import('../views/MeetingDetailView.vue'),
  },
  {
    path: '/posts/',
    name: 'posts',
    component: () => import('../views/NewsListView.vue'),
  },
  {
    path: '/posts/:slug/',
    name: 'post-detail',
    component: () => import('../views/NewsPostView.vue'),
  },
  {
    path: '/about/',
    name: 'about',
    component: () => import('../views/AsciiDocPageView.vue'),
    props: { slug: 'about' },
  },
  {
    path: '/business-plan/',
    name: 'business-plan',
    component: () => import('../views/AsciiDocPageView.vue'),
    props: { slug: 'business-plan' },
  },
  {
    path: '/history/',
    name: 'history',
    component: () => import('../views/HistoryView.vue'),
  },
  {
    path: '/faq/',
    name: 'faq',
    component: () => import('../views/AsciiDocPageView.vue'),
    props: { slug: 'faq' },
  },
  {
    path: '/faq/:slug/',
    name: 'faq-item',
    component: () => import('../views/AsciiDocPageView.vue'),
  },
  {
    path: '/procedures/',
    name: 'procedures',
    component: () => import('../views/ProceduresView.vue'),
  },
  {
    path: '/procedures/:slug/',
    name: 'procedure-detail',
    component: () => import('../views/AsciiDocPageView.vue'),
  },
  {
    path: '/contact/',
    name: 'contact',
    component: () => import('../views/ContactView.vue'),
  },
  {
    path: '/acknowledgments/',
    name: 'acknowledgments',
    component: () => import('../views/AcknowledgmentsView.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue'),
  },
]
