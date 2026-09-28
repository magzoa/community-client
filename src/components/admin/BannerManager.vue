<script setup>
import { ref, onMounted } from 'vue'
import settingsService from '../../services/settings'

const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Textos del banner
const settingsForm = ref(null)
const settings = ref({ main_title: '', secondary_title: '', daily_phrase: '' })
const membersCount = ref(0)

// Redes del banner
const links = ref([])
const linkDialog = ref(false)
const editingLink = ref(null)
const linkModel = ref({ type: 'instagram', url: '', label: '', icon: '', is_active: true, sort_order: 0 })
const linkForm = ref(null)

// Confirmación de borrado
const deleteDialog = ref(false)
const deletingLink = ref(null)

const types = ['instagram', 'linkedin', 'youtube', 'meetup', 'twitter', 'website', 'other']

const headers = [
  { title: 'Tipo', key: 'type' },
  { title: 'URL', key: 'url' },
  { title: 'Icono', key: 'icon', sortable: false },
  { title: 'Activo', key: 'is_active' },
  { title: 'Imagen', key: 'image', sortable: false },
  { title: 'Acciones', key: 'actions', sortable: false, align: 'end' },
]

const requiredRule = [(v) => !!v || 'Obligatorio.']
const urlRule = [
  (v) => !!v || 'La URL es obligatoria.',
  (v) => /^https?:\/\/.+/.test(v) || 'URL válida (http/https).',
]

async function fetchAll() {
  loading.value = true
  errorMessage.value = ''
  try {
    // Textos + count vienen del endpoint público (una sola fuente)
    const pub = await settingsService.getPublic()
    settings.value = {
      main_title: pub.data.settings.main_title || '',
      secondary_title: pub.data.settings.secondary_title || '',
      daily_phrase: pub.data.settings.daily_phrase || '',
    }
    membersCount.value = pub.data.settings.members_count || 0
    // Todas las redes (admin, incluye inactivas)
    const res = await settingsService.listLinks()
    links.value = res.data.data || []
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'No se pudo cargar la configuración.'
  } finally {
    loading.value = false
  }
}

async function saveSettings() {
  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const { data } = await settingsService.update(settings.value)
    successMessage.value = data.message || 'Guardado.'
  } catch (error) {
    const data = error.response?.data
    errorMessage.value = data?.errors?.[0] || data?.message || 'No se pudo guardar.'
  } finally {
    saving.value = false
  }
}

// ── Redes ──
function openCreate() {
  editingLink.value = null
  linkModel.value = { type: 'instagram', url: '', label: '', icon: '', is_active: true, sort_order: 0 }
  linkDialog.value = true
}

function openEdit(link) {
  editingLink.value = link
  linkModel.value = {
    type: link.type,
    url: link.url,
    label: link.label || '',
    icon: link.icon || '',
    is_active: link.is_active,
    sort_order: link.sort_order || 0,
  }
  linkDialog.value = true
}

async function saveLink() {
  const { valid } = await linkForm.value.validate()
  if (!valid) return
  errorMessage.value = ''
  try {
    if (editingLink.value) {
      await settingsService.updateLink(editingLink.value.id, linkModel.value)
    } else {
      await settingsService.createLink(linkModel.value)
    }
    linkDialog.value = false
    successMessage.value = 'Red guardada.'
    await fetchAll()
  } catch (error) {
    const data = error.response?.data
    errorMessage.value = data?.errors?.[0] || data?.message || 'No se pudo guardar la red.'
  }
}

function openDelete(link) {
  deletingLink.value = link
  deleteDialog.value = true
}

async function confirmDelete() {
  try {
    await settingsService.deleteLink(deletingLink.value.id)
    deleteDialog.value = false
    deletingLink.value = null
    successMessage.value = 'Red eliminada.'
    await fetchAll()
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'No se pudo eliminar.'
  }
}

// Subir imagen de una red
async function onImageSelected(link, file) {
  const f = Array.isArray(file) ? file[0] : file
  if (!f) return
  errorMessage.value = ''
  try {
    await settingsService.uploadLinkImage(link.id, f)
    successMessage.value = 'Imagen actualizada.'
    await fetchAll()
  } catch (error) {
    const data = error.response?.data
    errorMessage.value = data?.errors?.[0] || data?.message || 'No se pudo subir la imagen.'
  }
}

async function removeImage(link) {
  errorMessage.value = ''
  try {
    await settingsService.deleteLinkImage(link.id)
    successMessage.value = 'Imagen eliminada.'
    await fetchAll()
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'No se pudo eliminar la imagen.'
  }
}

onMounted(fetchAll)
</script>

<template>
  <div>
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

    <!-- Textos del banner -->
    <v-card class="mb-6" elevation="2" rounded="lg">
      <v-card-title>Textos del banner</v-card-title>
      <v-card-text>
        <v-form ref="settingsForm">
          <v-text-field
            v-model="settings.main_title"
            label="Título principal"
            variant="outlined"
          />
          <v-text-field
            v-model="settings.secondary_title"
            label="Título secundario"
            variant="outlined"
          />
          <v-textarea
            v-model="settings.daily_phrase"
            label="Frase del día"
            variant="outlined"
            rows="2"
          />
          <v-text-field
            :model-value="membersCount"
            label="Miembros registrados (automático)"
            variant="outlined"
            readonly
            hint="Se calcula automáticamente, no editable"
            persistent-hint
          />
        </v-form>
      </v-card-text>
      <v-card-actions class="px-4 pb-4">
        <v-spacer />
        <v-btn color="primary" variant="flat" :loading="saving" @click="saveSettings">
          Guardar textos
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Redes del banner -->
    <div class="d-flex align-center mb-4">
      <h2 class="text-h6 font-weight-bold">Redes del banner</h2>
      <v-spacer />
      <v-btn color="primary" variant="flat" @click="openCreate">
        <v-icon icon="mdi-plus" start />
        Agregar red
      </v-btn>
    </div>

    <v-card elevation="2" rounded="lg">
      <v-data-table :headers="headers" :items="links" :loading="loading" no-data-text="Sin redes.">
        <template #[`item.icon`]="{ item }">
          <v-icon v-if="item.icon" :icon="item.icon" />
          <span v-else class="text-medium-emphasis text-caption">—</span>
        </template>

        <template #[`item.is_active`]="{ item }">
          <v-icon
            :icon="item.is_active ? 'mdi-check-circle' : 'mdi-close-circle'"
            :color="item.is_active ? 'success' : 'grey'"
          />
        </template>

        <template #[`item.image`]="{ item }">
          <div class="d-flex align-center ga-2" style="min-width: 220px">
            <v-avatar v-if="item.image_url" size="32">
              <v-img :src="item.image_url" />
            </v-avatar>
            <v-file-input
              label="Subir"
              accept="image/*"
              variant="outlined"
              density="compact"
              hide-details
              prepend-icon="mdi-image"
              style="max-width: 150px"
              @update:model-value="(f) => onImageSelected(item, f)"
            />
            <v-btn
              v-if="item.image_url"
              icon="mdi-delete"
              variant="text"
              size="x-small"
              color="error"
              @click="removeImage(item)"
            />
          </div>
        </template>

        <template #[`item.actions`]="{ item }">
          <v-btn icon="mdi-pencil" variant="text" size="small" @click="openEdit(item)" />
          <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="openDelete(item)" />
        </template>
      </v-data-table>
    </v-card>

    <!-- Modal crear/editar red -->
    <v-dialog v-model="linkDialog" max-width="440" persistent>
      <v-card rounded="lg">
        <v-card-title>{{ editingLink ? 'Editar red' : 'Agregar red' }}</v-card-title>
        <v-card-text>
          <v-form ref="linkForm" @submit.prevent="saveLink">
            <v-select
              v-model="linkModel.type"
              :items="types"
              label="Tipo"
              variant="outlined"
              :rules="requiredRule"
            />
            <v-text-field
              v-model="linkModel.url"
              label="URL"
              placeholder="https://..."
              variant="outlined"
              :rules="urlRule"
            />
            <v-text-field
              v-model="linkModel.label"
              label="Etiqueta (opcional)"
              variant="outlined"
            />
            <v-text-field
              v-model="linkModel.icon"
              label="Icono MDI (ej: mdi-instagram)"
              variant="outlined"
            />
            <v-text-field
              v-model.number="linkModel.sort_order"
              label="Orden"
              type="number"
              variant="outlined"
            />
            <v-switch
              v-model="linkModel.is_active"
              label="Activo"
              color="primary"
              hide-details
            />
          </v-form>
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="linkDialog = false">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" @click="saveLink">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Confirmación de borrado -->
    <v-dialog v-model="deleteDialog" max-width="420" persistent>
      <v-card rounded="lg">
        <v-card-title class="text-error">
          <v-icon icon="mdi-alert" start />
          Eliminar red
        </v-card-title>
        <v-card-text>
          ¿Eliminar <strong>{{ deletingLink?.label || deletingLink?.type }}</strong>?
          También se borrará su imagen.
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Cancelar</v-btn>
          <v-btn color="error" variant="flat" @click="confirmDelete">Eliminar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
