<script setup>
import { pastEvents } from '../../data/home'
</script>

<template>
  <section id="events" class="py-16 bg-grey-lighten-4">
    <v-container>
      <div class="text-center mb-10">
        <h2 class="text-h4 font-weight-bold mb-2">Eventos realizados</h2>
        <p class="text-body-1 text-medium-emphasis">
          Un vistazo a lo que hemos vivido juntos
        </p>
      </div>

      <v-row>
        <v-col
          v-for="event in pastEvents"
          :key="event.id"
          cols="12"
          md="4"
        >
          <v-card elevation="2" rounded="lg" height="100%">
            <v-img :src="event.image" :alt="event.title" height="180" cover />

            <v-card-item>
              <v-card-title class="text-wrap">{{ event.title }}</v-card-title>
              <v-card-subtitle>
                <v-icon icon="mdi-calendar" size="x-small" start />
                {{ event.date }}
                <span class="mx-1">·</span>
                <v-icon icon="mdi-map-marker" size="x-small" start />
                {{ event.location }}
              </v-card-subtitle>
            </v-card-item>

            <v-card-text>{{ event.description }}</v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </section>
</template>
