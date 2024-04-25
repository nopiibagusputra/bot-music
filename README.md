# BOT DISCORD MUSIC

Bot Discord Music dengan sumber pemutaran musik dari youtube, dengan menggunakan library discord.js dan ytdl-core.

## Fitur

| Perintah yang tersedia :

- /maen <'URL'> : Memutar lagu dari URL YouTube
- /maen <'JUDUL LAGU'> : Memutar lagu dari Judul Lagu YouTube
- /lanjut : Melewati lagu yang sedang diputar
- /mandek : Menghentikan pemutaran lagu
- /ngaleh : Mematikan bot dan keluar dari saluran suara
- /dhaptar : Menampilkan daftar lagu yang sedang dalam antrian
- /hapus <'INDEX LAGU'> : Menghapus lagu dari antrian
- /help atau /bantuan : Menampilkan pesan bantuan

| Banned Song

- Fitur Banned lagu yang dapat ditambahkan pada file banned-songs.json, lagu yang ditambahkan kefile tersebut tidak akan dapat diputar.

## Instalasi

1.Clone Project dengan perintah sebagai berikut

```bash
git clone https://github.com/nopiibagusputra/bot-music.git
```

2.Buka direktori project yang telah diclone dengan perintah sebagai berikut

```bash
cd bot-music
```

3.Install Dependencies dengan perintah sebagai berikut

```bash
npm install
```

4.Buat file config.json untuk menyipan konfigurasi sebagai berikut

```bash
{
    "prefix": "/",
    "token": "TOKEN_BOT_DISCORD"
}
```

5.Jalankan bot dengan perintah berikut

```bash
    node index.js
```
