<script setup>
import { ref, onMounted } from 'vue'
import catalogService from '../../services/catalogs'

const props = defineProps({
  // 'community-roles' | 'professional-profiles'
  type: { type: String, required: true },
  title: { type: String, default: 'Catálogo' },
})

const loading = ref(false)
const items = ref([])
const errorMessage = ref('')
const successMessage = ref('')

// Modal crear/editar
const dialog = ref(false)
const editing = ref(null)
const saving = ref(false)
const form = ref(null)
const model = ref({ name: '', color: '#1976D2', is_active: true })

// Confirmación de borrado
const deleteDialog = ref(false)
const deletingItem = ref(null)
const deleteLoading = ref(false)

const headers = [
  { title: 'Nombre', key: 'name' },
  { title: 'Color', key: 'color', sortable: false },
  { title: 'Activo', key: 'is_active' },
  { title: 'Acciones', key: 'actions', sortable: false, align: 'end' },
]

const nameRule = [(v) => !!v || 'El nombre es obligatorio.']

async function fetchItems() {
  loading.value = true
  errorMessage.value = ''
  try {
    const { data } = await catalogService.adminList(props.type)
    items.value = data.data || []
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'No se pudo cargar el catálogo.'
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  model.value = { name: '', color: '#1976D2', is_active: true }
  dialog.value = true
}

function openEdit(item) {
  editing.value = item
  model.value = {
    name: item.name,
    color: item.color || '#1976D2',
    is_active: item.is_active,
  }
  dialog.value = true
}

async function save() {
  const { valid } = await form.value.validate()
  if (!valid) return
  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    if (editing.value) {
      await catalogService.update(props.type, editing.value.id, model.value)
    } else {
      await catalogService.create(props.type, model.value)
    }
    dialog.value = false
    successMessage.value = 'Guardado correctamente.'
    await fetchItems()
  } catch (error) {
    const data = error.response?.data
    errorMessage.value = data?.errors?.[0] || data?.message || 'No se pudo guardar.'
  } finally {
    saving.value = false
  }
}

function openDelete(item) {
  deletingItem.value = item
  deleteDialog.value = true
}

async function confirmDelete() {
  if (!deletingItem.value) return
  deleteLoading.value = true
  errorMessage.value = ''
  try {
    await catalogService.remove(props.type, deletingItem.value.id)
    deleteDialog.value = false
    deletingItem.value = null
    successMessage.value = 'Elemento eliminado.'
    await fetchItems()
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'No se pudo eliminar.'
  } finally {
    deleteLoading.value = false
  }
}

onMounted(fetchItems)
</script>

<template>
  <div>
    <div class="d-flex align-center mb-4">
      <h2 class="text-h6 font-weight-bold">{{ title }}</h2>
      <v-spacer />
      <v-btn color="primary" variant="flat" @click="openCreate">
        <v-icon icon="mdi-plus" start />
        Agregar
      </v-btn>
    </div>

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

    <v-card elevation="2" rounded="lg">
      <v-data-table
        :headers="headers"
        :items="items"
        :loading="loading"
        no-data-text="Sin elementos."
      >
        <template #[`item.color`]="{ item }">
          <v-chip :color="item.color" size="small" variant="flat">
            {{ item.color || '—' }}
          </v-chip>
        </template>

        <template #[`item.is_active`]="{ item }">
          <v-icon
            :icon="item.is_active ? 'mdi-check-circle' : 'mdi-close-circle'"
            :color="item.is_active ? 'success' : 'grey'"
          />
        </template>

        <template #[`item.actions`]="{ item }">
          <v-btn icon="mdi-pencil" variant="text" size="small" @click="openEdit(item)" />
          <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="openDelete(item)" />
        </template>
      </v-data-table>
    </v-card>

    <!-- Modal crear/editar -->
    <v-dialog v-model="dialog" max-width="420" persistent>
      <v-card rounded="lg">
        <v-card-title>{{ editing ? 'Editar' : 'Agregar' }}</v-card-title>
        <v-card-text>
          <v-form ref="form" @submit.prevent="save">
            <v-text-field
              v-model="model.name"
              label="Nombre"
              variant="outlined"
              :rules="nameRule"
            />
            <div class="text-caption text-medium-emphasis mb-1">Color</div>
            <div class="d-flex align-center ga-3 mb-3">
              <div
                class="rounded"
                :style="{ backgroundColor: model.color, width: '32px', height: '32px', border: '1px solid #ccc' }"
              />
              <span class="text-body-2">{{ model.color }}</span>
            </div>
            <v-color-picker
              v-model="model.color"
              mode="hex"
              :modes="['hex']"
              hide-inputs
              width="100%"
            />
            <v-switch
              v-model="model.is_active"
              label="Activo"
              color="primary"
              hide-details
              class="mt-2"
            />
          </v-form>
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" :loading="saving" @click="save">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Confirmación de borrado -->
    <v-dialog v-model="deleteDialog" max-width="420" persistent>
      <v-card rounded="lg">
        <v-card-title class="text-error">
          <v-icon icon="mdi-alert" start />
          Eliminar
        </v-card-title>
        <v-card-text>
          ¿Eliminar <strong>{{ deletingItem?.name }}</strong>? Los miembros que lo
          tengan quedarán sin este valor.
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Cancelar</v-btn>
          <v-btn color="error" variant="flat" :loading="deleteLoading" @click="confirmDelete">
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
