<script setup>
import { ref, onMounted } from 'vue'
import adminService from '../services/admin'
import catalogService from '../services/catalogs'
import ManageRolesDialog from '../components/admin/ManageRolesDialog.vue'
import EditMemberDialog from '../components/admin/EditMemberDialog.vue'
import EditMemberFullDialog from '../components/admin/EditMemberFullDialog.vue'
import ChangeNicknameDialog from '../components/admin/ChangeNicknameDialog.vue'
import { useAuthStore } from '../stores/auth'

// Cuando se usa dentro de las pestañas de AdminView, se omite el contenedor/título
defineProps({
  embedded: { type: Boolean, default: false },
})

const auth = useAuthStore()

const loading = ref(false)
const members = ref([])
const errorMessage = ref('')
const successMessage = ref('')
const statusFilter = ref(null)
const actionLoadingId = ref(null)

// Roles disponibles y modal de gestión
const availableRoles = ref([])
const rolesDialog = ref(false)
const editingMember = ref(null)

// Catálogos y modal de edición de miembro
const professionalProfiles = ref([])
const communityRolesCatalog = ref([])
const editDialog = ref(false)
const editingCatalogsMember = ref(null)

// Modal de edición completa
const fullEditDialog = ref(false)
const fullEditMemberId = ref(null)

function openFullEdit(member) {
  fullEditMemberId.value = member.id
  fullEditDialog.value = true
}

function onFullEditSaved(msg) {
  successMessage.value = msg
  fetchMembers()
}

// Modal cambiar nickname
const nicknameDialog = ref(false)
const nicknameMember = ref(null)

function openNickname(member) {
  nicknameMember.value = member
  nicknameDialog.value = true
}

function onNicknameSaved(msg) {
  successMessage.value = msg
  fetchMembers()
}

// Filtros de catálogo
const professionalFilter = ref(null)
const communityRoleFilter = ref(null)

// Búsqueda por nombre/apellido (con debounce)
const search = ref('')
let searchTimer = null
function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(fetchMembers, 400)
}

// Diálogo de confirmación de eliminación
const deleteDialog = ref(false)
const deletingMember = ref(null)
const deleteLoading = ref(false)

// Opciones del filtro de estado
const statusOptions = [
  { title: 'Todos', value: null },
  { title: 'Pendientes', value: 'pending' },
  { title: 'Aprobados', value: 'approved' },
  { title: 'Rechazados', value: 'rejected' },
]

// Columnas de la tabla
const headers = [
  { title: 'ID', key: 'id', width: 70 },
  { title: 'Nombre', key: 'first_name' },
  { title: 'Correo', key: 'email' },
  { title: 'Estado', key: 'status' },
  { title: 'Roles', key: 'roles', sortable: false },
  { title: 'Comunidad', key: 'community', sortable: false },
  { title: 'Acciones', key: 'actions', sortable: false, align: 'end' },
]

// Etiquetas legibles por rol
const roleLabels = {
  admin: 'Administrador',
  member: 'Miembro',
  member_active: 'Miembro activo',
}

// Color del chip según estado
function statusColor(status) {
  return { pending: 'warning', approved: 'success', rejected: 'error' }[status] || 'grey'
}

function statusLabel(status) {
  return { pending: 'Pendiente', approved: 'Aprobado', rejected: 'Rechazado' }[status] || status
}

async function fetchRoles() {
  try {
    const { data } = await adminService.listRoles()
    availableRoles.value = data.roles || []
  } catch {
    // Si falla, el modal quedará sin opciones; no bloquea la vista
  }
}

// Carga los catálogos (perfiles profesionales y roles de comunidad)
async function fetchCatalogs() {
  try {
    const [profs, roles] = await Promise.all([
      catalogService.listActive('professional-profiles'),
      catalogService.listActive('community-roles'),
    ])
    professionalProfiles.value = profs.data.data || []
    communityRolesCatalog.value = roles.data.data || []
  } catch {
    // sin catálogos, los filtros/modal quedan vacíos
  }
}

async function fetchMembers() {
  loading.value = true
  errorMessage.value = ''
  try {
    const params = {}
    if (statusFilter.value) params.status = statusFilter.value
    if (professionalFilter.value) params.professional_profile = professionalFilter.value
    if (communityRoleFilter.value) params.community_role = communityRoleFilter.value
    if (search.value.trim()) params.search = search.value.trim()
    const { data } = await adminService.listMembers(params)
    // El backend devuelve { data: [...], meta: {...} }
    members.value = (data.data || []).map((m) => ({
      id: m.id,
      user_id: m.user_id,
      first_name: m.first_name,
      nickname: m.user?.nickname || '',
      email: m.user?.email || '',
      status: m.status,
      roles: (m.user?.roles || []).map((r) => r.name),
      // Datos crudos para el modal de edición
      professional_profile_id: m.professional_profile_id,
      professional_profile: m.professional_profile,
      community_roles: m.community_roles || [],
    }))
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message || 'No se pudo cargar la lista de miembros.'
  } finally {
    loading.value = false
  }
}

async function approve(id) {
  actionLoadingId.value = id
  try {
    await adminService.approve(id)
    await fetchMembers()
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'No se pudo aprobar.'
  } finally {
    actionLoadingId.value = null
  }
}

async function reject(id) {
  actionLoadingId.value = id
  try {
    await adminService.reject(id)
    await fetchMembers()
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'No se pudo rechazar.'
  } finally {
    actionLoadingId.value = null
  }
}

// Roles
function openRoles(member) {
  editingMember.value = member
  rolesDialog.value = true
}

async function saveRoles({ id, roles }) {
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const { data } = await adminService.updateRoles(id, roles)
    successMessage.value = data.message || 'Roles actualizados.'
    await fetchMembers()
  } catch (error) {
    const data = error.response?.data
    errorMessage.value = data?.errors?.[0] || data?.message || 'No se pudieron actualizar los roles.'
  }
}

// Eliminación
function isSelf(member) {
  return member.user_id === auth.user?.id
}

function openDelete(member) {
  deletingMember.value = member
  deleteDialog.value = true
}

async function confirmDelete() {
  if (!deletingMember.value) return
  deleteLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const { data } = await adminService.deleteMember(deletingMember.value.id)
    successMessage.value = data.message || 'Miembro eliminado.'
    deleteDialog.value = false
    deletingMember.value = null
    await fetchMembers()
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'No se pudo eliminar.'
  } finally {
    deleteLoading.value = false
  }
}

// Edición de catálogos del miembro (perfil + roles de comunidad)
function openEdit(member) {
  editingCatalogsMember.value = member
  editDialog.value = true
}

async function saveCatalogs({ id, professional_profile_id, community_roles }) {
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const { data } = await adminService.updateCatalogs(id, {
      professional_profile_id,
      community_roles,
    })
    successMessage.value = data.message || 'Miembro actualizado.'
    await fetchMembers()
  } catch (error) {
    const data = error.response?.data
    errorMessage.value = data?.errors?.[0] || data?.message || 'No se pudo actualizar.'
  }
}

onMounted(() => {
  fetchRoles()
  fetchCatalogs()
  fetchMembers()
})

// Permite al padre (AdminView) refrescar la tabla tras registrar un miembro
defineExpose({ fetchMembers })
</script>

<template>
  <v-container :class="embedded ? 'pa-0' : 'py-8'">
    <div class="d-flex align-center mb-6">
      <h1 v-if="!embedded" class="text-h5 font-weight-bold">
        <v-icon icon="mdi-account-group" start />
        Miembros registrados
      </h1>
      <v-spacer />
    </div>

    <!-- Filtros -->
    <v-row class="mb-2" dense>
      <v-col cols="12">
        <v-text-field
          v-model="search"
          label="Buscar por nombre o apellido"
          prepend-inner-icon="mdi-magnify"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          @update:model-value="onSearchInput"
          @click:clear="fetchMembers"
        />
      </v-col>
      <v-col cols="12" sm="4">
        <v-select
          v-model="statusFilter"
          :items="statusOptions"
          label="Estado"
          density="compact"
          variant="outlined"
          hide-details
          @update:model-value="fetchMembers"
        />
      </v-col>
      <v-col cols="12" sm="4">
        <v-select
          v-model="communityRoleFilter"
          :items="[{ id: null, name: 'Todos' }, ...communityRolesCatalog]"
          item-title="name"
          item-value="id"
          label="Rol de comunidad"
          density="compact"
          variant="outlined"
          hide-details
          @update:model-value="fetchMembers"
        />
      </v-col>
      <v-col cols="12" sm="4">
        <v-select
          v-model="professionalFilter"
          :items="[{ id: null, name: 'Todos' }, ...professionalProfiles]"
          item-title="name"
          item-value="id"
          label="Perfil profesional"
          density="compact"
          variant="outlined"
          hide-details
          @update:model-value="fetchMembers"
        />
      </v-col>
    </v-row>

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
        :items="members"
        :loading="loading"
        no-data-text="No hay miembros para mostrar."
      >
        <template #[`item.status`]="{ item }">
          <v-chip :color="statusColor(item.status)" size="small" variant="flat">
            {{ statusLabel(item.status) }}
          </v-chip>
        </template>

        <template #[`item.roles`]="{ item }">
          <v-chip
            v-for="role in item.roles"
            :key="role"
            size="x-small"
            class="mr-1"
            variant="outlined"
          >
            {{ roleLabels[role] || role }}
          </v-chip>
          <span v-if="!item.roles.length" class="text-medium-emphasis text-caption">
            Sin roles
          </span>
        </template>

        <template #[`item.community`]="{ item }">
          <v-chip
            v-for="role in item.community_roles"
            :key="role.id"
            :color="role.color || 'primary'"
            size="x-small"
            class="mr-1 mb-1"
            variant="flat"
          >
            {{ role.name }}
          </v-chip>
          <div v-if="item.professional_profile" class="text-caption text-medium-emphasis">
            {{ item.professional_profile.name }}
          </div>
          <span
            v-if="!item.community_roles.length && !item.professional_profile"
            class="text-medium-emphasis text-caption"
          >
            —
          </span>
        </template>

        <template #[`item.actions`]="{ item }">
          <v-btn
            color="success"
            size="small"
            variant="text"
            :loading="actionLoadingId === item.id"
            :disabled="item.status === 'approved'"
            @click="approve(item.id)"
          >
            <v-icon icon="mdi-check" start />
            Aprobar
          </v-btn>
          <v-btn
            color="error"
            size="small"
            variant="text"
            :loading="actionLoadingId === item.id"
            :disabled="item.status === 'rejected'"
            @click="reject(item.id)"
          >
            <v-icon icon="mdi-close" start />
            Rechazar
          </v-btn>
          <v-btn
            color="primary"
            size="small"
            variant="text"
            @click="openFullEdit(item)"
          >
            <v-icon icon="mdi-pencil" start />
            Editar
          </v-btn>
          <v-btn
            color="primary"
            size="small"
            variant="text"
            @click="openEdit(item)"
          >
            <v-icon icon="mdi-tag-multiple" start />
            Rol/Perfil
          </v-btn>
          <v-btn
            color="warning"
            size="small"
            variant="text"
            @click="openNickname(item)"
          >
            <v-icon icon="mdi-at" start />
            Nickname
          </v-btn>
          <v-btn
            color="primary"
            size="small"
            variant="text"
            @click="openRoles(item)"
          >
            <v-icon icon="mdi-shield-account" start />
            Roles sistema
          </v-btn>
          <v-btn
            color="error"
            size="small"
            variant="text"
            :disabled="isSelf(item)"
            :title="isSelf(item) ? 'No puedes eliminar tu propia cuenta' : 'Eliminar'"
            @click="openDelete(item)"
          >
            <v-icon icon="mdi-delete" start />
            Eliminar
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- Diálogo de confirmación de eliminación -->
    <v-dialog v-model="deleteDialog" max-width="440" persistent>
      <v-card rounded="lg">
        <v-card-title class="text-error">
          <v-icon icon="mdi-alert" start />
          Eliminar miembro
        </v-card-title>
        <v-card-text>
          ¿Eliminar definitivamente a
          <strong>{{ deletingMember?.first_name }}</strong>?
          Se borrarán su perfil, redes y accesos. Esta acción
          <strong>no se puede deshacer</strong>.
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Cancelar</v-btn>
          <v-btn
            color="error"
            variant="flat"
            :loading="deleteLoading"
            @click="confirmDelete"
          >
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Modal de gestión de roles -->
    <ManageRolesDialog
      v-model="rolesDialog"
      :member="editingMember"
      :available-roles="availableRoles"
      @save="saveRoles"
    />

    <!-- Modal de edición de catálogos del miembro (rápida) -->
    <EditMemberDialog
      v-model="editDialog"
      :member="editingCatalogsMember"
      :professional-profiles="professionalProfiles"
      :community-roles="communityRolesCatalog"
      @save="saveCatalogs"
    />

    <!-- Modal de edición completa del miembro -->
    <EditMemberFullDialog
      v-model="fullEditDialog"
      :member-id="fullEditMemberId"
      :professional-profiles="professionalProfiles"
      :community-roles="communityRolesCatalog"
      @saved="onFullEditSaved"
    />

    <!-- Modal de cambio de nickname -->
    <ChangeNicknameDialog
      v-model="nicknameDialog"
      :member="nicknameMember"
      @saved="onNicknameSaved"
    />
  </v-container>
</template>
