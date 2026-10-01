<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useAuthStore } from '../stores/auth'
import LoginDialog from './auth/LoginDialog.vue'
import RegisterDialog from './auth/RegisterDialog.vue'

const props = defineProps({
  // Permite abrir el modal de registro desde fuera (ej. CTA del hero)
  openRegister: { type: Boolean, default: false },
})
const emit = defineEmits(['update:openRegister', 'notify'])

const auth = useAuthStore()
const router = useRouter()
const { mobile } = useDisplay()

const drawer = ref(false)
const loginOpen = ref(false)
const registerOpen = ref(false)

// Enlaces de navegación (anclas a secciones del home)
const navLinks = [
  { title: 'Inicio', href: '#', icon: 'mdi-home' },
  { title: 'Miembros', href: '#members', icon: 'mdi-account-group' },
  { title: 'Eventos', href: '#events', icon: 'mdi-calendar-star' },
]

// Abre el modal de registro cuando el padre lo solicita (CTA del hero)
watch(
  () => props.openRegister,
  (val) => {
    if (val) {
      registerOpen.value = true
      emit('update:openRegister', false)
    }
  },
)

// Diálogo de bienvenida tras registro/login
const welcomeOpen = ref(false)
const welcomeMessage = ref('')

function onAuthSuccess(message) {
  welcomeMessage.value = message
  welcomeOpen.value = true
}

// Al aceptar el diálogo, va al perfil
function goToProfile() {
  welcomeOpen.value = false
  if (router.currentRoute.value.name !== 'profile') {
    router.push({ name: 'profile' })
  }
}

async function handleLogout() {
  await auth.logout()
  emit('notify', 'Sesión cerrada correctamente.')
  // Vuelve al home (evita quedar en rutas protegidas como /profile o /admin)
  if (router.currentRoute.value.name !== 'home') {
    router.push({ name: 'home' })
  }
}
</script>

<template>
  <v-app-bar color="grey-darken-4" flat>
    <!-- Botón hamburguesa en móvil -->
    <v-app-bar-nav-icon
      v-if="mobile"
      @click="drawer = !drawer"
    />

    <v-app-bar-title>
      <router-link
        :to="{ name: 'home' }"
        class="text-white text-decoration-none font-weight-bold"
      >
        AWS User Groups Canindeyú
      </router-link>
    </v-app-bar-title>

    <!-- Navegación en escritorio -->
    <template v-if="!mobile">
      <v-btn
        v-for="link in navLinks"
        :key="link.title"
        :href="link.href"
        variant="text"
      >
        {{ link.title }}
      </v-btn>
    </template>

    <v-spacer />

    <!-- Bloque de auth: sin sesión -->
    <template v-if="!auth.isAuthenticated">
      <v-btn variant="text" @click="loginOpen = true">Iniciar sesión</v-btn>
      <v-btn color="primary" variant="flat" class="ml-2" @click="registerOpen = true">
        Registrarse
      </v-btn>
    </template>

    <!-- Bloque de auth: con sesión (acceso discreto) -->
    <template v-else>
      <v-menu location="bottom end">
        <template #activator="{ props: menuProps }">
          <v-btn v-bind="menuProps" variant="text" class="text-none">
            <v-avatar color="primary" size="32" class="mr-2">
              <span class="text-caption">{{ auth.avatarInitial }}</span>
            </v-avatar>
            <span v-if="!mobile">{{ auth.displayName }}</span>
            <v-icon icon="mdi-chevron-down" end />
          </v-btn>
        </template>

        <v-list density="compact">
          <v-list-item
            prepend-icon="mdi-account-circle"
            title="Mi perfil"
            :to="{ name: 'profile' }"
          />
          <v-list-item
            v-if="auth.isAdmin"
            prepend-icon="mdi-account-group"
            title="Miembros registrados"
            :to="{ name: 'admin-members' }"
          />
          <v-divider />
          <v-list-item
            prepend-icon="mdi-logout"
            title="Cerrar sesión"
            @click="handleLogout"
          />
        </v-list>
      </v-menu>
    </template>
  </v-app-bar>

  <!-- Drawer de navegación en móvil -->
  <v-navigation-drawer v-model="drawer" temporary>
    <v-list nav>
      <v-list-item
        v-for="link in navLinks"
        :key="link.title"
        :href="link.href"
        :prepend-icon="link.icon"
        :title="link.title"
        @click="drawer = false"
      />
    </v-list>
  </v-navigation-drawer>

  <!-- Modales de autenticación -->
  <LoginDialog v-model="loginOpen" @success="onAuthSuccess" />
  <RegisterDialog v-model="registerOpen" @success="onAuthSuccess" />

  <!-- Diálogo de bienvenida → redirige al perfil -->
  <v-dialog v-model="welcomeOpen" max-width="400" persistent>
    <v-card rounded="lg">
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-check-circle" color="success" start />
        Todo listo
      </v-card-title>
      <v-card-text>
        {{ welcomeMessage }} Irás a tu perfil.
      </v-card-text>
      <v-card-actions class="px-4 pb-4">
        <v-spacer />
        <v-btn color="primary" variant="flat" @click="goToProfile">Aceptar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
