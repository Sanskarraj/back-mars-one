const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");



//imports for ytdownloader function
const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');
// const ffmpeg = require('fluent-ffmpeg');
// undo the comment
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
const { exec } = require('child_process');
const ss = require('socket.io-stream');


app.use(cors());
const server = http.createServer(app);
const io = require("socket.io")(server, {
    cors: {
        origin: "*",
        // origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    },
    transports: "websocket"
});


let a = "";
let b = "";


// Store client connections in an object
const clientSockets = {};


//emit phase function emit krke msg bhejne ka kaam krega
function emitPhase(phase, clientId, indexData, delay) {
    return new Promise((resolve) => {
        setTimeout(() => {
            if (clientSockets[clientId]) {
                clientSockets[clientId].emit("phase_executed", { phase, indexData });
                resolve();
            } else {
                // If the client has disconnected, resolve immediately
                resolve();
            }
        }, delay);
    });
}







async function downloadAudio(a, clientId, indexData, url) {

    const phases = ["Audio Downloaded", "Audio Conversion", "Checking for viruses", "Making your file ready", "Your file is ready !!", "Downloading File"];
    const Info = await ytdl.getInfo(url);
    await emitPhase(phases[5], clientId, indexData, 100);

    const Format = Info.formats[indexData];
    const ext = Format.container;
    const finalAudioFile = `${clientId}.${ext}`;
    const outputAudio = `${clientId}.aac`

    const audioStream = ytdl(url, { format: Format });
    const audioFile = fs.createWriteStream(finalAudioFile);
    audioStream.pipe(audioFile);

    // Once video download completes, merge audio and video using ffmpeg
    audioStream.on('end', async () => {
        console.log("only* Audio download done")
        await emitPhase(phases[0], clientId, indexData, 100);


        ffmpeg(finalAudioFile)
            .noVideo()
            .audioCodec('aac')
            .save(outputAudio)
            .on('end', async () => {

                console.log("conversion done");
                await emitPhase(phases[1], clientId, indexData, 1000);
                await emitPhase(phases[2], clientId, indexData, 1000);
                await emitPhase(phases[3], clientId, indexData, 1000);
                await emitPhase(phases[4], clientId, indexData, 1000);
                if (clientSockets[clientId]) {
                    clientSockets[clientId].emit("execution_completed");
                }

                fs.unlinkSync(finalAudioFile);
                // fs.unlinkSync(outputAudioFilePath);
                // fs.unlinkSync(outputVideoFilePath);
                // set_a(outputVideoFile);
                console.log(a === outputAudio);

            })

    });

    // Handle errors in video stream
    audioStream.on('error', (error) => {
        console.error(`Error: ${error.message}`);
    });









}







//real deaaaallllllll youtube downloader function

async function downloadVideo(a, clientId, indexData, url) {

    const phases = ["Audio Downloaded", "Audio Conversion", "Video Downloaded", "Checking for Extensions", "Checking for viruses", "Making your file ready", "Your file is ready !!", "Downloading File"];

    // Get video information from YouTube API
    const videoInfo = await ytdl.getInfo(url);
    await emitPhase(phases[7], clientId, indexData, 100);

    let v = 0;
    const title = videoInfo.videoDetails.title;

    // Select the format of the video to be downloaded
    const Format = videoInfo.formats[indexData];
    const finalAudioFile = `${clientId}.aac`;
    // const videoTitle = `${videoUID}`;
    const videoExtension = Format.container;

    const outputVideoFilePath = `${clientId}.${videoExtension}`;

    // Check if the selected format has video
    if (Format.hasVideo) {
        // Download the video stream
        const videoStream = ytdl(url, { format: Format });
        const videoFile = fs.createWriteStream(outputVideoFilePath);
        videoStream.pipe(videoFile);

        // Once video download completes, merge audio and video using ffmpeg
        videoStream.on('end', async () => {
            v = v + 5;
            console.log("video download done")
            await emitPhase(phases[2], clientId, indexData, 100);

            if (v == 9) {
                // Extract file extension of the downloaded video
                let extn = videoExtension;
                const outputVideoFile = "Download " + outputVideoFilePath;
                // Determine the codec for audio based on video file extension
                let codek = (extn == 'mp4') ? 'copy' : 'libopus';
                // Execute ffmpeg command to merge audio and video
                let command = `ffmpeg -hwaccel auto -i "${finalAudioFile}" -i "${outputVideoFilePath}" -c:v copy -c:a ${codek} "${outputVideoFile}"`;
                exec(command, async (error, stdout, stderr) => {
                    if (error) {
                        console.error('Merge process failed:', error);
                        return;
                    }
                    console.log("merging done");
                    await emitPhase(phases[3], clientId, indexData, 1000);
                    await emitPhase(phases[4], clientId, indexData, 1000);
                    await emitPhase(phases[5], clientId, indexData, 1000);
                    await emitPhase(phases[6], clientId, indexData, 1000);
                    if (clientSockets[clientId]) {
                        clientSockets[clientId].emit("execution_completed");
                    }

                    fs.unlinkSync(finalAudioFile);
                    fs.unlinkSync(outputAudioFilePath);
                    fs.unlinkSync(outputVideoFilePath);
                    // set_a(outputVideoFile);
                    console.log(a === outputVideoFile);


                });
            }
        });

        // Handle errors in video stream
        videoStream.on('error', (error) => {
            console.error(`Error: ${error.message}`);
        });

        // Find all available audio formats
        let allAudioFormats = []
        videoInfo.formats.forEach((e, i) => {
            if (e.hasAudio) {
                allAudioFormats.push(e)
            }
        })

        // Select the first available audio format
        // const audioTitle = `${videoUID}`;
        const audioExtension = allAudioFormats[0].container;
        const outputAudioFilePath = `Audio ${clientId}.${audioExtension}`;
        const audCodec = allAudioFormats[0].audioCodec;

        // Download the audio stream
        const audioStream = ytdl(url, { format: allAudioFormats[0] });
        const audioFile = fs.createWriteStream(outputAudioFilePath);
        audioStream.pipe(audioFile);

        // Once audio download completes, convert audio to AAC format using ffmpeg
        audioStream.on('end', async () => {
            v++;
            console.log("audio download done")
            await emitPhase(phases[0], clientId, indexData, 100);

            ffmpeg(outputAudioFilePath)
                .noVideo()
                .audioCodec('aac')
                .save(finalAudioFile)
                .on('end', async () => {
                    v = v + 3;
                    console.log("audio extraction done")
                    await emitPhase(phases[1], clientId, indexData, 100);

                    if (v == 9) {
                        // Extract file extension of the downloaded video again
                        let extn = videoExtension;
                        const outputVideoFile = "Download " + outputVideoFilePath;
                        // Determine the codec for audio based on video file extension again
                        let codek = (extn == 'mp4') ? 'copy' : 'libopus';
                        // Execute ffmpeg command to merge audio and video again
                        let command = `ffmpeg -hwaccel auto -i "${finalAudioFile}" -i "${outputVideoFilePath}" -c:v copy -c:a ${codek} "${outputVideoFile}"`;
                        exec(command, async (error, stdout, stderr) => {
                            if (error) {
                                console.error('Merge process failed:', error);
                                return;
                            }
                            console.log("merging done")
                            await emitPhase(phases[3], clientId, indexData, 1000);
                            await emitPhase(phases[4], clientId, indexData, 1000);
                            await emitPhase(phases[5], clientId, indexData, 1000);
                            await emitPhase(phases[6], clientId, indexData, 1000);
                            if (clientSockets[clientId]) {
                                clientSockets[clientId].emit("execution_completed");
                            }
                            fs.unlinkSync(finalAudioFile);
                            fs.unlinkSync(outputAudioFilePath);
                            fs.unlinkSync(outputVideoFilePath);
                            // set_a(outputVideoFile);
                            console.log(a === outputVideoFile);

                        });
                    }
                })
                .on('error', (err, stdout, stderr) => {
                    console.error('Error:', err.message);
                    console.error('FFmpeg stdout:', stdout);
                    console.error('FFmpeg stderr:', stderr);
                });
        });

        // Handle errors in audio stream
        audioStream.on('error', (error) => {
            console.error(`Error: Audio waala ${error.message}`);
        });
    } else {
        // If no suitable format found for download, log an error
        console.error('Error: No suitable format found for download.');
    }

}

io.use((socket, next) => {
    // Authentication logic
    const clientToken = socket.handshake.query.clientId;
    const indexData = socket.handshake.query.indexData;

    if (clientToken.length === 36 && indexData) {

        return next();
    }
    return next(new Error('Authentication error'));
});


io.on("connection", (socket) => {
    console.log(`user connected: ${socket.id}`);
    // console.log(socket);
    // Listen for the 'start_execution' event from the client
    socket.on("start_execution", (damta) => {
        //damta from function bracket()
        // Extract clientId from the query parameters
        const clientId = socket.handshake.query.clientId;
        console.log("client id", clientId);
        console.log("client id length ", clientId.length);
        // console.log("b data io con", b);

        const url = damta.message;
        console.log("url", url);

        console.log("handshake query", socket.handshake.query);
        const indexData = socket.handshake.query.indexData;

        console.log(indexData)
        let urlForm = '';
        let encode = '';
        let urlAV = '';
        for (let i = url.length - 1; i >= 0; i--) {
            if (url[i] == ' ') { urlAV = encode; break; }
            if (url[i] == '_') {
                urlForm = encode;
                encode = '';
            }
            else { encode += url[i]; }

        }

        let Format = urlForm.split('').reverse().join('');


        console.log("format", Format);
        // Store the client's socket connection
        clientSockets[clientId] = socket;
        console.log("av", urlAV);



        // let av = b[indexData].AV;
        console.log(urlAV);
        // Call your long complex function with clientId
        // longComplexFunction(clientId, indexData, urr);
        if (urlAV === '1') {
            let extension = Format
            console.log("if statement")
            a = `Download ${clientId}.${extension}`
            console.log(a);
            const pa = downloadVideo(a, clientId, indexData, url);
        }
        else {
            let extension = 'aac'
            console.log("else statement")
            a = `${clientId}.${extension}`
            console.log(a);
            downloadAudio(a, clientId, indexData, url);
        }
        // console.log(pa);
    });

    // Handle disconnection
    socket.on("disconnect", () => {
        //download automatically file for user


        // Remove the client's socket connection from the object
        const clientId = Object.keys(clientSockets).find(key => clientSockets[key] === socket);
        if (clientId) {
            delete clientSockets[clientId];
            console.log(`user disconnected: ${socket.id}`);
        }
    });
});
const PORT = process.env.PORT || 9000;
server.listen(PORT, () => {
    console.log("server running");
});




//get method for sending info url data
app.get('/data', async (req, res) => {
    // url from frontend
    const { url } = req.query;
    let urlL = url.toString();

    let data = await getVideoInfo(urlL);
    // a = data[0].formatData;
    // console.log(a);
    // b = data[0].formatData;
    // console.log("b data", b);
    // console.log("a data", a);
    // Simulate a delay (you can remove this in production)
    setTimeout(() => {
        res.json(data);
    }, 10); // 2 seconds delay
});



//function for getting details of the video

async function getVideoInfo(url) {

    const videoInfo = await ytdl.getInfo(url);
    const format = videoInfo.formats;
    // console.log(format);
    console.log(format.length);
    arrayData = {};
    jsonArray = [];

    let audIndex = audioIndex(format);

    for (let i = 0; i < format.length; i++) {
        jsonData = {};
        jsonData["Format"] = getFormat(format[i]);
        jsonData["Size"] = getSize(format[i], format[audIndex]).toFixed(1);
        jsonData["Quality"] = getQuality(format[i]);
        jsonData["AV"] = format[i].hasVideo ? 1 : 0;

        jsonArray.push(jsonData);
    }

    arrayData["formatData"] = jsonArray;
    arrayData["imageUrl"] = videoInfo.videoDetails.thumbnails[videoInfo.videoDetails.thumbnails.length - 1].url;
    arrayData["videoTitle"] = videoInfo.videoDetails.title;
    // console.log(videoInfo.videoDetails.thumbnails[videoInfo.videoDetails.thumbnails.length - 1].url);
    userArray = [];
    userArray.push(arrayData);
    return userArray;
}

//function for getting first audio format index
function audioIndex(format) {

    for (let i = 0; i < format.length; i++) {
        if (format[i].hasAudio) {
            return i;
        }
    }
    return 0;
}



// function for getting sizes
function getSize(Format, audioFormat) {
    let size = 0;
    if (!Format.hasAudio) {
        bitrate = parseInt(Format.averageBitrate);
        duration = parseInt(Format.approxDurationMs) / 1000;
        audioBit = parseInt(audioFormat.averageBitrate);
        audioDur = parseInt(audioFormat.approxDurationMs) / 1000;

        size = (bitrate * duration) / (8 * 1000000) + (audioBit * audioDur) / (8 * 1000000);
    }
    else if (!Format.hasVideo) {
        bitrate = parseInt(Format.averageBitrate);
        duration = parseInt(Format.approxDurationMs) / 1000;
        size = (bitrate * duration) / (8 * 1000000);
    }
    else {
        bitrate = parseInt(Format.bitrate);
        duration = parseInt(Format.approxDurationMs) / 1000;
        size = (bitrate * duration) / (8 * 1000000);
    }
    return size;
}



//function for getting quality
function getQuality(Format) {
    let quality = '';
    if (Format.qualityLabel == null) {
        quality = "Audio"
    }
    else {
        quality = Format.qualityLabel;
    }
    return quality;
}



//function for getting format
function getFormat(Format) {
    return Format.container;
}







app.get('/download', (req, res) => {
    // Replace 'path_to_your_large_file' with the actual path to your large file
    const { Fname } = req.query;
    // let pat = `./${a}`
    // console.log(pat);
    const file = `./${Fname}`;
    console.log(file);
    console.log(Fname);

    let q_file = Fname;
    // a = b;  
    // console.log("b data dwonload", b);

    res.download(file); // This sends the file as an attachment
    //deleting file 
    console.log("deleting file");
    setTimeout(() => {
        console.log("now");
        fs.unlinkSync(q_file);
        console.log("deleted");
    }, 1500)

});



const directoryPath = './'; // Specify the directory where your files are stored



const getFileInfos = async (dir) => {
    let fileMap = new Map();
    await traverseDirectory(dir, fileMap);
    return Array.from(fileMap.values());
};

// Recursive function to traverse directory
const traverseDirectory = async (dir, fileMap) => {
    const files = await fs.promises.readdir(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        try {
            await fs.promises.access(filePath, fs.constants.R_OK);
            const stats = await fs.promises.stat(filePath);
            if (stats.isFile()) {
                const existingFile = fileMap.get(file);
                if (!existingFile || stats.mtime > existingFile.modifiedAt) {
                    fileMap.set(file, {
                        filename: file,
                        size: stats.size,
                        modifiedAt: stats.mtime
                    });
                }
            } else if (stats.isDirectory()) {
                // Exclude node_modules directory
                if (file !== 'node_modules') {
                    await traverseDirectory(filePath, fileMap);
                }
            }
        } catch (err) {
            // User does not have permission to access this file
            console.error(`Cannot access ${filePath}: ${err.message}`);
        }
    }
};

// Endpoint to get information about files user has permission to access
app.get('/qwerty/asdfgh/files', async (req, res) => {
    try {
        const fileInfos = await getFileInfos(directoryPath);
        // console.log(fileInfos);
        res.json(fileInfos);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});



app.delete('/qwerty/asdfgh/files/:filename', async (req, res) => {
    console.log("deleted in andar");
    const filename = req.params.filename;
    console.log(filename);

    const filePath = path.join(directoryPath, filename);
    if (filePath == 'index.js') {
        res.json({ success: true, message: `File ${filename}  deletion is prohibited` });

    }
    else if (filePath == 'package.json') {
        res.json({ success: true, message: `File ${filename}  deletion is prohibited` });

    }
    else if (filePath == 'package-lock.json') {
        res.json({ success: true, message: `File ${filename}  deletion is prohibited` });

    }
    else {
        try {
            await fs.promises.unlink(filePath);
            res.json({ success: true, message: `File ${filename} deleted successfully` });
        } catch (err) {
            console.error(`Error deleting file ${filename}:`, err.message);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});


// Endpoint to create a new file
app.post('/qwerty/asdfgh/files/:name', async (req, res) => {
    console.log("create ke andar");
    const filename = req.params.name;
    console.log(filename);

    const filePath = path.join(directoryPath, filename);
    try {
        // Check if the file already exists
        const fileExists = await fs.promises.access(filePath)
            .then(() => true)
            .catch(() => false);
        if (fileExists) {
            return res.status(400).json({ error: 'File already exists' });
        }
        // Create the new file
        await fs.promises.writeFile(filePath, '');
        res.json({ success: true, message: `File ${filename} created successfully` });
    } catch (err) {
        console.error(`Error creating file ${filename}:`, err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});
