# Stage 1: Build React/Vite App
FROM node:20-alpine AS build

WORKDIR /app

# Salin file dependensi
COPY package*.json ./

# Instal semua dependensi (termasuk devDependencies untuk build tool)
RUN npm install

# Salin seluruh kode frontend
COPY . .

# Konfigurasi environment build-time agar Axios menggunakan proxy lokal /api
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

# Jalankan build production
RUN npm run build

# Stage 2: Serve using Nginx
FROM nginx:alpine

# Salin hasil kompilasi statis dari stage build
COPY --from=build /app/dist /usr/share/nginx/html

# Salin file konfigurasi nginx khusus
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Port default Nginx
EXPOSE 80

# Jalankan Nginx daemon
CMD ["nginx", "-g", "daemon off;"]
