<script setup>
import { ref, onMounted } from 'vue'
import publicService from '../../services/public'

const loading = ref(false)
const members = ref([])
const roles = ref([])
const selectedRole = ref(null) // slug o null (Todos)
const page = ref(1)
const lastPage = ref(1)
const total = ref(0)
const perPage = 6

// Iconos por tipo de red
const typeIcon = {
  github: 'mdi-github',
  linkedin: 'mdi-linkedin',
  twitter: 'mdi-twitter',
  website: 'mdi-web',
  instagram: 'mdi-instagram',
  youtube: 'mdi-youtube',
  other: 'mdi-link-variant',
}

async function fetchRoles() {
  try {
    const { data } = await publicService.listCommunityRoles()
    roles.value = data.data || []
  } catch {
    // sin roles, solo se muestra "Todos"
  }
}

async function fetchMembers() {
  loading.value = true
  try {
    const params = { page: page.value, per_page: perPage }
    if (selectedRole.value) params.community_role = selectedRole.value
    const { data } = await publicService.listMembers(params)
    members.value = data.data || []
    lastPage.value = data.meta?.last_page || 1
    total.value = data.meta?.total || 0
  } catch {
    members.value = []
  } finally {
    loading.value = false
  }
}

// Al cambiar de filtro, vuelve a la página 1
function selectRole(slug) {
  selectedRole.value = slug
  page.value = 1
  fetchMembers()
}

function onPageChange(p) {
  page.value = p
  fetchMembers()
}

// Inicial para el avatar cuando no hay foto
function initial(m) {
  return (m.first_name || '?').charAt(0).toUpperCase()
}

onMounted(() => {
  fetchRoles()
  fetchMembers()
})
</script>

<template>
  <section id="members" class="py-16">
    <v-container>
      <div class="text-center mb-8">
        <h2 class="text-h4 font-weight-bold mb-2">Miembros de la comunidad</h2>
        <p class="text-body-1 text-medium-emphasis">
          Personas que hacen crecer la comunidad AWS UG
        </p>
      </div>

      <!-- Filtros por rol de comunidad -->
      <div class="d-flex justify-center mb-8">
        <v-chip-group
          :model-value="selectedRole"
          selected-class="text-white"
          class="flex-wrap justify-center"
        >
          <v-chip
            :color="selectedRole === null ? 'primary' : undefined"
            :variant="selectedRole === null ? 'flat' : 'outlined'"
            @click="selectRole(null)"
          >
            Todos
          </v-chip>
          <v-chip
            v-for="role in roles"
            :key="role.slug"
            :color="role.color || 'primary'"
            :variant="selectedRole === role.slug ? 'flat' : 'outlined'"
            @click="selectRole(role.slug)"
          >
            {{ role.name }}
          </v-chip>
        </v-chip-group>
      </div>

      <!-- Cargando -->
      <div v-if="loading" class="text-center py-8">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <!-- Sin resultados -->
      <p v-else-if="!members.length" class="text-center text-medium-emphasis py-8">
        No hay miembros para mostrar.
      </p>

      <!-- Grilla de miembros -->
      <v-row v-else>
        <v-col
          v-for="member in members"
          :key="member.id"
          cols="12"
          sm="6"
          md="4"
        >
          <v-card class="text-center pa-4" elevation="2" rounded="lg" height="100%">
            <v-avatar size="96" color="grey-lighten-2" class="mx-auto mb-3">
              <v-img v-if="member.avatar_url" :src="member.avatar_url" :alt="member.first_name" cover />
              <span v-else class="text-h4">{{ initial(member) }}</span>
            </v-avatar>

            <v-card-title class="text-h6 justify-center">
              {{ member.first_name }} {{ member.last_name }}
            </v-card-title>
            <v-card-subtitle>
              {{ member.professional_profile?.name || member.job_title || '' }}
            </v-card-subtitle>

            <!-- Chips de rol de comunidad -->
            <div class="d-flex flex-wrap justify-center ga-1 mt-2">
              <v-chip
                v-for="role in member.community_roles"
                :key="role.slug"
                :color="role.color || 'primary'"
                size="x-small"
                variant="flat"
              >
                {{ role.name }}
              </v-chip>
            </div>

            <!-- Contacto (solo si el backend lo expone: member_active) -->
            <div v-if="member.contact_email || member.phone" class="mt-3 text-body-2">
              <div v-if="member.contact_email">
                <v-icon icon="mdi-email-outline" size="x-small" start />
                {{ member.contact_email }}
              </div>
              <div v-if="member.phone">
                <v-icon icon="mdi-phone-outline" size="x-small" start />
                {{ member.phone }}
              </div>
            </div>

            <!-- Redes -->
            <v-card-actions class="justify-center">
              <v-btn
                v-for="link in member.social_links"
                :key="link.type + link.url"
                :icon="typeIcon[link.type] || 'mdi-link-variant'"
                variant="text"
                size="small"
                :href="link.url"
                target="_blank"
                :aria-label="`${link.type} de ${member.first_name}`"
              />
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>

      <!-- Paginación -->
      <div v-if="lastPage > 1" class="d-flex justify-center mt-8">
        <v-pagination
          :model-value="page"
          :length="lastPage"
          :total-visible="5"
          @update:model-value="onPageChange"
        />
      </div>
    </v-container>
  </section>
</template>
