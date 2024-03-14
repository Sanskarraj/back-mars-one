async function downloadVideo(clientId, url, formatIndexI) {
    function getFileExtension(fileName) {
        return fileName.split('.').pop();
    }

    try {
        const videoInfo = await ytdl.getInfo(url);
        let v = 0;

        //format available
        console.log('Available formats:');
        videoInfo.formats.forEach((format, index) => {
            const sizeMB = format.contentLength ? (format.contentLength / (1024 * 1024)).toFixed(2) + 'MB' : 'Unknown';
            if (format.qualityLabel == null) { format.qualityLabel = "audio" }
            console.log(`${index + 1}: ${format.qualityLabel} - ${format.container} - Size: ${sizeMB}`);
        });

        // format selection
        const bestFormat = videoInfo.formats[formatIndexI];
        console.log("111111");
        console.log(bestFormat.videoCodec);

        //audio dena padega pehle bc merging process ko required hai bc
        const extractedAudio = 'outAudio.aac';

        //after download ye kaaam krna bhai
        // const videoTitle = videoInfo.videoDetails.title + "video";
        const videoTitle = "video";
        console.log(videoTitle)
        const videoExtension = bestFormat.container;
        console.log(videoExtension)
        const outputFilePath = `${videoTitle}.${videoExtension}`; // Save in the current directory

        // console.log(bestFormat);
        if (bestFormat.hasVideo) {
            const videoStream = ytdl(url, { format: bestFormat });
            const videoFile = fs.createWriteStream(outputFilePath);

            videoStream.pipe(videoFile);
            videoStream.on('end', async () => {
                console.log('\nVideo downloaded successfully.');
                v = v + 5;
                console.log(v);

                // #1
                //video download phase completed
                await emitPhase(phases[2], clientId, indexData, 0);
                // #1

                //merging process
                if (v == 9) {
                    extn = getFileExtension(outputFilePath);
                    const outputVideoFile = 'Download ' + outputFilePath;

                    let codek = (extn == 'mp4') ? 'copy' : 'libopus';

                    command = `ffmpeg -hwaccel auto -i "${extractedAudio}" -i "${outputFilePath}" -c:v copy -c:a ${codek} "${outputVideoFile}"`;

                    exec(command, (error, stdout, stderr) => {
                        if (error) {
                            console.error('Merge process failed:', error);
                            return;
                        }
                        console.log('Merge process succeeded:', stdout);

                        // #4
                        //merging process phase completed
                        emitPhase(phases[3], clientId, indexData, 0);
                        // #4
                    });
                }
            });

            videoStream.on('error', (error) => {
                console.error(`Error: ${error.message}`);
            });

            // Rest of your code for audio download and conversion
        } else {
            console.error('Error: No suitable format found for download.');
        }
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}
