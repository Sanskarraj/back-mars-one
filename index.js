const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");



//imports for ytdownloader function
const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const { exec } = require('child_process');
const ss = require('socket.io-stream');


app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["https://front-mars-one.vercel.app", "http://localhost:3000"],
        // origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    },
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

    const phases = ["Audio Downloaded", "Audio Conversion", "Checking for viruses", "Making your file ready", "Your file is ready !!"];
    const Info = await ytdl.getInfo(url);

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
                await emitPhase(phases[1], clientId, indexData, 3000);
                await emitPhase(phases[2], clientId, indexData, 3000);
                await emitPhase(phases[3], clientId, indexData, 3000);
                await emitPhase(phases[4], clientId, indexData, 3000);
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

    const phases = ["Audio Downloaded", "Audio Conversion", "Video Downloaded", "Merging process Done", "Checking for viruses", "Making your file ready", "Your file is ready !!"];

    // Get video information from YouTube API
    const videoInfo = await ytdl.getInfo(url);
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
                    await emitPhase(phases[3], clientId, indexData, 3000);
                    await emitPhase(phases[4], clientId, indexData, 3000);
                    await emitPhase(phases[5], clientId, indexData, 3000);
                    await emitPhase(phases[6], clientId, indexData, 3000);
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
                            await emitPhase(phases[3], clientId, indexData, 3000);
                            await emitPhase(phases[4], clientId, indexData, 3000);
                            await emitPhase(phases[5], clientId, indexData, 3000);
                            await emitPhase(phases[6], clientId, indexData, 3000);
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

io.on("connection", (socket) => {
    console.log(`user connected: ${socket.id}`);

    // Listen for the 'start_execution' event from the client
    socket.on("start_execution", (damta) => {
        //damta from function bracket()
        // Extract clientId from the query parameters
        const clientId = socket.handshake.query.clientId;
        console.log("client id", clientId);
        const url = damta.message;
        console.log("url", url);

        console.log("handshake query", socket.handshake.query);
        const indexData = socket.handshake.query.indexData;

        console.log(indexData)

        // Store the client's socket connection
        clientSockets[clientId] = socket;

        let av = b[indexData].AV;
        console.log(av);
        // Call your long complex function with clientId
        // longComplexFunction(clientId, indexData, urr);
        if (av) {
            let extension = b[indexData].Format
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
    a = data;
    console.log(a);
    b = data;
    // Simulate a delay (you can remove this in production)
    setTimeout(() => {
        res.json(data);
    }, 2000); // 2 seconds delay
});



//function for getting details of the video

async function getVideoInfo(url) {

    const videoInfo = await ytdl.getInfo(url);
    const format = videoInfo.formats;
    // console.log(format);
    console.log(format.length);

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

    // console.log(jsonArray);

    return jsonArray;
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
    let pat = `./${a}`
    console.log(pat);
    const file = `./${a}`;
    let q_file = a;
    a = b;
    res.download(file); // This sends the file as an attachment
    //deleting file 
    console.log("deleting file");
    setTimeout(() => {
        console.log("now");
        fs.unlinkSync(q_file);
        console.log("deleted");
    }, 5000)

});