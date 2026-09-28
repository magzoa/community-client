<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // Si se pasa un link, el modal edita; si no, crea
  link: { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue', 'save'])

const form = ref(null)
const valid = ref(false)

// Tipos permitidos (coinciden con MemberSocialLink::TYPES del backend)
const types = [
  'github',
  'linkedin',
  'twitter',
  'website',
  'instagram',
  'youtube',
  'other',
]

const model = ref({
  type: 'github',
  url: '',
  label: '',
})

// Al abrir, precarga los datos si es edición
watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      model.value = props.link
        ? { type: props.link.type, url: props.link.url, label: props.link.label || '' }
        : { type: 'github', url: '', label: '' }
      form.value?.resetValidation()
    }
  },
)

const requiredRule = [(v) => !!v || 'Este campo es obligatorio.']
const urlRule = [
  (v) => !!v || 'La URL es obligatoria.',
  (v) => /^https?:\/\/.+/.test(v) || 'Debe ser una URL válida (http/https).',
]

function close() {
  emit('update:modelValue', false)
}

async function submit() {
  const { valid: isValid } = await form.value.validate()
  if (!isValid) return
  // Emite los datos; el padre decide si crea o actualiza
  emit('save', { ...model.value, id: props.link?.id ?? null })
  close()
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
      <v-card-title>
        {{ link ? 'Editar red social' : 'Agregar red social' }}
      </v-card-title>

      <v-card-text>
        <v-form ref="form" v-model="valid" @submit.prevent="submit">
          <v-select
            v-model="model.type"
            :items="types"
            label="Tipo"
            variant="outlined"
            :rules="requiredRule"
          />
          <v-text-field
            v-model="model.url"
            label="URL"
            placeholder="https://..."
            variant="outlined"
            :rules="urlRule"
          />
          <v-text-field
            v-model="model.label"
            label="Etiqueta (opcional)"
            placeholder="Ej: @usuario"
            variant="outlined"
          />
        </v-form>
      </v-card-text>

      <v-card-actions class="px-4 pb-4">
        <v-spacer />
        <v-btn variant="text" @click="close">Cancelar</v-btn>
        <v-btn color="primary" variant="flat" @click="submit">Guardar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
