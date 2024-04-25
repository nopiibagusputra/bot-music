const { Client } = require('discord.js');
const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');
const config = require('./config.json');
const bannedSongs = require('./banned-songs.json');

const client = new Client();
const queue = new Map();

client.once('ready', () => {
    console.log('Bot siap!');
});

client.on('message', async message => {
    if (message.author.bot) return;
    if (!message.content.startsWith(config.prefix)) return;

    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    const serverQueue = queue.get(message.guild.id);

    if (command === 'maen') {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) return message.channel.send('Kamu harus bergabung dengan saluran suara terlebih dahulu!');

        let song;
        try {
            // Cek apakah args[0] merupakan URL atau judul
            if (ytdl.validateURL(args[0])) {
                const songInfo = await ytdl.getInfo(args[0], { filter: 'audioonly', quality: 'highestaudio' });
                if (isSongBanned(songInfo.videoDetails.title)) {
                    return message.channel.send('Maaf, judul lagu tersebut tidak diizinkan.');
                }
                song = {
                    title: songInfo.videoDetails.title,
                    url: songInfo.formats.find(format => format.mimeType === 'audio/webm; codecs="opus"').url
                };
            } else {
                const searchQuery = args.join(' ');
                if (!searchQuery) return message.channel.send('Tidak ada query pencarian.');
                if (isSongBanned(searchQuery)) {
                    return message.channel.send('Maaf, judul lagu tersebut tidak diizinkan.');
                }
                if (isSongBanned(searchQuery)) {
                    return message.channel.send('Maaf, lagu tersebut tidak diizinkan.');
                }
                // Mencari judul lagu yang paling mirip dengan searchQuery
                const searchResults = await ytSearch(searchQuery);
                if (!searchResults.videos.length) return message.channel.send('Tidak ada lagu yang ditemukan.');
                const songInfo = await ytdl.getInfo(searchResults.videos[0].url, { filter: 'audioonly', quality: 'highestaudio' });
                if (isSongBanned(songInfo.videoDetails.title)) {
                    return message.channel.send('Maaf, judul lagu tersebut tidak diizinkan.');
                }
                song = {
                    title: songInfo.videoDetails.title,
                    url: songInfo.formats.find(format => format.mimeType === 'audio/webm; codecs="opus"').url
                };
            }

            if (!serverQueue) {
                const queueContruct = {
                    textChannel: message.channel,
                    voiceChannel: voiceChannel,
                    connection: null,
                    songs: [],
                    volume: 2,
                    playing: true
                };

                queue.set(message.guild.id, queueContruct);
                queueContruct.songs.push(song);

                try {
                    const connection = await voiceChannel.join();
                    queueContruct.connection = connection;
                    play(message.guild, queueContruct.songs[0]);
                } catch (err) {
                    console.log(err);
                    queue.delete(message.guild.id);
                    return message.channel.send(err.message);
                }
            } else {
                serverQueue.songs.push(song);
                return message.channel.send(`${song.title} telah ditambahkan ke dalam antrian!`);
            }
        } catch (error) {
            console.error(error);
            return message.channel.send('Terjadi kesalahan saat memutar lagu.');
        }
    } else if (command === 'hapus') {
        if (!message.member.voice.channel) return message.channel.send('Kamu harus bergabung dengan saluran suara terlebih dahulu!');
        if (!serverQueue) return message.channel.send('Tidak ada lagu yang bisa dihapus karena antrian kosong!');
        const songIndex = parseInt(args[0]);
        if (isNaN(songIndex) || songIndex < 1 || songIndex > serverQueue.songs.length) {
            return message.channel.send('Nomor urut lagu tidak valid!');
        }
        const removedSong = serverQueue.songs.splice(songIndex - 1, 1);
        message.channel.send(`Lagu "${removedSong[0].title}" telah dihapus dari antrian.`);
    } else if (command === 'lanjut') {
        if (!message.member.voice.channel) return message.channel.send('Kamu harus bergabung dengan saluran suara terlebih dahulu!');
        if (!serverQueue) return message.channel.send('Tidak ada lagu yang bisa dilewati!');
        serverQueue.connection.dispatcher.end();
    } else if (command === 'mandek') {
        if (!message.member.voice.channel) return message.channel.send('Kamu harus bergabung dengan saluran suara terlebih dahulu!');
        if (!serverQueue) return message.channel.send('Tidak ada lagu yang bisa dihentikan!');
        serverQueue.songs = [];
        serverQueue.connection.dispatcher.end();
    } else if (command === 'ngaleh') {
        if (!message.member.voice.channel) return message.channel.send('Kamu harus bergabung dengan saluran suara terlebih dahulu!');
        if (!serverQueue) return message.channel.send('Bot tidak terhubung ke saluran suara manapun.');
        serverQueue.songs = [];
        serverQueue.connection.dispatcher.end();
        serverQueue.voiceChannel.leave();
        serverQueue.textChannel.send('Bye bye guyss :), jangan kangen kutinggal yahh');
        queue.delete(message.guild.id);
    } else if (command === 'dhaptar') {
        if (!serverQueue || serverQueue.songs.length === 0) return message.channel.send('Tidak ada lagu di dalam antrian.');
        let queueMessage = '';
        for (let i = 0; i < serverQueue.songs.length; i++) {
            queueMessage += `${i + 1}. ${serverQueue.songs[i].title}\n`;
        }
        return message.channel.send('Hello ini Antrian musik yang ada:\n' + queueMessage);
    } else if (command === 'help' || command === 'tulung') {
        const helpMessage = `
        **Daftar Perintah:**
        /maen <URL>: Memutar lagu dari YouTube
        /maen <JUDUL>: Memutar lagu dari YouTube
        /lanjut: Melewati lagu yang sedang diputar
        /mandek: Menghentikan pemutaran lagu
        /ngaleh: Mematikan bot dan keluar dari saluran suara
        /dhaptar: Menampilkan daftar lagu yang sedang dalam antrian
        /hapus <INDEX LAGU>: Menghapus lagu dari antrian
        /help atau /tulung: Menampilkan pesan bantuan ini
        `;
        return message.channel.send(helpMessage);
    }
});

function isSongBanned(title) {
    return bannedSongs.songs.includes(title.toLowerCase());
}

function play(guild, song) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }

    const dispatcher = serverQueue.connection.play(song.url)
        .on('finish', () => {
            serverQueue.songs.shift();
            play(guild, serverQueue.songs[0]);
        })
        .on('error', error => {
            console.error(error);
            if (error.code === 'EPIPE') {
                console.log('Error EPIPE terdeteksi. Menutup koneksi...');
                serverQueue.textChannel.send('Terjadi kesalahan saat memutar lagu, silahkan coba kembali...');
                serverQueue.voiceChannel.leave();
                queue.delete(guild.id);
            } else {
                serverQueue.textChannel.send('Terjadi kesalahan saat memutar lagu, lanjutkan antrian lagu...');
                serverQueue.songs.shift();
                play(guild, serverQueue.songs[0]);
            }
        });
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    serverQueue.textChannel.send(`Sedang memutar: 🎵 **${song.title}**`);
    client.user.setActivity('/tulung for help', { type: 'LISTENING' });
}

client.login(config.token);