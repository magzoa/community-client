# Despliegue en producción — community-client (Portainer + AWS EC2)

SPA Vue 3.5 compilada con Vite y servida por Nginx. Se despliega como un Stack
independiente del servidor.

Archivos del despliegue:

```
Dockerfile               → multi-stage: Node compila la SPA → Nginx la sirve
docker-compose.yml       → definición del Stack (puerto 5173)
docker/nginx.conf        → Nginx con fallback de vue-router (history mode)
.dockerignore            → qué se excluye de la imagen
.env.production.example  → variable VITE_API_URL
```

---

## 1. Cómo se conecta con la API

`VITE_API_URL` se **incrusta en el bundle durante el build** (no se lee en
tiempo de ejecución). Por eso se pasa como *build-arg* desde el compose. Si
cambias la URL de la API, hay que **reconstruir** la imagen del cliente.

Valor de producción (la API va por el puerto 80 del servidor):

```
VITE_API_URL=http://18.231.63.186/api
```

---

## 2. Puerto a abrir en AWS

| Puerto | Servicio        | Origen sugerido     |
| ------ | --------------- | ------------------- |
| 5173   | Cliente (Nginx) | 0.0.0.0/0 (público) |

---

## 3. CORS en el servidor (importante)

El servidor debe permitir el origen del cliente. En el Stack de
`community-server`, define esta variable de entorno y redespliega:

```
CORS_ALLOWED_ORIGIN=http://18.231.63.186:5173
```

Si el origen del cliente y el `CORS_ALLOWED_ORIGIN` del servidor no coinciden
exactamente (esquema + host + puerto), el navegador bloqueará las llamadas.

---

## 4. Desplegar como Stack en Portainer

1. Sube la carpeta `community-client` a la EC2 (git clone o upload).
2. Portainer: **Stacks → Add stack**, nombre `community-client`.
3. Método **Repository** / **Upload** / **Web editor** con el `docker-compose.yml`.
4. En **Environment variables**:

   ```
   VITE_API_URL=http://18.231.63.186/api
   ```

5. **Deploy the stack**.

El build compila el cliente dentro de Docker; no necesitas Node en la EC2.

Abre la web en: `http://18.231.63.186:5173`

---

## 5. Flujo de actualización

- Cambios en el cliente → `git pull` en `community-client/` → en Portainer,
  **Stacks → community-client → Update / Re-pull and redeploy** (marca
  "re-build" para que recompile con los cambios).
- Como `VITE_API_URL` se hornea en build, cualquier cambio de URL exige
  reconstruir (no basta reiniciar el contenedor).

---

## 6. (Opcional) Compilar en tu PC en lugar del VPS

Si prefieres no compilar en el servidor:

```powershell
# En community-client, con VITE_API_URL apuntando a la IP pública en .env
npm run build
```

Se genera `dist/`. Podrías subir solo esa carpeta y servirla con cualquier
Nginx. El enfoque Docker de arriba es más reproducible y es el recomendado.
