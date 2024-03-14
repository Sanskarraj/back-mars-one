
function getFileExtension(fileName) {
    return fileName.split('.').pop();
}
try {
    const phases = ["Audio Downloaded", "Audio Conversion", "Video Downloaded", "Merging process Done", "Checking for viruses", "Making your file ready", "Your file is ready !!"];
    const videoInfo = await ytdl.getInfo(url);
    let v = 0;
    const downloadTitle = videoInfo.videoDetails.title;
    videoInfo.formats.forEach((format, index) => {
        const sizeMB = format.contentLength ? (format.contentLength / (1024 * 1024)).toFixed(2) + 'MB' : 'Unknown';
        if (format.qualityLabel == null) { format.qualityLabel = "audio" }
    });
    const bestFormat = videoInfo.formats[indexData];
    const extractedAudio = `${videoUID}.aac`;
    const videoTitle = `${videoUID}`;
    const videoExtension = bestFormat.container;
    const outputFilePath = `${videoTitle}.${videoExtension}`;
    if (bestFormat.hasVideo) {
        const videoStream = ytdl(url, { format: bestFormat });
        const videoFile = fs.createWriteStream(outputFilePath);
        videoStream.pipe(videoFile);
        videoStream.on('end', async () => {
            v = v + 5;
            await emitPhase(phases[2], clientId, indexData, 100);
            if (v == 9) {
                extn = getFileExtension(outputFilePath);
                const outputVideoFile = `${downloadTitle} ` + outputFilePath;
                let codek = (extn == 'mp4') ? 'copy' : 'libopus';
                command = `ffmpeg -hwaccel auto -i "${extractedAudio}" -i "${outputFilePath}" -c:v copy -c:a ${codek} "${outputVideoFile}"`;
                exec(command, async (error, stdout, stderr) => {
                    if (error) {
                        console.error('Merge process failed:', error);
                        return;
                    }
                    await emitPhase(phases[3], clientId, indexData, 3000);
                    await emitPhase(phases[4], clientId, indexData, 3000);
                    await emitPhase(phases[5], clientId, indexData, 3000);
                    await emitPhase(phases[6], clientId, indexData, 3000);
                    if (clientSockets[clientId]) {
                        clientSockets[clientId].emit("execution_completed");
                    }
                });
            }
        });
        videoStream.on('error', (error) => {
            console.error(`Error: ${error.message}`);
        });
        let allAudioFormats = []
        videoInfo.formats.forEach((e, i) => {
            if (e.hasAudio) {
                allAudioFormats.push(e)
            }
        })
        const audioTitle = `${videoUID}`;
        const audioExtension = allAudioFormats[0].container;
        const outputAudioFilePath = `${audioTitle}.${audioExtension}`;
        const audCodec = allAudioFormats[0].audioCodec;
        const audioStream = ytdl(url, { format: allAudioFormats[0] });
        const audioFile = fs.createWriteStream(outputAudioFilePath);
        audioStream.pipe(audioFile);
        audioStream.on('end', async () => {
            v++;
            await emitPhase(phases[0], clientId, indexData, 100);
            ffmpeg(outputAudioFilePath)
                .noVideo()
                .audioCodec('aac')
                .save(extractedAudio)
                .on('end', async () => {
                    v = v + 3;
                    await emitPhase(phases[1], clientId, indexData, 100);
                    if (v == 9) {
                        extn = getFileExtension(outputFilePath);
                        const outputVideoFile = `${downloadTitle} ` + outputFilePath;
                        let codek = (extn == 'mp4') ? 'copy' : 'libopus';
                        command = `ffmpeg -hwaccel auto -i "${extractedAudio}" -i "${outputFilePath}" -c:v copy -c:a ${codek} "${outputVideoFile}"`;
                        exec(command, async (error, stdout, stderr) => {
                            if (error) {
                                console.error('Merge process failed:', error);
                                return;
                            }
                            await emitPhase(phases[3], clientId, indexData, 3000);
                            await emitPhase(phases[4], clientId, indexData, 3000);
                            await emitPhase(phases[5], clientId, indexData, 3000);
                            await emitPhase(phases[6], clientId, indexData, 3000);
                            if (clientSockets[clientId]) {
                                clientSockets[clientId].emit("execution_completed");
                            }
                        });
                    }
                })
                .on('error', (err, stdout, stderr) => {
                    console.error('Error:', err.message);
                    console.error('FFmpeg stdout:', stdout);
                    console.error('FFmpeg stderr:', stderr);
                });
        });
        audioStream.on('error', (error) => {
            console.error(`Error: Audio waala ${error.message}`);
        });
    } else {
        console.error('Error: No suitable format found for download.');
    }
} catch (e) {
    console.error(`Error: ${e.message}`)
}
}