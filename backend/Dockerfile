FROM node:18-alpine

WORKDIR /app

# Salin file dependensi
COPY package*.json ./

# Instal dependensi khusus untuk production
RUN npm install --production

# Salin sisa kode aplikasi
COPY . .

# Port default backend
EXPOSE 8081

# Jalankan server.js
CMD ["node", "server.js"]
