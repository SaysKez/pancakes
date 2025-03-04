// game.js

const video = document.getElementById('webcam');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

async function startWebcam() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
    } catch (error) {
        console.error('Error accessing webcam:', error);
    }
}

async function loadModels() {
    await faceapi.nets.tinyFaceDetector.loadFromUri('/pancakes/models');
    await faceapi.nets.faceLandmark68Net.loadFromUri('/pancakes/models');
}

let mouthPosition = { x: 320, y: 240 }; // Default position
let mouthOpen = false;

async function detectMouth() {
    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();
        const resizedDetections = faceapi.resizeResults(detections, displaySize);

        if (detections.length > 0) {
            const mouth = detections[0].landmarks.getMouth();
            const mouthX = mouth.reduce((sum, point) => sum + point.x, 0) / mouth.length;
            const mouthY = mouth.reduce((sum, point) => sum + point.y, 0) / mouth.length;
            mouthPosition = { x: mouthX, y: mouthY };

            // Calculate mouth openness
            const upperLip = mouth[13];
            const lowerLip = mouth[19];
            const mouthHeight = Math.abs(lowerLip.y - upperLip.y);
            mouthOpen = mouthHeight > 5; // Adjust threshold as needed
        }
    }, 100);
}

let score = 0;
let gameInterval;
let gameDuration = 30; // 1 minute
let objects = []; // Array to hold falling objects

function startGame() {
    score = 0;
    objects = [];
    gameInterval = setInterval(gameLoop, 1000 / 60); // 60 FPS
    setTimeout(endGame, gameDuration * 1000); // End game after 1 minute
}

function gameLoop() {
    drawWebcam();
    updateObjects();
    detectCollisions();
    drawObjects();
}

function drawWebcam() {
    ctx.save();
    ctx.scale(-1, 1); // Flip horizontally
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();
}

function updateObjects() {
    if (Math.random() < 0.02) {
        objects.push(createObject());
    }

    objects.forEach(obj => {
        obj.y += obj.speed;
    });

    objects = objects.filter(obj => obj.y < canvas.height);
}

function createObject() {
    const isCrepe = Math.random() < 0.7;
    return {
        x: Math.random() * canvas.width,
        y: 0,
        speed: 2 + Math.random() * 3,
        type: isCrepe ? 'crepe' : 'utensil'
    };
}

function detectCollisions() {
    const mouth = getMouthPosition();
    objects = objects.filter(obj => {
        if (isColliding(mouth, obj) && mouthOpen) {
            score += obj.type === 'crepe' ? 1 : -1;
            return false; // Remove the object after collision
        }
        return true;
    });
}

function isColliding(mouth, obj) {
    const mouthRadius = 30; // Increase radius for easier collision
    return Math.abs(mouth.x - obj.x) < mouthRadius && Math.abs(mouth.y - obj.y) < mouthRadius;
}

function drawObjects() {
    objects.forEach(obj => {
        ctx.fillStyle = obj.type === 'crepe' ? 'yellow' : 'gray';
        ctx.beginPath();
        ctx.arc(obj.x, obj.y, 10, 0, Math.PI * 2);
        ctx.fill();
    });
}

function endGame() {
    clearInterval(gameInterval);
    alert(`Game Over! Your score: ${score}\nHappy Pancaking!`);
}

function getMouthPosition() {
    return mouthPosition;
}

window.onload = async () => {
    await loadModels();
    startWebcam();
    detectMouth();
    startGame();
}; 