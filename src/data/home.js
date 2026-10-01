// Datos ficticios (mock) para el home estático.
// Cuando el servidor exponga endpoints públicos, se reemplazan por llamadas a la API.

// Miembros destacados de la comunidad
export const members = [
  {
    id: 1,
    name: 'María González',
    role: 'Cloud Architect',
    avatar: 'https://i.pravatar.cc/150?img=47',
    github: 'https://github.com',
    linkedin: 'https://linkedin.com',
  },
  {
    id: 2,
    name: 'Carlos Ramírez',
    role: 'DevOps Engineer',
    avatar: 'https://i.pravatar.cc/150?img=12',
    github: 'https://github.com',
    linkedin: 'https://linkedin.com',
  },
  {
    id: 3,
    name: 'Lucía Fernández',
    role: 'Serverless Developer',
    avatar: 'https://i.pravatar.cc/150?img=32',
    github: 'https://github.com',
    linkedin: 'https://linkedin.com',
  },
  {
    id: 4,
    name: 'Javier Torres',
    role: 'Data Engineer',
    avatar: 'https://i.pravatar.cc/150?img=15',
    github: 'https://github.com',
    linkedin: 'https://linkedin.com',
  },
  {
    id: 5,
    name: 'Ana Duarte',
    role: 'Security Specialist',
    avatar: 'https://i.pravatar.cc/150?img=45',
    github: 'https://github.com',
    linkedin: 'https://linkedin.com',
  },
  {
    id: 6,
    name: 'Diego Benítez',
    role: 'Community Lead',
    avatar: 'https://i.pravatar.cc/150?img=68',
    github: 'https://github.com',
    linkedin: 'https://linkedin.com',
  },
]

// (Los eventos pasados mock se retiraron; el apartado Meetup destacado del home
// se configura desde admin y viene de site_settings.)

// Estadísticas estáticas del banner (eventos y años; miembros es dinámico vía API).
export const staticStats = {
  eventsLabel: 'Eventos realizados',
  eventsValue: '+9',
  eventsIcon: 'mdi-calendar-check',
  yearsLabel: 'Años activos',
  yearsValue: '1',
  yearsIcon: 'mdi-history',
  membersLabel: 'Miembros registrados',
  membersIcon: 'mdi-account-group',
}

// Tema visual del banner (matiz lila con negro, texto blanco).
export const heroTheme = {
  gradientFrom: '#4A148C', // lila
  gradientTo: '#000000', // negro
  textColor: '#FFFFFF', // blanco
}
