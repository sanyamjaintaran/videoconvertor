const createBtn = document.getElementById("createBtn");

let imageFile = null;
let audioFile = null;

createBtn.disabled = true;

function checkFiles() {
    createBtn.disabled = !(imageFile && audioFile);
}
const imageInput = document.getElementById("imageInput");

const audioInput = document.getElementById("audioInput");

const imagePreview = document.getElementById("imagePreview");

const audioInfo = document.getElementById("audioInfo");

imageInput.addEventListener("change",()=>{

const file=imageInput.files[0];

if(!file) return;

const reader=new FileReader();

reader.onload=function(e){

imagePreview.innerHTML=`<img src="${e.target.result}">`;

}

reader.readAsDataURL(file);

});

audioInput.addEventListener("change",()=>{

const file=audioInput.files[0];

if(!file) return;

audioInfo.innerHTML=`

<b>Name :</b> ${file.name}<br>

<b>Size :</b> ${(file.size/1024/1024).toFixed(2)} MB

`;

});
