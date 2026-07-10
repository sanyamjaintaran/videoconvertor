// Import FFmpeg and utility functions from the official CDN (v0.12 API)
import { FFmpeg } from 'https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/+esm';
import { fetchFile } from 'https://cdn.jsdelivr.net/npm/@ffmpeg/util@0.12.1/+esm';

// --- State Variables ---
let ffmpeg = null;
let imageFile = null;
let audioFile = null;

// --- DOM Elements ---
const imageInput = document.getElementById('image-input');
const audioInput = document.getElementById('audio-input');
const imagePreviewContainer = document.getElementById('image-preview-container');
const audioPreviewContainer = document.getElementById('audio-preview-container');
const imagePreview = document.getElementById('image-preview');
const audioNameEl = document.getElementById('audio-name');
const audioDurationEl = document.getElementById('audio-duration');
const generateBtn = document.getElementById('generate-btn');
const statusSection = document.getElementById('status-section');
const statusText = document.getElementById('status-text');
const progressBar = document.getElementById('progress-bar');
const progressPercentage = document.getElementById('progress-percentage');
const removeImageBtn = document.getElementById('remove-image');
const removeAudioBtn = document.getElementById('remove-audio');

// --- Initialization ---

/**
 * Initializes and caches the FFmpeg instance.
 * Uses the single-threaded core so it works on GitHub Pages without strict SharedArrayBuffer CORS headers.
 */
async function loadFFmpeg() {
    if (ffmpeg) return; // Already loaded

    ffmpeg = new FFmpeg();

    // Listen to log and progress events
    ffmpeg.on('log', ({ message }) => {
        console.log('[FFmpeg Log]', message);
    });

    ffmpeg.on('progress', ({ progress, time }) => {
        // Progress goes from 0 to 1
        let percent = Math.round(progress * 100);
        if (percent > 100) percent = 100;
        if (percent < 0) percent = 0;
        
        progressBar.style.width = `${percent}%`;
        progressPercentage.innerText = `${percent}%`;
        statusText.innerText = `Processing Video...`;
    });

    try {
        const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd';
        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        console.log('FFmpeg loaded successfully');
    } catch (error) {
        console.error('Error loading FFmpeg:', error);
        alert('Failed to load FFmpeg. Check your network or console.');
    }
}

/**
 * Helper to bypass some browser caching/CORS issues by turning URL into a Blob URL
 */
async function toBlobURL(url, mimeType) {
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    const blob = new Blob([buf], { type: mimeType });
    return URL.createObjectURL(blob);
}

// --- Event Listeners ---

// Image Upload Handler
imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert('Unsupported image format. Please upload JPG, PNG, or WEBP.');
        return;
    }

    imageFile = file;
    imagePreview.src = URL.createObjectURL(file);
    imagePreviewContainer.classList.remove('hidden');
    checkReadyState();
});

// Audio Upload Handler
audioInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
        alert('Unsupported audio format. Please upload MP3, WAV, M4A, or AAC.');
        return;
    }

    audioFile = file;
    audioNameEl.innerText = file.name;
    
    // Calculate Audio Duration
    const audioObj = new Audio(URL.createObjectURL(file));
    audioObj.onloadedmetadata = () => {
        const minutes = Math.floor(audioObj.duration / 60);
        const seconds = Math.floor(audioObj.duration % 60).toString().padStart(2, '0');
        audioDurationEl.innerText = `${minutes}:${seconds}`;
        audioPreviewContainer.classList.remove('hidden');
        checkReadyState();
    };
});

// Remove Handlers
removeImageBtn.addEventListener('click', () => {
    imageFile = null;
    imageInput.value = '';
    imagePreviewContainer.classList.add('hidden');
    checkReadyState();
});

removeAudioBtn.addEventListener('click', () => {
    audioFile = null;
    audioInput.value = '';
    audioPreviewContainer.classList.add('hidden');
    checkReadyState();
});

// Generate Button Handler
generateBtn.addEventListener('click', generateVideo);

// --- Core Logic ---

/**
 * Checks if both files are present to enable the Generate button.
 */
function checkReadyState() {
    if (imageFile && audioFile) {
        generateBtn.disabled = false;
    } else {
        generateBtn.disabled = true;
    }
}

/**
 * Executes the FFmpeg command to combine the image and audio.
 */
async function generateVideo() {
    if (!imageFile || !audioFile) {
        alert("Please upload both an image and an audio file.");
        return;
    }

    try {
        // UI Updates
        generateBtn.disabled = true;
        generateBtn.innerText = "Initializing...";
        statusSection.classList.remove('hidden');
        progressBar.style.width = '0%';
        progressPercentage.innerText = '0%';
        statusText.innerText = "Loading Video Engine...";

        // Ensure FFmpeg is loaded
        if (!ffmpeg || !ffmpeg.loaded) {
            await loadFFmpeg();
        }

        generateBtn.innerText = "Creating Video...";

        // Get file extensions and build virtual filenames
        const imgExt = imageFile.name.split('.').pop();
        const audExt = audioFile.name.split('.').pop();
        const imgName = `input_image.${imgExt}`;
        const audName = `input_audio.${audExt}`;

        // Write files to FFmpeg's virtual file system
        statusText.innerText = "Reading files...";
        await ffmpeg.writeFile(imgName, await fetchFile(imageFile));
        await ffmpeg.writeFile(audName, await fetchFile(audioFile));

        statusText.innerText = "Encoding Video (This may take a minute)...";

        // Execute FFmpeg command
        // Matches standard ffmpeg CLI parameters requested:
        // -loop 1: Loop the single image
        // -i image & -i audio: Inputs
        // -c:v libx264 -tune stillimage: Optimal settings for static image H.264
        // -c:a aac -b:a 192k: High quality AAC audio
        // -pix_fmt yuv420p: Ensure maximum compatibility (QuickTime, WhatsApp, Instagram, etc)
        // -shortest: End video when the shortest stream (audio) ends
        // -r 30: 30 FPS
        // -s 1920x1080: Force 1080p resolution
        await ffmpeg.exec([
            '-loop', '1',
            '-i', imgName,
            '-i', audName,
            '-c:v', 'libx264',
            '-tune', 'stillimage',
            '-c:a', 'aac',
            '-b:a', '192k',
            '-pix_fmt', 'yuv420p',
            '-shortest',
            '-r', '30',
            '-s', '1920x1080',
            'output.mp4'
        ]);

        statusText.innerText = "Finalizing File...";

        // Read the resulting file
        const data = await ffmpeg.readFile('output.mp4');
        const videoBlob = new Blob([data.buffer], { type: 'video/mp4' });
        const videoUrl = URL.createObjectURL(videoBlob);

        // Trigger automatic download
        triggerDownload(videoUrl, 'output.mp4');

        // Cleanup Virtual FS
        await ffmpeg.deleteFile(imgName);
        await ffmpeg.deleteFile(audName);
        await ffmpeg.deleteFile('output.mp4');

        // Reset UI
        statusText.innerText = "Video created successfully!";
        setTimeout(() => {
            statusSection.classList.add('hidden');
            generateBtn.innerText = "Generate Video";
            generateBtn.disabled = false;
        }, 3000);

    } catch (error) {
        console.error('Error generating video:', error);
        alert('An error occurred while generating the video. Check the console for details.');
        generateBtn.innerText = "Generate Video";
        generateBtn.disabled = false;
        statusSection.classList.add('hidden');
    }
}

/**
 * Creates a temporary anchor tag to automatically download the generated blob.
 */
function triggerDownload(url, filename) {
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}
