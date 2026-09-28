<script setup>
import { ref } from 'vue'
import AdminMembersView from './AdminMembersView.vue'
import CatalogManager from '../components/admin/CatalogManager.vue'
import BannerManager from '../components/admin/BannerManager.vue'

const tab = ref('members')
</script>

<template>
  <v-container class="py-8">
    <h1 class="text-h5 font-weight-bold mb-4">
      <v-icon icon="mdi-shield-account" start />
      Administración
    </h1>

    <v-tabs v-model="tab" color="primary" class="mb-6">
      <v-tab value="members">
        <v-icon icon="mdi-account-group" start />
        Miembros
      </v-tab>
      <v-tab value="community-roles">
        <v-icon icon="mdi-account-star" start />
        Roles de comunidad
      </v-tab>
      <v-tab value="professional-profiles">
        <v-icon icon="mdi-briefcase" start />
        Perfiles profesionales
      </v-tab>
      <v-tab value="banner">
        <v-icon icon="mdi-image-text" start />
        Home / Banner
      </v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <v-window-item value="members">
        <AdminMembersView embedded />
      </v-window-item>

      <v-window-item value="community-roles">
        <CatalogManager type="community-roles" title="Roles de comunidad" />
      </v-window-item>

      <v-window-item value="professional-profiles">
        <CatalogManager type="professional-profiles" title="Perfiles profesionales" />
      </v-window-item>

      <v-window-item value="banner">
        <BannerManager />
      </v-window-item>
    </v-window>
  </v-container>
</template>
