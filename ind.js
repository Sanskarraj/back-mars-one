async function downloadVideo(clientId, url, indexData) {
    function getFileExtension(fileName) {
        return fileName.split('.').pop();
    }

    const phases = ["Audio Downloaded", "Audio Conversion", "Video Downloaded", "Merging process Done", "Checking for viruses", "Making your file ready", "Your file is ready !!"];
    console.log("inside long function " + indexData);

    const videoInfo = await ytdl.getInfo(url);
    let v = 0;

    // Format available
    console.log('Available formats:');
    videoInfo.formats.forEach((format, index) => {
        const sizeMB = format.contentLength ? (format.contentLength / (1024 * 1024)).toFixed(2) + 'MB' : 'Unknown';
        if (format.qualityLabel == null) { format.qualityLabel = "audio" }
        console.log(`${index + 1}: ${format.qualityLabel} - ${format.container} - Size: ${sizeMB}`);
    });

    // Format selection
    const bestFormat = videoInfo.formats[indexData];
    console.log("111111");
    console.log(bestFormat.videoCodec);

    // Audio download required for the merging process
    const extractedAudio = 'outAudio.aac';
    const videoTitle = "video";
    const videoExtension = bestFormat.container;
    const outputFilePath = `${videoTitle}.${videoExtension}`;

    if (bestFormat.hasVideo) {
        const videoStream = ytdl(url, { format: bestFormat });
        const videoFile = fs.createWriteStream(outputFilePath);

        videoStream.pipe(videoFile);

        videoStream.on('end', async () => {
            console.log('\nVideo downloaded successfully.');
            v = v + 5;
            console.log(v);

            // Emit video download phase completed
            await emitPhase(phases[2], clientId, indexData, 0);

            // Merging process
            if (v === 9) {
                // Merge process code here

                // Emit merging process phase completed
                await emitPhase(phases[3], clientId, indexData, 0);
            }
        });

        videoStream.on('error', (error) => {
            console.error(`Error: ${error.message}`);
        });

        // Rest of your code for audio download and conversion
    } else {
        console.error('Error: No suitable format found for download.');
    }
}
