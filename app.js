// =========================
// ELEMENTS
// =========================

const imageInput = document.getElementById("imageInput");
const audioInput = document.getElementById("audioInput");
const imagePreview = document.getElementById("imagePreview");
const audioInfo = document.getElementById("audioInfo");
const createBtn = document.getElementById("createBtn");

// =========================
// VARIABLES
// =========================

let imageFile = null;
let audioFile = null;

// Disable button initially
createBtn.disabled = true;

// =========================
// CHECK IF BOTH FILES EXIST
// =========================

function checkFiles() {
    if (imageFile && audioFile) {
        createBtn.disabled = false;
    } else {
        createBtn.disabled = true;
    }
}

// =========================
// IMAGE UPLOAD
// =========================

imageInput.addEventListener("change", () => {

    imageFile = imageInput.files[0];

    if (!imageFile) return;

    const reader = new FileReader();

    reader.onload = function (e) {

        imagePreview.innerHTML = `
            <img src="${e.target.result}" 
            style="
                width:100%;
                border-radius:10px;
                max-height:300px;
                object-fit:contain;
            ">
        `;

    };

    reader.readAsDataURL(imageFile);

    checkFiles();

});

// =========================
// AUDIO UPLOAD
// =========================

audioInput.addEventListener("change", () => {

    audioFile = audioInput.files[0];

    if (!audioFile) return;

    const audio = new Audio(URL.createObjectURL(audioFile));

    audio.onloadedmetadata = () => {

        const duration = audio.duration;

        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration % 3600) / 60);
        const seconds = Math.floor(duration % 60);

        audioInfo.innerHTML = `
            <b>Name :</b> ${audioFile.name}<br><br>

            <b>Size :</b> ${(audioFile.size / 1024 / 1024).toFixed(2)} MB<br><br>

            <b>Duration :</b> ${hours}h ${minutes}m ${seconds}s
        `;

    };

    checkFiles();

});

// =========================
// CREATE BUTTON
// =========================

createBtn.addEventListener("click", async () => {

    createBtn.disabled = true;

    createBtn.innerHTML = "Preparing...";

    // Fake Loading

    for (let i = 1; i <= 5; i++) {

        createBtn.innerHTML = "Preparing " + (i * 20) + "%";

        await new Promise(resolve => setTimeout(resolve, 500));

    }

    alert("Next Step : FFmpeg Integration");

    createBtn.innerHTML = "Create Video";

    createBtn.disabled = false;

});
