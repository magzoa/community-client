<script setup>
import { staticStats, heroTheme } from '../../data/home'

const props = defineProps({
  // Config del banner desde la API: { main_title, secondary_title, daily_phrase, members_count, social_links }
  settings: { type: Object, default: () => ({}) },
})

// Emite un evento para que el padre abra el modal de registro
const emit = defineEmits(['register'])

// Icono por defecto según tipo de red (si no tiene icon propio)
const typeIcon = {
  instagram: 'mdi-instagram',
  linkedin: 'mdi-linkedin',
  youtube: 'mdi-youtube',
  meetup: 'mdi-account-group',
  twitter: 'mdi-twitter',
  website: 'mdi-web',
  other: 'mdi-link-variant',
}

function linkIcon(link) {
  return link.icon || typeIcon[link.type] || 'mdi-link-variant'
}
</script>

<template>
  <section
    class="hero"
    :style="{
      background: `linear-gradient(135deg, ${heroTheme.gradientFrom} 0%, ${heroTheme.gradientTo} 160%)`,
      color: heroTheme.textColor,
    }"
  >
    <v-container class="py-16">
      <v-row align="center" justify="center">
        <v-col cols="12" md="9" class="text-center">
          <v-chip color="white" variant="flat" class="mb-4" size="small">
            <v-icon icon="mdi-aws" start />
            AWS User Group
          </v-chip>

          <h1 class="text-h3 text-md-h2 font-weight-bold mb-4">
            {{ settings.main_title || 'Comunidad AWS UG' }}
          </h1>

          <p class="text-h6 font-weight-regular mb-2" style="opacity: 0.9">
            {{ settings.secondary_title || 'Aprende, comparte y crece en la nube.' }}
          </p>

          <p v-if="settings.daily_phrase" class="text-body-1 font-italic mb-8" style="opacity: 0.85">
            "{{ settings.daily_phrase }}"
          </p>

          <div class="mb-8">
            <v-btn size="large" color="white" class="text-black" @click="emit('register')">
              <v-icon icon="mdi-account-plus" start />
              Únete a la comunidad
            </v-btn>
          </div>

          <!-- Redes del banner (por ícono) -->
          <div v-if="settings.social_links?.length" class="d-flex justify-center ga-2">
            <v-btn
              v-for="link in settings.social_links"
              :key="link.id"
              :icon="linkIcon(link)"
              variant="text"
              color="white"
              :href="link.url"
              target="_blank"
              :aria-label="link.label || link.type"
            />
          </div>
        </v-col>
      </v-row>

      <!-- Estadísticas -->
      <v-row justify="center" class="mt-12">
        <v-col cols="4" md="3" class="text-center">
          <v-icon :icon="staticStats.membersIcon" color="white" size="32" class="mb-2" />
          <div class="text-h5 font-weight-bold">{{ settings.members_count ?? 0 }}</div>
          <div class="text-body-2" style="opacity: 0.85">{{ staticStats.membersLabel }}</div>
        </v-col>
        <v-col cols="4" md="3" class="text-center">
          <v-icon :icon="staticStats.eventsIcon" color="white" size="32" class="mb-2" />
          <div class="text-h5 font-weight-bold">{{ staticStats.eventsValue }}</div>
          <div class="text-body-2" style="opacity: 0.85">{{ staticStats.eventsLabel }}</div>
        </v-col>
        <v-col cols="4" md="3" class="text-center">
          <v-icon :icon="staticStats.yearsIcon" color="white" size="32" class="mb-2" />
          <div class="text-h5 font-weight-bold">{{ staticStats.yearsValue }}</div>
          <div class="text-body-2" style="opacity: 0.85">{{ staticStats.yearsLabel }}</div>
        </v-col>
      </v-row>
    </v-container>
  </section>
</template>
