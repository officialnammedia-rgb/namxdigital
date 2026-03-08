// ============================================
// WOMEN'S DAY SURPRISE - MAIN JAVASCRIPT
// ============================================

// Storage key for localStorage
const STORAGE_KEY = 'womens_day_surprise_data';

// Messages for each balloon
const messages = [
    "You're the most incredible woman I know — strong, beautiful, and endlessly loved.",
    "Every day with you feels like a dream I never want to wake up from.",
    "You had me at hello… and every single moment since then too!",
    "You make me a better person just by being you. I'm so lucky you're mine.",
    "Here's to every adventure, laugh, and memory still ahead of us — I can't wait.",
    "You're my favorite notification, my favorite distraction, my favorite everything.",
    "Loving you is the easiest thing I've ever done. And I'd choose it every time.",
    "In a world full of noise, you're the only voice that makes everything feel calm."
];

// Balloon colors
const balloonColors = ['pink', 'red', 'lilac', 'peach', 'white', 'rose-gold', 'lavender', 'coral'];

// State
let queenPhoto = null;
let balloonPhotos = new Array(8).fill(null);
let poppedBalloons = 0;
let isViewerMode = false;

// Interval IDs for cleanup
let petalsIntervalId = null;
let roseRainIntervalId = null;

// Reusable AudioContext for pop sounds
let audioContext = null;

// DOM Elements
const setupScreen = document.getElementById('setupScreen');
const openingScreen = document.getElementById('openingScreen');
const balloonScreen = document.getElementById('balloonScreen');
const finalScreen = document.getElementById('finalScreen');
const revealModal = document.getElementById('revealModal');

const queenPhotoInput = document.getElementById('queenPhoto');
const queenPreview = document.getElementById('queenPreview');
const createBtn = document.getElementById('createBtn');
const startBtn = document.getElementById('startBtn');
const closeRevealBtn = document.getElementById('closeReveal');

const balloonsContainer = document.getElementById('balloonsContainer');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');

const revealPhoto = document.getElementById('revealPhoto');
const revealMessage = document.getElementById('revealMessage');

const bgMusic = document.getElementById('bgMusic');
const musicToggle = document.getElementById('musicToggle');

// Share section elements
const shareSection = document.getElementById('shareSection');
const shareLink = document.getElementById('shareLink');
const copyBtn = document.getElementById('copyBtn');
const copyStatus = document.getElementById('copyStatus');
const viewPreviewBtn = document.getElementById('viewPreviewBtn');

// Check URL parameters
function checkViewMode() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('view') === 'surprise';
}

// Save data to localStorage
function saveToLocalStorage() {
    const data = {
        queenPhoto: queenPhoto,
        balloonPhotos: balloonPhotos,
        timestamp: Date.now()
    };
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return true;
    } catch (e) {
        console.error('Failed to save to localStorage:', e);
        return false;
    }
}

// Load data from localStorage
function loadFromLocalStorage() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            if (parsed.queenPhoto && parsed.balloonPhotos) {
                queenPhoto = parsed.queenPhoto;
                balloonPhotos = parsed.balloonPhotos;
                return true;
            }
        }
    } catch (e) {
        console.error('Failed to load from localStorage:', e);
    }
    return false;
}

// Generate shareable link
function generateShareLink() {
    const baseUrl = window.location.origin + window.location.pathname;
    return baseUrl + '?view=surprise';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    isViewerMode = checkViewMode();
    
    if (isViewerMode) {
        // Viewer mode: Load photos from localStorage and start surprise
        const hasData = loadFromLocalStorage();
        if (hasData) {
            // Hide setup screen and show opening screen directly
            setupScreen.classList.add('hidden');
            setupViewerEventListeners();
            showSurpriseExperience();
        } else {
            // No data found - show message
            showNoSurpriseMessage();
        }
    } else {
        // Admin mode: Show setup screen
        createBalloonUploadSlots();
        createAmbientElements();
        setupEventListeners();
        
        // Check if there's already saved data
        if (loadFromLocalStorage()) {
            updatePreviewsFromSavedData();
            checkAllPhotosUploaded();
        }
    }
});

// Setup event listeners for viewer mode (only essential listeners)
function setupViewerEventListeners() {
    // Start popping button
    startBtn.addEventListener('click', showBalloonScreen);
    
    // Close reveal modal
    closeRevealBtn.addEventListener('click', closeReveal);
    
    // Music toggle
    musicToggle.addEventListener('click', toggleMusic);
    
    // Sparkle effect on balloon hover
    document.addEventListener('mousemove', handleSparkleEffect);
}

// Show message when no surprise data is found
function showNoSurpriseMessage() {
    setupScreen.classList.add('hidden');
    openingScreen.classList.remove('hidden');
    
    const openingContent = document.querySelector('.opening-content');
    openingContent.innerHTML = `
        <div class="crown-emoji">💔</div>
        <h1 class="glitter-text">Oops!</h1>
        <p class="opening-subtitle">No surprise has been created yet. Ask your special someone to set it up first! 💕</p>
    `;
}

// Show the surprise experience (for viewer mode)
function showSurpriseExperience() {
    setTimeout(() => {
        openingScreen.classList.remove('hidden');
        
        // Display queen photo
        const queenDisplay = document.getElementById('queenPhotoDisplay');
        queenDisplay.innerHTML = '';
        const img = document.createElement('img');
        img.src = queenPhoto;
        img.alt = 'My Queen';
        queenDisplay.appendChild(img);
        
        // Start falling petals
        startPetals();
        
        // Start music
        playMusic();
    }, 300);
}

// Update previews from saved data (admin mode)
function updatePreviewsFromSavedData() {
    // Update queen photo preview
    if (queenPhoto) {
        queenPreview.innerHTML = '';
        const img = document.createElement('img');
        img.src = queenPhoto;
        img.alt = 'Queen Photo';
        queenPreview.appendChild(img);
    }
    
    // Update balloon photo previews
    balloonPhotos.forEach((photo, index) => {
        if (photo) {
            const slot = document.querySelector(`.balloon-upload-slot:nth-child(${index + 1})`);
            if (slot) {
                slot.classList.add('uploaded');
                
                const existingImg = slot.querySelector('img');
                if (existingImg) existingImg.remove();
                
                const img = document.createElement('img');
                img.src = photo;
                img.alt = `Balloon ${index + 1} Photo`;
                slot.appendChild(img);
            }
        }
    });
}

// Create balloon upload slots
function createBalloonUploadSlots() {
    const grid = document.querySelector('.balloon-upload-grid');
    for (let i = 0; i < 8; i++) {
        const slot = document.createElement('div');
        slot.className = 'balloon-upload-slot';
        slot.innerHTML = `
            <label for="balloonPhoto${i}">
                <span>🎈</span>
                <span class="slot-number">#${i + 1}</span>
                <input type="file" id="balloonPhoto${i}" accept="image/*" hidden data-index="${i}">
            </label>
        `;
        grid.appendChild(slot);
    }
    
    // Add event listeners for balloon photo uploads
    for (let i = 0; i < 8; i++) {
        const input = document.getElementById(`balloonPhoto${i}`);
        input.addEventListener('change', handleBalloonPhotoUpload);
    }
}

// Create ambient floating hearts and stars
function createAmbientElements() {
    const ambient = document.getElementById('ambient');
    const elements = ['💕', '✨', '💗', '⭐', '💖', '🌟', '💝', '✨'];
    
    for (let i = 0; i < 20; i++) {
        const el = document.createElement('span');
        el.className = i % 2 === 0 ? 'ambient-heart' : 'ambient-star';
        el.textContent = elements[Math.floor(Math.random() * elements.length)];
        el.style.left = Math.random() * 100 + '%';
        el.style.top = Math.random() * 100 + '%';
        el.style.animationDelay = Math.random() * 5 + 's';
        el.style.animationDuration = (5 + Math.random() * 5) + 's';
        ambient.appendChild(el);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Queen photo upload
    queenPhotoInput.addEventListener('change', handleQueenPhotoUpload);
    
    // Create surprise button
    createBtn.addEventListener('click', createSurprise);
    
    // Start popping button
    startBtn.addEventListener('click', showBalloonScreen);
    
    // Close reveal modal
    closeRevealBtn.addEventListener('click', closeReveal);
    
    // Music toggle
    musicToggle.addEventListener('click', toggleMusic);
    
    // Sparkle effect on balloon hover
    document.addEventListener('mousemove', handleSparkleEffect);
    
    // Copy link button
    if (copyBtn) {
        copyBtn.addEventListener('click', copyShareLink);
    }
    
    // View preview button
    if (viewPreviewBtn) {
        viewPreviewBtn.addEventListener('click', viewSurprisePreview);
    }
}

// Copy share link to clipboard
function copyShareLink() {
    if (shareLink) {
        shareLink.select();
        shareLink.setSelectionRange(0, 99999); // For mobile
        
        navigator.clipboard.writeText(shareLink.value).then(() => {
            copyStatus.classList.remove('hidden');
            setTimeout(() => {
                copyStatus.classList.add('hidden');
            }, 3000);
        }).catch(err => {
            // Fallback for older browsers
            document.execCommand('copy');
            copyStatus.classList.remove('hidden');
            setTimeout(() => {
                copyStatus.classList.add('hidden');
            }, 3000);
        });
    }
}

// View surprise preview (admin preview)
function viewSurprisePreview() {
    window.open(generateShareLink(), '_blank');
}

// Create surprise (save data and show share link)
function createSurprise() {
    // Save to localStorage
    if (saveToLocalStorage()) {
        // Show share section
        shareSection.classList.remove('hidden');
        
        // Generate and display share link
        shareLink.value = generateShareLink();
        
        // Disable create button and show success
        createBtn.textContent = '✅ Surprise Created!';
        createBtn.disabled = true;
        
        // Scroll to share section
        shareSection.scrollIntoView({ behavior: 'smooth' });
    } else {
        alert('Failed to save surprise. Please try again.');
    }
}

// Handle queen photo upload
function handleQueenPhotoUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            queenPhoto = event.target.result;
            queenPreview.innerHTML = '';
            const img = document.createElement('img');
            img.src = queenPhoto;
            img.alt = 'Queen Photo';
            queenPreview.appendChild(img);
            checkAllPhotosUploaded();
        };
        reader.readAsDataURL(file);
    }
}

// Handle balloon photo upload
function handleBalloonPhotoUpload(e) {
    const file = e.target.files[0];
    const index = parseInt(e.target.dataset.index);
    
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            balloonPhotos[index] = event.target.result;
            
            // Update preview
            const slot = e.target.closest('.balloon-upload-slot');
            slot.classList.add('uploaded');
            
            // Remove existing preview if any
            const existingImg = slot.querySelector('img');
            if (existingImg) existingImg.remove();
            
            const img = document.createElement('img');
            img.src = event.target.result;
            img.alt = `Balloon ${index + 1} Photo`;
            slot.appendChild(img);
            
            checkAllPhotosUploaded();
        };
        reader.readAsDataURL(file);
    }
}

// Check if all photos are uploaded
function checkAllPhotosUploaded() {
    const allBalloonPhotosUploaded = balloonPhotos.every(photo => photo !== null);
    const allUploaded = queenPhoto !== null && allBalloonPhotosUploaded;
    
    createBtn.disabled = !allUploaded;
}

// Start falling petals animation
function startPetals() {
    const petalsContainer = document.getElementById('petals');
    const petalEmojis = ['🌹', '🌸', '💮', '🏵️', '🌺'];
    
    // Clear any existing interval
    if (petalsIntervalId) {
        clearInterval(petalsIntervalId);
    }
    
    function createPetal() {
        const petal = document.createElement('span');
        petal.className = 'petal';
        petal.textContent = petalEmojis[Math.floor(Math.random() * petalEmojis.length)];
        petal.style.left = Math.random() * 100 + '%';
        petal.style.animationDuration = (3 + Math.random() * 4) + 's';
        petal.style.fontSize = (1 + Math.random()) + 'rem';
        petalsContainer.appendChild(petal);
        
        // Remove petal after animation
        setTimeout(() => petal.remove(), 7000);
    }
    
    // Create petals continuously
    petalsIntervalId = setInterval(createPetal, 300);
}

// Show balloon screen
function showBalloonScreen() {
    openingScreen.classList.add('hidden');
    
    // Clear petals interval to prevent memory leak
    if (petalsIntervalId) {
        clearInterval(petalsIntervalId);
        petalsIntervalId = null;
    }
    
    setTimeout(() => {
        balloonScreen.classList.remove('hidden');
        createBalloons();
    }, 300);
}

// Create balloons
function createBalloons() {
    balloonsContainer.innerHTML = '';
    
    for (let i = 0; i < 8; i++) {
        const balloon = document.createElement('div');
        balloon.className = 'balloon';
        balloon.dataset.index = i;
        balloon.dataset.color = balloonColors[i];
        
        balloon.innerHTML = `
            <div class="balloon-body">${i + 1}</div>
            <div class="balloon-string"></div>
        `;
        
        balloon.addEventListener('click', () => popBalloon(i));
        balloonsContainer.appendChild(balloon);
    }
}

// Pop balloon
function popBalloon(index) {
    const balloon = balloonsContainer.querySelector(`[data-index="${index}"]`);
    
    if (balloon.classList.contains('popped')) return;
    
    // Add pop animation
    balloon.classList.add('popped');
    
    // Play pop sound effect (using Web Audio API for a quick pop)
    playPopSound();
    
    // Update progress
    poppedBalloons++;
    updateProgress();
    
    // Show reveal after pop animation
    setTimeout(() => {
        showReveal(index);
    }, 300);
}

// Play pop sound
function playPopSound() {
    // Reuse AudioContext to avoid creating too many instances
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    // Resume context if it was suspended (autoplay policy)
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}

// Update progress bar
function updateProgress() {
    const percentage = (poppedBalloons / 8) * 100;
    progressFill.style.width = percentage + '%';
    progressText.textContent = `${poppedBalloons}/8 popped`;
}

// Show reveal modal
function showReveal(index) {
    revealModal.classList.remove('hidden');
    
    // Set photo using createElement for security
    revealPhoto.innerHTML = '';
    const img = document.createElement('img');
    img.src = balloonPhotos[index];
    img.alt = 'Surprise Photo';
    revealPhoto.appendChild(img);
    
    // Set message
    revealMessage.textContent = messages[index];
    
    // Create confetti
    createConfetti();
    
    // Animate card
    const card = document.getElementById('revealCard');
    card.style.animation = 'none';
    setTimeout(() => {
        card.style.animation = 'slide-in 0.5s ease';
    }, 10);
}

// Create confetti
function createConfetti() {
    const confettiContainer = document.getElementById('confetti');
    confettiContainer.innerHTML = '';
    
    const colors = ['#ff69b4', '#ffd700', '#ff85c0', '#ffb6c1', '#ffc0cb', '#e8b4b8'];
    const shapes = ['circle', 'square', 'rectangle'];
    
    for (let i = 0; i < 80; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        
        const color = colors[Math.floor(Math.random() * colors.length)];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.top = '-20px';
        confetti.style.backgroundColor = color;
        confetti.style.animationDuration = (2 + Math.random() * 2) + 's';
        confetti.style.animationDelay = Math.random() * 0.5 + 's';
        
        if (shape === 'circle') {
            confetti.style.borderRadius = '50%';
        } else if (shape === 'rectangle') {
            confetti.style.width = '5px';
            confetti.style.height = '15px';
        }
        
        confettiContainer.appendChild(confetti);
    }
}

// Close reveal modal
function closeReveal() {
    revealModal.classList.add('hidden');
    
    // Check if all balloons are popped
    if (poppedBalloons === 8) {
        setTimeout(showFinalScreen, 500);
    }
}

// Show final screen
function showFinalScreen() {
    balloonScreen.classList.add('hidden');
    
    setTimeout(() => {
        finalScreen.classList.remove('hidden');
        startRoseRain();
    }, 300);
}

// Start rose rain animation
function startRoseRain() {
    const roseContainer = document.getElementById('roseRain');
    const roseEmojis = ['🌹', '💐', '🌷', '🌸', '💕', '💖'];
    
    // Clear any existing interval
    if (roseRainIntervalId) {
        clearInterval(roseRainIntervalId);
    }
    
    function createRose() {
        const rose = document.createElement('span');
        rose.className = 'rose';
        rose.textContent = roseEmojis[Math.floor(Math.random() * roseEmojis.length)];
        rose.style.left = Math.random() * 100 + '%';
        rose.style.animationDuration = (4 + Math.random() * 4) + 's';
        rose.style.fontSize = (1 + Math.random() * 1.5) + 'rem';
        roseContainer.appendChild(rose);
        
        // Remove rose after animation
        setTimeout(() => rose.remove(), 8000);
    }
    
    // Create roses continuously
    roseRainIntervalId = setInterval(createRose, 200);
}

// Handle sparkle effect on balloon hover
let lastSparkleTime = 0;
function handleSparkleEffect(e) {
    const now = Date.now();
    if (now - lastSparkleTime < 100) return;
    
    // Only create sparkles when hovering over balloons
    const balloon = e.target.closest('.balloon');
    if (!balloon || balloon.classList.contains('popped')) return;
    
    lastSparkleTime = now;
    
    const sparkle = document.createElement('span');
    sparkle.className = 'sparkle';
    sparkle.textContent = '✨';
    sparkle.style.left = e.clientX + 'px';
    sparkle.style.top = e.clientY + 'px';
    document.body.appendChild(sparkle);
    
    setTimeout(() => sparkle.remove(), 600);
}

// Music controls
function playMusic() {
    bgMusic.volume = 0.3;
    bgMusic.play().then(() => {
        musicToggle.textContent = '🔊';
        musicToggle.classList.add('playing');
    }).catch(err => {
        console.log('Autoplay blocked, user interaction required');
    });
}

function toggleMusic() {
    if (bgMusic.paused) {
        bgMusic.play().then(() => {
            musicToggle.textContent = '🔊';
            musicToggle.classList.add('playing');
        });
    } else {
        bgMusic.pause();
        musicToggle.textContent = '🔇';
        musicToggle.classList.remove('playing');
    }
}
