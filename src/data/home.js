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

// Eventos ya realizados por la comunidad
export const pastEvents = [
  {
    id: 1,
    title: 'AWS Community Day 2025',
    date: '15 de marzo, 2025',
    location: 'Asunción, Paraguay',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80',
    description:
      'Un día completo de charlas sobre arquitecturas serverless, contenedores y buenas prácticas en la nube.',
  },
  {
    id: 2,
    title: 'Workshop: IaC con Terraform',
    date: '8 de febrero, 2025',
    location: 'Online',
    image: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=600&q=80',
    description:
      'Taller práctico para desplegar infraestructura en AWS usando Terraform desde cero.',
  },
  {
    id: 3,
    title: 'Meetup: Machine Learning en AWS',
    date: '20 de noviembre, 2024',
    location: 'Ciudad del Este, Paraguay',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80',
    description:
      'Introducción a SageMaker y casos de uso reales de ML aplicados en la industria local.',
  },
]

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
