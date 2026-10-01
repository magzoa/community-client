<script setup>
import { ref, onMounted } from 'vue'
import HomeHero from '../components/home/HomeHero.vue'
import MembersShowcase from '../components/home/MembersShowcase.vue'
import MeetupSection from '../components/home/MeetupSection.vue'
import settingsService from '../services/settings'

// Reenvía el CTA del hero hacia el padre (App) para abrir el modal de registro
const emit = defineEmits(['register'])

// Configuración del banner (textos + count + redes)
const settings = ref({})

async function fetchSettings() {
  try {
    const { data } = await settingsService.getPublic()
    settings.value = data.settings || {}
  } catch {
    // Si falla, el hero usa sus valores por defecto
    settings.value = {}
  }
}

onMounted(fetchSettings)
</script>

<template>
  <div>
    <HomeHero :settings="settings" @register="emit('register')" />
    <MembersShowcase />
    <MeetupSection :settings="settings" />
  </div>
</template>
