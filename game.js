// game.js

const canvas = document.getElementById('gameCanvas');

async function startWebcam() {
    const video = document.getElementById('webcam');
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

async function detectMouth() {
    const video = document.getElementById('webcam');
    const canvas = document.getElementById('gameCanvas');
    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

        // Extract mouth position from landmarks
        if (detections.length > 0) {
            const mouth = detections[0].landmarks.getMouth();
            // Calculate the average position of the mouth points
            const mouthX = mouth.reduce((sum, point) => sum + point.x, 0) / mouth.length;
            const mouthY = mouth.reduce((sum, point) => sum + point.y, 0) / mouth.length;
            mouthPosition = { x: mouthX, y: mouthY };
        }
    }, 100);
}

let score = 0;
let gameInterval;
let gameDuration = 60; // 1 minute
let objects = []; // Array to hold falling objects

function startGame() {
    score = 0;
    objects = [];
    gameInterval = setInterval(gameLoop, 1000 / 60); // 60 FPS
    setTimeout(endGame, gameDuration * 1000); // End game after 1 minute
    console.log("Game started");
}

function gameLoop() {
    updateObjects();
    detectCollisions();
    drawObjects();
}

function updateObjects() {
    // Add new objects at random intervals
    if (Math.random() < 0.02) {
        const newObj = createObject();
        objects.push(newObj);
        console.log("New object created:", newObj);
    }

    // Update position of each object
    objects.forEach(obj => {
        obj.y += obj.speed;
        console.log("Object updated:", obj);
    });

    // Remove objects that have fallen off the screen
    objects = objects.filter(obj => obj.y < canvas.height);
}

function createObject() {
    const isCrepe = Math.random() < 0.7; // 70% chance of being a crepe
    return {
        x: Math.random() * canvas.width,
        y: 0,
        speed: 2 + Math.random() * 3, // Random speed
        type: isCrepe ? 'crepe' : 'utensil'
    };
}

function detectCollisions() {
    const mouth = getMouthPosition(); // Implement this function to get mouth position
    objects.forEach(obj => {
        if (isColliding(mouth, obj)) {
            if (obj.type === 'crepe') {
                score++;
            } else {
                score--;
            }
            // Remove the object after collision
            obj.y = canvas.height + 1;
        }
    });
}

function isColliding(mouth, obj) {
    // Simple collision detection logic
    const mouthRadius = 20; // Adjust as needed
    return Math.abs(mouth.x - obj.x) < mouthRadius && Math.abs(mouth.y - obj.y) < mouthRadius;
}

function drawObjects() {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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
    // Optionally, add a play-again button or restart the game
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