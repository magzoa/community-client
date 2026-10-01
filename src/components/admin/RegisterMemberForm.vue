<script setup>
import { ref, onMounted } from 'vue'
import adminService from '../../services/admin'
import catalogService from '../../services/catalogs'
import authService from '../../services/auth'

// Avisa al padre (AdminView) que se registró un miembro, para refrescar la tabla
const emit = defineEmits(['registered'])

const form = ref(null)
const valid = ref(false)
const loading = ref(false)
const errors = ref([])
const successMessage = ref('')

// Catálogos
const professionalProfiles = ref([])
const communityRoles = ref([])

// Avatar
const avatarFile = ref(null)
const avatarPreview = ref('')

// Chequeo de nickname en vivo
const nicknameStatus = ref('') // '', 'checking', 'available', 'taken', 'invalid'
let nicknameTimer = null

const defaultModel = () => ({
  name: '',
  nickname: '',
  email: '',
  password: 'awsugcan123', // preseteada, editable
  first_name: '',
  last_name: '',
  phone: '',
  contact_email: '',
  country: '',
  city: '',
  company: '',
  job_title: '',
  bio: '',
  professional_profile_id: null,
  community_roles: [],
})
const model = ref(defaultModel())

// Reglas
const requiredRule = [(v) => !!v || 'Este campo es obligatorio.']
const emailRules = [
  (v) => !!v || 'El correo es obligatorio.',
  (v) => /.+@.+\..+/.test(v) || 'Correo inválido.',
]
const passwordRules = [
  (v) => !!v || 'La contraseña es obligatoria.',
  (v) => (v && v.length >= 5) || 'Mínimo 5 caracteres.',
]
const nicknameRules = [
  (v) => !!v || 'El nickname es obligatorio.',
  (v) => /^[a-zA-Z0-9._-]+$/.test(v) || 'Solo letras, números y . _ -',
  () => nicknameStatus.value !== 'taken' || 'Ese nickname ya está en uso.',
]

const nicknameHint = {
  checking: { text: 'Verificando...', color: 'info' },
  available: { text: 'Disponible.', color: 'success' },
  taken: { text: 'Ya está en uso.', color: 'error' },
  invalid: { text: 'Formato inválido.', color: 'error' },
}

function onNicknameInput() {
  clearTimeout(nicknameTimer)
  nicknameStatus.value = ''
  const nick = model.value.nickname
  if (!nick) return
  if (!/^[a-zA-Z0-9._-]+$/.test(nick)) {
    nicknameStatus.value = 'invalid'
    return
  }
  nicknameStatus.value = 'checking'
  nicknameTimer = setTimeout(async () => {
    try {
      const { data } = await authService.checkNickname(nick)
      nicknameStatus.value = data.available ? 'available' : 'taken'
    } catch {
      nicknameStatus.value = ''
    }
  }, 400)
}

function onAvatarSelected(file) {
  const f = Array.isArray(file) ? file[0] : file
  avatarFile.value = f || null
  avatarPreview.value = f ? URL.createObjectURL(f) : ''
}

async function fetchCatalogs() {
  try {
    const [profs, roles] = await Promise.all([
      catalogService.listActive('professional-profiles'),
      catalogService.listActive('community-roles'),
    ])
    professionalProfiles.value = profs.data.data || []
    communityRoles.value = roles.data.data || []
  } catch {
    // sin catálogos, los selects quedan vacíos
  }
}

function resetForm() {
  model.value = defaultModel()
  avatarFile.value = null
  avatarPreview.value = ''
  nicknameStatus.value = ''
  form.value?.resetValidation()
}

async function submit() {
  const { valid: isValid } = await form.value.validate()
  if (!isValid || nicknameStatus.value === 'taken') return

  loading.value = true
  errors.value = []
  successMessage.value = ''
  try {
    const { data } = await adminService.createMember(model.value)
    // Si hay avatar, subirlo al miembro recién creado. Si solo falla la foto,
    // el miembro ya quedó creado: se avisa pero no se trata como error total.
    if (avatarFile.value && data.member?.id) {
      try {
        await adminService.uploadMemberAvatar(data.member.id, avatarFile.value)
      } catch {
        successMessage.value = 'Miembro registrado, pero no se pudo subir la foto.'
        resetForm()
        emit('registered')
        return
      }
    }
    successMessage.value = data.message || 'Miembro registrado.'
    resetForm()
    // Notifica al padre para que la pestaña Miembros recargue su lista
    emit('registered')
  } catch (error) {
    const d = error.response?.data
    errors.value = d?.errors || [d?.message || 'No se pudo registrar el miembro.']
  } finally {
    loading.value = false
  }
}

onMounted(fetchCatalogs)
</script>

<template>
  <div>
    <h2 class="text-h6 font-weight-bold mb-4">Registrar miembro</h2>

    <v-alert
      v-if="errors.length"
      type="error"
      variant="tonal"
      density="compact"
      class="mb-4"
    >
      <ul class="pl-4">
        <li v-for="(e, i) in errors" :key="i">{{ e }}</li>
      </ul>
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

    <v-form ref="form" v-model="valid" @submit.prevent="submit">
      <!-- Cuenta -->
      <v-card class="mb-4" elevation="2" rounded="lg">
        <v-card-title class="text-subtitle-1">Cuenta</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="model.name"
                label="Nombre de usuario"
                variant="outlined"
                :rules="requiredRule"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="model.nickname"
                label="Nickname"
                variant="outlined"
                :rules="nicknameRules"
                :hint="nicknameHint[nicknameStatus]?.text"
                persistent-hint
                @update:model-value="onNicknameInput"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="model.email"
                label="Correo"
                type="email"
                variant="outlined"
                :rules="emailRules"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="model.password"
                label="Contraseña inicial"
                variant="outlined"
                :rules="passwordRules"
                hint="Preseteada; puedes cambiarla"
                persistent-hint
              />
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Datos públicos -->
      <v-card class="mb-4" elevation="2" rounded="lg">
        <v-card-title class="text-subtitle-1">Datos del miembro</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field v-model="model.first_name" label="Nombre" variant="outlined" :rules="requiredRule" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model="model.last_name" label="Apellido" variant="outlined" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model="model.phone" label="Celular" variant="outlined" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model="model.contact_email" label="Correo de contacto" variant="outlined" />
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
                :items="professionalProfiles"
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
                :items="communityRoles"
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
              <v-textarea v-model="model.bio" label="Biografía" variant="outlined" rows="2" />
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Foto -->
      <v-card class="mb-4" elevation="2" rounded="lg">
        <v-card-title class="text-subtitle-1">Foto de perfil</v-card-title>
        <v-card-text>
          <div class="d-flex align-center ga-4">
            <v-avatar size="72" color="grey-lighten-2">
              <v-img v-if="avatarPreview" :src="avatarPreview" cover />
              <v-icon v-else icon="mdi-account" size="36" />
            </v-avatar>
            <v-file-input
              label="Seleccionar imagen"
              accept="image/jpeg,image/png,image/webp"
              prepend-icon="mdi-camera"
              variant="outlined"
              density="compact"
              hide-details
              style="max-width: 300px"
              @update:model-value="onAvatarSelected"
            />
          </div>
        </v-card-text>
      </v-card>

      <div class="d-flex justify-end">
        <v-btn color="primary" variant="flat" size="large" :loading="loading" @click="submit">
          <v-icon icon="mdi-account-plus" start />
          Registrar miembro
        </v-btn>
      </div>
    </v-form>
  </div>
</template>
