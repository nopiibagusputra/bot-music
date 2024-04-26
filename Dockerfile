# Menggunakan node.js versi 22
FROM node:latest

# Menyediakan direktori kerja di dalam container
WORKDIR /app

# Menyalin seluruh file dari direktori lokal ke direktori /app di dalam container
COPY . .

# Install FFmpeg (atau avconv) dan dependensinya
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    apt-get clean

# Menjalankan aplikasi node.js
CMD ["node", "index.js"]
