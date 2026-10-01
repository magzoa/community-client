<script setup>
import { ref, watch } from 'vue'
import adminService from '../../services/admin'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  memberId: { type: [Number, null], default: null },
  professionalProfiles: { type: Array, default: () => [] },
  communityRoles: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue', 'saved'])

const loading = ref(false)
const saving = ref(false)
const errors = ref([])
const form = ref(null)

const nickname = ref('') // solo lectura
const currentAvatar = ref('')
const avatarFile = ref(null)
const avatarPreview = ref('')

const model = ref({
  name: '',
  email: '',
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

const requiredRule = [(v) => !!v || 'Este campo es obligatorio.']
const emailRules = [
  (v) => !!v || 'El correo es obligatorio.',
  (v) => /.+@.+\..+/.test(v) || 'Correo inválido.',
]

// Al abrir, carga el miembro completo (GET /admin/members/{id})
watch(
  () => props.modelValue,
  async (open) => {
    if (!open || !props.memberId) return
    loading.value = true
    errors.value = []
    resetAvatar()
    try {
      const { data } = await adminService.getMember(props.memberId)
      const m = data.member
      nickname.value = m.user?.nickname || ''
      currentAvatar.value = m.avatar_url || ''
      model.value = {
        name: m.user?.name || '',
        email: m.user?.email || '',
        first_name: m.first_name || '',
        last_name: m.last_name || '',
        phone: m.phone || '',
        contact_email: m.contact_email || '',
        country: m.country || '',
        city: m.city || '',
        company: m.company || '',
        job_title: m.job_title || '',
        bio: m.bio || '',
        professional_profile_id: m.professional_profile_id || null,
        community_roles: (m.community_roles || []).map((r) => r.id),
      }
    } catch (error) {
      errors.value = [error.response?.data?.message || 'No se pudo cargar el miembro.']
    } finally {
      loading.value = false
    }
  },
)

function resetAvatar() {
  avatarFile.value = null
  avatarPreview.value = ''
}

function onAvatarSelected(file) {
  const f = Array.isArray(file) ? file[0] : file
  avatarFile.value = f || null
  avatarPreview.value = f ? URL.createObjectURL(f) : ''
}

function close() {
  emit('update:modelValue', false)
}

async function submit() {
  const { valid } = await form.value.validate()
  if (!valid) return
  saving.value = true
  errors.value = []
  try {
    await adminService.updateMember(props.memberId, model.value)
    // Si eligió nueva foto, la sube
    if (avatarFile.value) {
      await adminService.uploadMemberAvatar(props.memberId, avatarFile.value)
    }
    emit('saved', 'Miembro actualizado correctamente.')
    close()
  } catch (error) {
    const d = error.response?.data
    errors.value = d?.errors || [d?.message || 'No se pudo guardar.']
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    max-width="720"
    persistent
    scrollable
  >
    <v-card rounded="lg">
      <v-card-title class="d-flex align-center">
        Editar miembro
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" @click="close" />
      </v-card-title>

      <v-card-text style="max-height: 70vh">
        <div v-if="loading" class="text-center py-8">
          <v-progress-circular indeterminate color="primary" />
        </div>

        <template v-else>
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

          <v-form ref="form">
            <!-- Cuenta -->
            <div class="text-subtitle-2 font-weight-bold mb-2">Cuenta</div>
            <v-row>
              <v-col cols="12" sm="4">
                <v-text-field
                  :model-value="nickname"
                  label="Nickname (no editable)"
                  variant="outlined"
                  readonly
                  hint="Se edita en un proceso aparte"
                  persistent-hint
                />
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model="model.name"
                  label="Nombre de usuario"
                  variant="outlined"
                  :rules="requiredRule"
                />
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model="model.email"
                  label="Correo"
                  type="email"
                  variant="outlined"
                  :rules="emailRules"
                />
              </v-col>
            </v-row>

            <!-- Foto -->
            <div class="text-subtitle-2 font-weight-bold mb-2 mt-2">Foto de perfil</div>
            <div class="d-flex align-center ga-4 mb-2">
              <v-avatar size="64" color="grey-lighten-2">
                <v-img v-if="avatarPreview || currentAvatar" :src="avatarPreview || currentAvatar" cover />
                <v-icon v-else icon="mdi-account" size="32" />
              </v-avatar>
              <v-file-input
                label="Cambiar foto"
                accept="image/jpeg,image/png,image/webp"
                prepend-icon="mdi-camera"
                variant="outlined"
                density="compact"
                hide-details
                style="max-width: 280px"
                @update:model-value="onAvatarSelected"
              />
            </div>

            <!-- Datos del miembro -->
            <div class="text-subtitle-2 font-weight-bold mb-2 mt-2">Datos del miembro</div>
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
                <v-text-field v-model="model.country" label="País" variant="outlined" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="model.city" label="Ciudad" variant="outlined" />
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
          </v-form>
        </template>
      </v-card-text>

      <v-card-actions class="px-4 pb-4">
        <v-spacer />
        <v-btn variant="text" @click="close">Cancelar</v-btn>
        <v-btn color="primary" variant="flat" :loading="saving" :disabled="loading" @click="submit">
          Guardar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
