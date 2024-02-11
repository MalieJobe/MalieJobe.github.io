const canvas = document.getElementById("waveformCanvas");
const ctx = canvas.getContext("2d");

canvas.width = document.getElementsByClassName("landing__soundwave")[0].offsetWidth; // parent's width
canvas.height = canvas.width / 4; // 1/4 of the parent's width

let micStream = null;
let analyser = null;
let sampleInterval = 0.2; // Sampling interval in seconds
let bars = []; // Array to store volume levels sampled over time
let intervalId = null;

for (let i = 0; i < 80; i++) {
    bars.push(0);
}
drawBars();

async function setupMicrophoneStream() {
    try {
        if (!micStream) {
            const meter = new Tone.Meter();
            const mic = new Tone.UserMedia();
            micStream = await mic.open();
            micStream.connect(meter);
            analyser = new Tone.Analyser("waveform", 1024);
            micStream.connect(analyser);
            console.log("Microphone stream set up");
        }
    } catch (error) {
        console.error("Error setting up microphone stream:", error);
    }
}

function drawBars() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const barWidth = 4;
    const barSpacing = 8;
    const minBarHeight = canvas.height / 12;

    
    for (let i = 0; i < bars.length; i++) {
        const x = i * (barWidth + barSpacing);
        const barHeight = Math.max(bars[i], minBarHeight);
        const y = canvas.height/2 - barHeight/2;
        const opacity = 1 - Math.abs(canvas.width / 2 - x) / (canvas.width / 2); // Make bars fade in and out
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fillRect(x, y, barWidth, barHeight);
    }

    while (bars.length > canvas.width / (barWidth + barSpacing)) {
        bars.shift();
    }
}

function startAnimationFrame() {
    drawBars();
    requestAnimationFrame(startAnimationFrame);
}

document.addEventListener('click', async () => {
    if (intervalId) return; // Don't start another interval if one is already running

    await Tone.start();

    await setupMicrophoneStream();

    intervalId = setInterval(() => {
        if (analyser) {
            const volume = analyser.getValue().reduce((acc, val) => acc + val, 0) * 10; // Calculate average volume
            const prevVolume = bars[bars.length - 1];
            let adjustedVolume = volume;
            const volumeDiff = volume - prevVolume;
            const change = Math.min(Math.abs(volumeDiff), 30);
            if (volumeDiff > 0) {
                adjustedVolume = prevVolume + change; // Adjust volume positively
            } else if (volumeDiff < 0) {
                adjustedVolume = prevVolume - change; // Adjust volume negatively
            }

            
            bars.push(adjustedVolume);
        }
    }, sampleInterval * 100); // Convert interval to milliseconds

    startAnimationFrame();
});
