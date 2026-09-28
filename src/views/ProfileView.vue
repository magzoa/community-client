<script setup>
import { ref, onMounted } from 'vue'
import memberService from '../services/member'
import catalogService from '../services/catalogs'
import SocialLinkDialog from '../components/profile/SocialLinkDialog.vue'

const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const form = ref(null)
const member = ref(null)
const links = ref([])

// Sección de personalización colapsable (cerrada al inicio)
const showCustomization = ref(false)

// Foto de perfil
const avatarFile = ref(null)
const avatarPreview = ref('')
const avatarLoading = ref(false)

// Modal de redes
const linkDialog = ref(false)
const editingLink = ref(null)

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

// Estado del miembro → color y etiqueta
const statusMeta = {
  pending: { color: 'warning', label: 'Pendiente de aprobación' },
  approved: { color: 'success', label: 'Aprobado' },
  rejected: { color: 'error', label: 'Rechazado' },
}

// Opciones de tema
const themeOptions = [
  { title: 'Claro', value: 'light' },
  { title: 'Oscuro', value: 'dark' },
  { title: 'Automático', value: 'auto' },
]

// Catálogos (desde la API)
const communityRoleOptions = ref([])
const professionalProfileOptions = ref([])

// Modelo editable del formulario
const model = ref({
  first_name: '',
  last_name: '',
  phone: '',
  contact_email: '',
  country: '',
  city: '',
  company: '',
  job_title: '',
  professional_profile_id: null,
  community_roles: [],
  bio: '',
  // Personalización
  primary_color: null,
  secondary_color: null,
  text_color: null,
  background_color: null,
  theme: null,
  banner_url: '',
})

// Normaliza el valor del color picker a #RRGGBB (recorta el alpha si viene)
function setColor(key, value) {
  model.value[key] = value ? value.slice(0, 7) : value
}

const requiredRule = [(v) => !!v || 'Este campo es obligatorio.']
const emailRule = [
  (v) => !v || /.+@.+\..+/.test(v) || 'El correo debe ser válido.',
]
const hexRule = [
  (v) => !v || /^#([0-9A-Fa-f]{6})$/.test(v) || 'Color hex inválido (#RRGGBB).',
]
const urlRule = [
  (v) => !v || /^https?:\/\/.+/.test(v) || 'Debe ser una URL válida (http/https).',
]

// Campos de color a renderizar (clave + etiqueta)
const colorFields = [
  { key: 'primary_color', label: 'Color primario' },
  { key: 'secondary_color', label: 'Color secundario' },
  { key: 'text_color', label: 'Color de texto' },
  { key: 'background_color', label: 'Color de fondo' },
]

// Vuelca los datos del member en el modelo del formulario
function fillModel(m) {
  model.value = {
    first_name: m.first_name || '',
    last_name: m.last_name || '',
    phone: m.phone || '',
    // Si no hay correo de contacto, se sugiere el de la cuenta
    contact_email: m.contact_email || m.user?.email || '',
    country: m.country || '',
    city: m.city || '',
    company: m.company || '',
    job_title: m.job_title || '',
    professional_profile_id: m.professional_profile_id || null,
    community_roles: (m.community_roles || []).map((r) => r.id),
    bio: m.bio || '',
    primary_color: m.primary_color || null,
    secondary_color: m.secondary_color || null,
    text_color: m.text_color || null,
    background_color: m.background_color || null,
    theme: m.theme || null,
    banner_url: m.banner_url || '',
  }
}

async function fetchProfile() {
  loading.value = true
  errorMessage.value = ''
  try {
    const { data } = await memberService.getProfile()
    member.value = data.member
    links.value = data.member.social_links || []
    fillModel(data.member)
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message || 'No se pudo cargar tu perfil.'
  } finally {
    loading.value = false
  }
}

// Carga las opciones de los catálogos (roles de comunidad / perfiles)
async function fetchCatalogs() {
  try {
    const [roles, profiles] = await Promise.all([
      catalogService.listActive('community-roles'),
      catalogService.listActive('professional-profiles'),
    ])
    communityRoleOptions.value = roles.data.data || []
    professionalProfileOptions.value = profiles.data.data || []
  } catch {
    // Si falla, los selects quedan vacíos; no bloquea el perfil
  }
}

async function saveProfile() {
  const { valid } = await form.value.validate()
  if (!valid) return

  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    // Normaliza vacíos a null (evita 422 por hex/enum/url vacío)
    const payload = { ...model.value }
    for (const key of [
      'primary_color',
      'secondary_color',
      'text_color',
      'background_color',
      'theme',
      'banner_url',
    ]) {
      if (!payload[key]) payload[key] = null
    }

    const { data } = await memberService.updateProfile(payload)
    member.value = data.member
    links.value = data.member.social_links || []
    successMessage.value = data.message || 'Perfil actualizado.'
  } catch (error) {
    const data = error.response?.data
    errorMessage.value = data?.errors?.[0] || data?.message || 'No se pudo guardar.'
  } finally {
    saving.value = false
  }
}

// Redes
function openAddLink() {
  editingLink.value = null
  linkDialog.value = true
}

function openEditLink(link) {
  editingLink.value = link
  linkDialog.value = true
}

async function saveLink(payload) {
  errorMessage.value = ''
  try {
    if (payload.id) {
      await memberService.updateLink(payload.id, payload)
    } else {
      await memberService.addLink(payload)
    }
    await fetchProfile()
    successMessage.value = 'Redes actualizadas.'
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'No se pudo guardar la red.'
  }
}

async function deleteLink(id) {
  errorMessage.value = ''
  try {
    await memberService.deleteLink(id)
    await fetchProfile()
    successMessage.value = 'Red eliminada.'
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'No se pudo eliminar.'
  }
}

// Foto de perfil
function onAvatarSelected(file) {
  // v-file-input puede entregar File o array según versión
  const f = Array.isArray(file) ? file[0] : file
  avatarFile.value = f || null
  avatarPreview.value = f ? URL.createObjectURL(f) : ''
}

async function uploadAvatar() {
  if (!avatarFile.value) return
  avatarLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const { data } = await memberService.uploadAvatar(avatarFile.value)
    member.value = data.member
    fillModel(data.member)
    avatarFile.value = null
    avatarPreview.value = ''
    successMessage.value = data.message || 'Foto actualizada.'
  } catch (error) {
    const data = error.response?.data
    errorMessage.value = data?.errors?.[0] || data?.message || 'No se pudo subir la foto.'
  } finally {
    avatarLoading.value = false
  }
}

async function removeAvatar() {
  avatarLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const { data } = await memberService.deleteAvatar()
    member.value = data.member
    fillModel(data.member)
    successMessage.value = data.message || 'Foto eliminada.'
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'No se pudo eliminar la foto.'
  } finally {
    avatarLoading.value = false
  }
}

onMounted(() => {
  fetchProfile()
  fetchCatalogs()
})
</script>

<template>
  <v-container class="py-8" style="max-width: 900px">
    <h1 class="text-h5 font-weight-bold mb-6">
      <v-icon icon="mdi-account-circle" start />
      Mi perfil
    </h1>

    <v-alert
      v-if="errorMessage"
      type="error"
      variant="tonal"
      density="compact"
      class="mb-4"
    >
      {{ errorMessage }}
    </v-alert>

    <v-alert
      v-if="successMessage"
      type="success"
      variant="tonal"
      density="compact"
      class="mb-4"
      closable
      @click:close="successMessage = ''"
    >
      {{ successMessage }}
    </v-alert>

    <div v-if="loading" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <template v-else-if="member">
      <!-- Banner de estado -->
      <v-alert
        v-if="statusMeta[member.status]"
        :color="statusMeta[member.status].color"
        variant="tonal"
        density="compact"
        class="mb-6"
      >
        Estado de tu membresía: <strong>{{ statusMeta[member.status].label }}</strong>
      </v-alert>

      <!-- Datos de usuario (cuenta) — solo lectura -->
      <v-card class="mb-6" elevation="2" rounded="lg">
        <v-card-title>Datos de usuario</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" sm="4">
              <v-text-field
                :model-value="member.user?.nickname"
                label="Nickname"
                prepend-inner-icon="mdi-at"
                variant="outlined"
                readonly
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field
                :model-value="member.user?.email"
                label="Correo de la cuenta"
                prepend-inner-icon="mdi-email-outline"
                variant="outlined"
                readonly
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field
                :model-value="member.user?.name"
                label="Nombre de usuario"
                prepend-inner-icon="mdi-account-outline"
                variant="outlined"
                readonly
              />
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Foto de perfil -->
      <v-card class="mb-6" elevation="2" rounded="lg">
        <v-card-title>Foto de perfil</v-card-title>
        <v-card-text>
          <div class="d-flex flex-column flex-sm-row align-center ga-4">
            <v-avatar size="96" color="grey-lighten-2">
              <v-img
                v-if="avatarPreview || member.avatar_url"
                :src="avatarPreview || member.avatar_url"
                alt="Foto de perfil"
                cover
              />
              <span v-else class="text-h4">
                {{ (member.first_name || 'U').charAt(0).toUpperCase() }}
              </span>
            </v-avatar>

            <div class="flex-grow-1" style="min-width: 0; width: 100%">
              <v-file-input
                label="Seleccionar imagen"
                accept="image/jpeg,image/png,image/webp"
                prepend-icon="mdi-camera"
                variant="outlined"
                density="compact"
                hide-details
                show-size
                @update:model-value="onAvatarSelected"
              />
              <div class="text-caption text-medium-emphasis mt-1">
                JPG, PNG o WEBP. Máx. 2 MB.
              </div>
            </div>
          </div>
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-btn
            v-if="member.avatar_url"
            color="error"
            variant="text"
            :loading="avatarLoading"
            @click="removeAvatar"
          >
            Quitar foto
          </v-btn>
          <v-spacer />
          <v-btn
            color="primary"
            variant="flat"
            :disabled="!avatarFile"
            :loading="avatarLoading"
            @click="uploadAvatar"
          >
            Subir foto
          </v-btn>
        </v-card-actions>
      </v-card>

      <!-- Datos del perfil -->
      <v-card class="mb-6" elevation="2" rounded="lg">
        <v-card-title>Datos personales</v-card-title>
        <v-card-text>
          <v-form ref="form">
            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="model.first_name"
                  label="Nombre"
                  variant="outlined"
                  :rules="requiredRule"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="model.last_name" label="Apellido" variant="outlined" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="model.phone" label="Celular" variant="outlined" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="model.contact_email"
                  label="Correo de contacto"
                  variant="outlined"
                  :rules="emailRule"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="model.country" label="País" variant="outlined" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="model.city" label="Ciudad" variant="outlined" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="model.company" label="Empresa" variant="outlined" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="model.job_title" label="Cargo" variant="outlined" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-select
                  v-model="model.professional_profile_id"
                  :items="professionalProfileOptions"
                  item-title="name"
                  item-value="id"
                  label="Perfil profesional"
                  variant="outlined"
                  clearable
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-select
                  v-model="model.community_roles"
                  :items="communityRoleOptions"
                  item-title="name"
                  item-value="id"
                  label="Roles en la comunidad"
                  variant="outlined"
                  multiple
                  chips
                  closable-chips
                />
              </v-col>
              <v-col cols="12">
                <v-textarea v-model="model.bio" label="Biografía" variant="outlined" rows="3" />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn color="primary" variant="flat" :loading="saving" @click="saveProfile">
            Guardar cambios
          </v-btn>
        </v-card-actions>
      </v-card>

      <!-- Personalización del perfil (colapsable) -->
      <v-card class="mb-6" elevation="2" rounded="lg">
        <v-card-title
          class="d-flex align-center"
          style="cursor: pointer"
          @click="showCustomization = !showCustomization"
        >
          Personalización
          <v-spacer />
          <v-btn
            :icon="showCustomization ? 'mdi-chevron-up' : 'mdi-chevron-down'"
            variant="text"
            size="small"
            :aria-label="showCustomization ? 'Cerrar personalización' : 'Abrir personalización'"
          />
        </v-card-title>

        <v-expand-transition>
          <v-card-text v-show="showCustomization">
          <v-row>
            <!-- Colores con selector -->
            <v-col
              v-for="field in colorFields"
              :key="field.key"
              cols="12"
              sm="6"
            >
              <v-text-field
                v-model="model[field.key]"
                :label="field.label"
                placeholder="#RRGGBB"
                variant="outlined"
                :rules="hexRule"
                clearable
              >
                <template #prepend-inner>
                  <!-- Muestra el color actual y abre el selector -->
                  <v-menu :close-on-content-click="false">
                    <template #activator="{ props: menuProps }">
                      <div
                        v-bind="menuProps"
                        class="color-swatch"
                        :style="{ backgroundColor: model[field.key] || '#ffffff' }"
                      />
                    </template>
                    <v-color-picker
                      :model-value="model[field.key] || '#1976D2'"
                      mode="hex"
                      :modes="['hex']"
                      @update:model-value="setColor(field.key, $event)"
                    />
                  </v-menu>
                </template>
              </v-text-field>
            </v-col>

            <v-col cols="12" sm="6">
              <v-select
                v-model="model.theme"
                :items="themeOptions"
                label="Tema"
                variant="outlined"
                clearable
              />
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model="model.banner_url"
                label="URL del banner"
                placeholder="https://..."
                variant="outlined"
                :rules="urlRule"
                clearable
              />
            </v-col>
          </v-row>

          <!-- Previsualización -->
          <div class="text-caption text-medium-emphasis mb-2">Previsualización</div>
          <div
            class="preview pa-4 rounded"
            :style="{
              backgroundColor: model.background_color || '#f5f5f5',
              color: model.text_color || '#000000',
              border: '1px solid #e0e0e0',
            }"
          >
            <div class="text-subtitle-1 font-weight-bold">
              {{ model.first_name || 'Tu nombre' }}
            </div>
            <div class="text-body-2 mb-3">{{ model.job_title || 'Tu cargo' }}</div>
            <v-btn
              size="small"
              :style="{ backgroundColor: model.primary_color || '#1976D2', color: '#fff' }"
            >
              Botón primario
            </v-btn>
            <v-btn
              size="small"
              class="ml-2"
              :style="{ backgroundColor: model.secondary_color || '#424242', color: '#fff' }"
            >
              Secundario
            </v-btn>
          </div>
          </v-card-text>
        </v-expand-transition>
      </v-card>

      <!-- Redes sociales -->
      <v-card elevation="2" rounded="lg">
        <v-card-title class="d-flex align-center">
          Redes sociales
          <v-spacer />
          <v-btn color="primary" variant="tonal" size="small" @click="openAddLink">
            <v-icon icon="mdi-plus" start />
            Agregar
          </v-btn>
        </v-card-title>
        <v-card-text>
          <p v-if="!links.length" class="text-medium-emphasis">
            Aún no agregaste redes sociales.
          </p>
          <v-list v-else>
            <v-list-item
              v-for="link in links"
              :key="link.id"
              :prepend-icon="typeIcon[link.type] || 'mdi-link-variant'"
              :title="link.label || link.type"
              :subtitle="link.url"
            >
              <template #append>
                <v-btn
                  icon="mdi-pencil"
                  variant="text"
                  size="small"
                  @click="openEditLink(link)"
                />
                <v-btn
                  icon="mdi-delete"
                  variant="text"
                  size="small"
                  color="error"
                  @click="deleteLink(link.id)"
                />
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </template>

    <!-- Modal de redes -->
    <SocialLinkDialog v-model="linkDialog" :link="editingLink" @save="saveLink" />
  </v-container>
</template>

<style scoped>
.color-swatch {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid #ccc;
  cursor: pointer;
}
</style>
