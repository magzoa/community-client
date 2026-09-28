# ============================================================================
#  community-client (Vue 3.5 + Vite 8) — Imagen de producción
#  Multi-stage: Node compila la SPA → Nginx sirve los estáticos.
# ============================================================================

# --- Etapa 1: build --------------------------------------------------------
FROM node:20-alpine AS build

WORKDIR /app

# VITE_API_URL se "hornea" en el bundle en tiempo de build.
# Se pasa como build-arg desde docker-compose (o docker build --build-arg).
ARG VITE_API_URL=http://localhost:8000/api
ENV VITE_API_URL=${VITE_API_URL}

# Instalar dependencias (aprovecha la caché de capas)
COPY package.json package-lock.json ./
RUN npm ci

# Copiar el resto y compilar
COPY . .
RUN npm run build

# --- Etapa 2: runtime ------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

# Config de Nginx con fallback de vue-router (history mode)
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los estáticos compilados
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
