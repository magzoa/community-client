<script setup>
const props = defineProps({
  // Config del banner (incluye campos meetup_*)
  settings: { type: Object, default: () => ({}) },
})
</script>

<template>
  <section
    v-if="settings.meetup_title || settings.meetup_image"
    id="events"
    class="py-16 bg-grey-lighten-4"
  >
    <v-container>
      <v-row align="center">
        <!-- Imagen a la izquierda -->
        <v-col cols="12" md="5">
          <v-img
            v-if="settings.meetup_image"
            :src="settings.meetup_image"
            rounded="lg"
            cover
            class="elevation-2"
          />
          <div
            v-else
            class="d-flex align-center justify-center bg-grey-lighten-2 rounded-lg"
            style="height: 260px"
          >
            <v-icon icon="mdi-calendar-star" size="64" color="grey" />
          </div>
        </v-col>

        <!-- Detalle a la derecha -->
        <v-col cols="12" md="7">
          <div class="text-overline text-primary mb-1">Nuestros eventos</div>
          <h2 class="text-h4 font-weight-bold mb-1">
            {{ settings.meetup_title || 'Meetup de la comunidad' }}
          </h2>
          <p v-if="settings.meetup_subtitle" class="text-h6 font-weight-regular text-medium-emphasis mb-4">
            {{ settings.meetup_subtitle }}
          </p>
          <p v-if="settings.meetup_description" class="text-body-1 mb-6" style="white-space: pre-line">
            {{ settings.meetup_description }}
          </p>
          <v-btn
            v-if="settings.meetup_url"
            color="primary"
            size="large"
            :href="settings.meetup_url"
            target="_blank"
          >
            <v-icon icon="mdi-open-in-new" start />
            Ver Meetup
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
  </section>
</template>
