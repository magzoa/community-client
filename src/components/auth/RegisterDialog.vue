<script setup>
import { ref, watch } from 'vue'
import { useAuthStore } from '../../stores/auth'
import authService from '../../services/auth'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'success'])

const auth = useAuthStore()

const form = ref(null)
const valid = ref(false)
const loading = ref(false)
const showPassword = ref(false)
const errors = ref([])

// Campos visibles
const model = ref({
  email: '',
  nickname: '',
  password: '',
})

// Marca si el usuario editó el nickname a mano (para no sobrescribirlo)
const nicknameTouched = ref(false)
// Estado del chequeo en vivo del nickname
const nicknameStatus = ref('') // '', 'checking', 'available', 'taken', 'invalid'
let nicknameTimer = null

// Capitaliza la primera letra
function capitalize(s) {
  if (!s) return ''
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

// Deriva la parte local del correo (antes de la @)
function emailBase(email) {
  const at = email.indexOf('@')
  return at > 0 ? email.slice(0, at) : ''
}

// Al cambiar el correo: autocompleta el nickname (si el usuario no lo tocó)
watch(
  () => model.value.email,
  (email) => {
    const base = emailBase(email)
    if (base && !nicknameTouched.value) {
      // Limpia caracteres no permitidos
      model.value.nickname = base.replace(/[^a-zA-Z0-9._-]/g, '')
    }
  },
)

// Chequeo en vivo del nickname (con debounce)
watch(
  () => model.value.nickname,
  (nickname) => {
    clearTimeout(nicknameTimer)
    nicknameStatus.value = ''
    if (!nickname) return

    if (!/^[a-zA-Z0-9._-]+$/.test(nickname)) {
      nicknameStatus.value = 'invalid'
      return
    }

    nicknameStatus.value = 'checking'
    nicknameTimer = setTimeout(async () => {
      try {
        const { data } = await authService.checkNickname(nickname)
        nicknameStatus.value = data.available ? 'available' : 'taken'
      } catch {
        nicknameStatus.value = ''
      }
    }, 400)
  },
)

// Reglas
const emailRules = [
  (v) => !!v || 'El correo es obligatorio.',
  (v) => /.+@.+\..+/.test(v) || 'El correo debe ser válido.',
]
const nicknameRules = [
  (v) => !!v || 'El nickname es obligatorio.',
  (v) => /^[a-zA-Z0-9._-]+$/.test(v) || 'Solo letras, números y . _ -',
  () => nicknameStatus.value !== 'taken' || 'Ese nickname ya está en uso.',
]
const passwordRules = [
  (v) => !!v || 'La contraseña es obligatoria.',
  (v) => (v && v.length >= 5) || 'Mínimo 5 caracteres.',
]

// Mensaje/color del hint del nickname
const nicknameHint = {
  checking: { text: 'Verificando disponibilidad...', color: 'info' },
  available: { text: 'Nickname disponible.', color: 'success' },
  taken: { text: 'Ese nickname ya está en uso.', color: 'error' },
  invalid: { text: 'Formato inválido.', color: 'error' },
}

function close() {
  emit('update:modelValue', false)
  errors.value = []
  model.value = { email: '', nickname: '', password: '' }
  nicknameTouched.value = false
  nicknameStatus.value = ''
  form.value?.resetValidation()
}

async function submit() {
  const { valid: isValid } = await form.value.validate()
  if (!isValid || nicknameStatus.value === 'taken') return

  loading.value = true
  errors.value = []
  try {
    // Autocompletado por detrás:
    // first_name = primer segmento del correo capitalizado (o el nickname)
    const base = emailBase(model.value.email)
    const rawFirst = base.split(/[._\-0-9]/)[0] || model.value.nickname
    const firstName = capitalize(rawFirst)
    // name (display) = primer nombre; si falta, el nickname
    const displayName = firstName || model.value.nickname

    await auth.register({
      name: displayName,
      nickname: model.value.nickname,
      email: model.value.email,
      password: model.value.password,
      member: {
        first_name: firstName || model.value.nickname,
      },
    })
    emit('success', 'Registro correcto. ¡Bienvenido a la comunidad!')
    close()
  } catch (error) {
    const data = error.response?.data
    errors.value = data?.errors || [data?.message || 'No se pudo completar el registro.']
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    max-width="460"
    persistent
  >
    <v-card rounded="lg">
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-account-plus" start />
        Crear cuenta
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" @click="close" />
      </v-card-title>

      <v-card-text>
        <v-alert
          v-if="errors.length"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          <ul class="pl-4">
            <li v-for="(err, i) in errors" :key="i">{{ err }}</li>
          </ul>
        </v-alert>

        <v-form ref="form" v-model="valid" @submit.prevent="submit">
          <!-- Correo primero: alimenta el autocompletado -->
          <v-text-field
            v-model="model.email"
            label="Correo"
            type="email"
            prepend-inner-icon="mdi-email-outline"
            :rules="emailRules"
            variant="outlined"
            required
          />

          <!-- Nickname: único, con aviso en vivo -->
          <v-text-field
            v-model="model.nickname"
            label="Nickname"
            hint="Tu identificador único en la comunidad"
            prepend-inner-icon="mdi-at"
            :rules="nicknameRules"
            variant="outlined"
            required
            @update:model-value="nicknameTouched = true"
          >
            <template v-if="nicknameStatus === 'checking'" #append-inner>
              <v-progress-circular size="18" width="2" indeterminate />
            </template>
            <template v-else-if="nicknameStatus === 'available'" #append-inner>
              <v-icon icon="mdi-check-circle" color="success" />
            </template>
            <template v-else-if="nicknameStatus === 'taken'" #append-inner>
              <v-icon icon="mdi-close-circle" color="error" />
            </template>
          </v-text-field>

          <div
            v-if="nicknameHint[nicknameStatus]"
            class="text-caption mb-3 ml-1"
            :class="`text-${nicknameHint[nicknameStatus].color}`"
          >
            {{ nicknameHint[nicknameStatus].text }}
          </div>

          <!-- Contraseña, sin confirmación -->
          <v-text-field
            v-model="model.password"
            label="Contraseña"
            :type="showPassword ? 'text' : 'password'"
            prepend-inner-icon="mdi-lock-outline"
            :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
            :rules="passwordRules"
            variant="outlined"
            required
            @click:append-inner="showPassword = !showPassword"
          />
        </v-form>
      </v-card-text>

      <v-card-actions class="px-4 pb-4">
        <v-spacer />
        <v-btn variant="text" @click="close">Cancelar</v-btn>
        <v-btn color="primary" variant="flat" :loading="loading" @click="submit">
          Registrarme
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
