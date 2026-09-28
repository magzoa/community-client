<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../../stores/auth'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'success'])

const auth = useAuthStore()

const form = ref(null)
const valid = ref(false)
const loading = ref(false)
const showPassword = ref(false)
const errorMessage = ref('')

const credentials = ref({
  email: '',
  password: '',
})

// Reglas de validación
const emailRules = [
  (v) => !!v || 'El correo es obligatorio.',
  (v) => /.+@.+\..+/.test(v) || 'El correo debe ser válido.',
]
const passwordRules = [(v) => !!v || 'La contraseña es obligatoria.']

// Cierra el modal y limpia el estado
function close() {
  emit('update:modelValue', false)
  errorMessage.value = ''
  credentials.value = { email: '', password: '' }
  form.value?.resetValidation()
}

async function submit() {
  const { valid: isValid } = await form.value.validate()
  if (!isValid) return

  loading.value = true
  errorMessage.value = ''
  try {
    await auth.login(credentials.value)
    emit('success', 'Inicio de sesión correcto.')
    close()
  } catch (error) {
    // Mensaje del backend (401 credenciales, 422 validación)
    const data = error.response?.data
    errorMessage.value =
      data?.message || data?.errors?.[0] || 'No se pudo iniciar sesión.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    max-width="440"
    persistent
  >
    <v-card rounded="lg">
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-login" start />
        Iniciar sesión
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" @click="close" />
      </v-card-title>

      <v-card-text>
        <v-alert
          v-if="errorMessage"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          {{ errorMessage }}
        </v-alert>

        <v-form ref="form" v-model="valid" @submit.prevent="submit">
          <v-text-field
            v-model="credentials.email"
            label="Correo"
            type="email"
            prepend-inner-icon="mdi-email-outline"
            :rules="emailRules"
            variant="outlined"
            required
          />

          <v-text-field
            v-model="credentials.password"
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
          Ingresar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
