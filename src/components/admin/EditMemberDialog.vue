<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // Miembro a editar (con professional_profile y community_roles cargados)
  member: { type: Object, default: null },
  // Opciones de catálogos
  professionalProfiles: { type: Array, default: () => [] },
  communityRoles: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue', 'save'])

const model = ref({
  professional_profile_id: null,
  community_roles: [],
})

// Al abrir, precarga los valores actuales del miembro
watch(
  () => props.modelValue,
  (open) => {
    if (open && props.member) {
      model.value = {
        professional_profile_id: props.member.professional_profile_id || null,
        community_roles: (props.member.community_roles || []).map((r) => r.id),
      }
    }
  },
)

function close() {
  emit('update:modelValue', false)
}

function submit() {
  emit('save', {
    id: props.member.id,
    professional_profile_id: model.value.professional_profile_id,
    community_roles: model.value.community_roles,
  })
  close()
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
      <v-card-title>
        Editar miembro
        <span v-if="member" class="text-subtitle-2 text-medium-emphasis d-block">
          {{ member.first_name }} {{ member.last_name }}
        </span>
      </v-card-title>

      <v-card-text>
        <v-select
          v-model="model.professional_profile_id"
          :items="professionalProfiles"
          item-title="name"
          item-value="id"
          label="Perfil profesional"
          variant="outlined"
          clearable
        />
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
      </v-card-text>

      <v-card-actions class="px-4 pb-4">
        <v-spacer />
        <v-btn variant="text" @click="close">Cancelar</v-btn>
        <v-btn color="primary" variant="flat" @click="submit">Guardar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
