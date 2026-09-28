<script setup>
import { ref } from 'vue'
import AppBar from './components/AppBar.vue'

// Solicita al AppBar abrir el modal de registro (desde el CTA del hero)
const openRegister = ref(false)

// Snackbar de notificaciones
const snackbar = ref(false)
const snackbarText = ref('')

function notify(message) {
  snackbarText.value = message
  snackbar.value = true
}
</script>

<template>
  <v-app>
    <AppBar v-model:open-register="openRegister" @notify="notify" />

    <v-main>
      <router-view @register="openRegister = true" />
    </v-main>

    <v-snackbar v-model="snackbar" timeout="3000" color="success">
      {{ snackbarText }}
    </v-snackbar>
  </v-app>
</template>
