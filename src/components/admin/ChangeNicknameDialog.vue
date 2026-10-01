<script setup>
import { ref, watch } from 'vue'
import adminService from '../../services/admin'
import authService from '../../services/auth'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // { id, first_name, nickname }
  member: { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue', 'saved'])

const form = ref(null)
const saving = ref(false)
const errorMessage = ref('')

const nickname = ref('')
const currentNickname = ref('')

// Chequeo en vivo del nickname
const status = ref('') // '', 'checking', 'available', 'taken', 'invalid'
let timer = null

watch(
  () => props.modelValue,
  (open) => {
    if (open && props.member) {
      currentNickname.value = props.member.nickname || ''
      nickname.value = props.member.nickname || ''
      status.value = ''
      errorMessage.value = ''
    }
  },
)

watch(nickname, (val) => {
  clearTimeout(timer)
  status.value = ''
  if (!val || val === currentNickname.value) return
  if (!/^[a-zA-Z0-9._-]+$/.test(val)) {
    status.value = 'invalid'
    return
  }
  status.value = 'checking'
  timer = setTimeout(async () => {
    try {
      const { data } = await authService.checkNickname(val)
      status.value = data.available ? 'available' : 'taken'
    } catch {
      status.value = ''
    }
  }, 400)
})

const rules = [
  (v) => !!v || 'El nickname es obligatorio.',
  (v) => /^[a-zA-Z0-9._-]+$/.test(v) || 'Solo letras, números y . _ -',
  (v) => v === currentNickname.value || status.value !== 'taken' || 'Ya está en uso.',
]

const hint = {
  checking: { text: 'Verificando...', color: 'info' },
  available: { text: 'Disponible.', color: 'success' },
  taken: { text: 'Ya está en uso.', color: 'error' },
  invalid: { text: 'Formato inválido.', color: 'error' },
}

function close() {
  emit('update:modelValue', false)
}

async function submit() {
  const { valid } = await form.value.validate()
  if (!valid || status.value === 'taken') return
  saving.value = true
  errorMessage.value = ''
  try {
    await adminService.updateNickname(props.member.id, nickname.value)
    emit('saved', 'Nickname actualizado correctamente.')
    close()
  } catch (error) {
    const d = error.response?.data
    errorMessage.value = d?.errors?.[0] || d?.message || 'No se pudo cambiar el nickname.'
  } finally {
    saving.value = false
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
        Cambiar nickname
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" @click="close" />
      </v-card-title>

      <v-card-text>
        <v-alert type="warning" variant="tonal" density="compact" class="mb-4">
          Proceso sensible: se moverá la carpeta de archivos del miembro
          (foto de perfil). Si algo falla, no se aplica ningún cambio.
        </v-alert>

        <v-alert
          v-if="errorMessage"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          {{ errorMessage }}
        </v-alert>

        <div v-if="member" class="text-body-2 text-medium-emphasis mb-2">
          Miembro: <strong>{{ member.first_name }}</strong> — nickname actual:
          <strong>{{ currentNickname }}</strong>
        </div>

        <v-form ref="form" @submit.prevent="submit">
          <v-text-field
            v-model="nickname"
            label="Nuevo nickname"
            prepend-inner-icon="mdi-at"
            variant="outlined"
            :rules="rules"
            :hint="hint[status]?.text"
            persistent-hint
          >
            <template v-if="status === 'checking'" #append-inner>
              <v-progress-circular size="18" width="2" indeterminate />
            </template>
            <template v-else-if="status === 'available'" #append-inner>
              <v-icon icon="mdi-check-circle" color="success" />
            </template>
            <template v-else-if="status === 'taken'" #append-inner>
              <v-icon icon="mdi-close-circle" color="error" />
            </template>
          </v-text-field>
        </v-form>
      </v-card-text>

      <v-card-actions class="px-4 pb-4">
        <v-spacer />
        <v-btn variant="text" @click="close">Cancelar</v-btn>
        <v-btn
          color="warning"
          variant="flat"
          :loading="saving"
          :disabled="nickname === currentNickname"
          @click="submit"
        >
          Cambiar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
