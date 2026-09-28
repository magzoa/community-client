<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // Miembro a editar: { id, first_name, roles: [...] }
  member: { type: Object, default: null },
  // Roles disponibles del sistema
  availableRoles: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue', 'save'])

const selected = ref([])

// Etiquetas legibles por rol
const roleLabels = {
  admin: 'Administrador',
  member: 'Miembro',
  member_active: 'Miembro activo',
}

// Al abrir, precarga los roles actuales del miembro
watch(
  () => props.modelValue,
  (open) => {
    if (open && props.member) {
      selected.value = [...(props.member.roles || [])]
    }
  },
)

function close() {
  emit('update:modelValue', false)
}

function submit() {
  emit('save', { id: props.member.id, roles: selected.value })
  close()
}
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    max-width="420"
    persistent
  >
    <v-card rounded="lg">
      <v-card-title>
        Gestionar roles
        <span v-if="member" class="text-subtitle-2 text-medium-emphasis d-block">
          {{ member.first_name }}
        </span>
      </v-card-title>

      <v-card-text>
        <v-checkbox
          v-for="role in availableRoles"
          :key="role"
          v-model="selected"
          :value="role"
          :label="roleLabels[role] || role"
          density="compact"
          hide-details
        />
        <p v-if="!availableRoles.length" class="text-medium-emphasis">
          No hay roles disponibles.
        </p>
      </v-card-text>

      <v-card-actions class="px-4 pb-4">
        <v-spacer />
        <v-btn variant="text" @click="close">Cancelar</v-btn>
        <v-btn color="primary" variant="flat" @click="submit">Guardar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
