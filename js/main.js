// ============================================
// WOMEN'S DAY SURPRISE - MAIN JAVASCRIPT
// ============================================

// ============================================
// PRE-LOADED PHOTOS MODE
// Simply add your photos to the images folder:
// - images/queen.jpg (the main opening photo)
// - images/balloon1.jpg through images/balloon8.jpg (8 balloon photos)
// ============================================

// Default photos (pre-loaded from images folder)
const DEFAULT_QUEEN_PHOTO = 'images/queen.jpg';
const DEFAULT_BALLOON_PHOTOS = [
    'images/balloon1.jpg',
    'images/balloon2.jpg',
    'images/balloon3.jpg',
    'images/balloon4.jpg',
    'images/balloon5.jpg',
    'images/balloon6.jpg',
    'images/balloon7.jpg',
    'images/balloon8.jpg'
];

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

// State - now using pre-loaded defaults
let queenPhoto = DEFAULT_QUEEN_PHOTO;
let balloonPhotos = [...DEFAULT_BALLOON_PHOTOS];
let poppedBalloons = 0;
let isViewerMode = true; // Always viewer mode now

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

// Share section elements (inline - kept for compatibility)
const shareSection = document.getElementById('shareSection');
const shareLink = document.getElementById('shareLink');
const copyBtn = document.getElementById('copyBtn');
const copyStatus = document.getElementById('copyStatus');
const viewPreviewBtn = document.getElementById('viewPreviewBtn');

// Share modal elements (popup)
const shareModal = document.getElementById('shareModal');
const shareModalBackdrop = document.getElementById('shareModalBackdrop');
const shareModalClose = document.getElementById('shareModalClose');
const shareModalLink = document.getElementById('shareModalLink');
const shareModalCopyBtn = document.getElementById('shareModalCopyBtn');
const shareModalCopyStatus = document.getElementById('shareModalCopyStatus');
const shareModalPreviewBtn = document.getElementById('shareModalPreviewBtn');

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

// Compress an image to reduce size for URL embedding
function compressImage(dataUrl) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            // Scale down if too large
            if (width > height && width > MAX_IMAGE_SIZE) {
                height = (height * MAX_IMAGE_SIZE) / width;
                width = MAX_IMAGE_SIZE;
            } else if (height > MAX_IMAGE_SIZE) {
                width = (width * MAX_IMAGE_SIZE) / height;
                height = MAX_IMAGE_SIZE;
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert to JPEG for smaller size
            resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
        };
        img.src = dataUrl;
    });
}

// Encode data for URL (using base64 and UTF-8 encoding)
function encodeDataForUrl(data) {
    try {
        const jsonStr = JSON.stringify(data);
        // Use TextEncoder for proper UTF-8 handling
        const encoder = new TextEncoder();
        const uint8Array = encoder.encode(jsonStr);
        // Convert to base64
        const binaryStr = Array.from(uint8Array).map(byte => String.fromCharCode(byte)).join('');
        const base64 = btoa(binaryStr);
        // Make URL-safe
        return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } catch (e) {
        console.error('Failed to encode data:', e);
        return null;
    }
}

// Decode data from URL
function decodeDataFromUrl(encoded) {
    try {
        // Restore base64 from URL-safe version
        let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
        // Add padding if needed
        while (base64.length % 4) {
            base64 += '=';
        }
        // Decode base64 to binary string
        const binaryStr = atob(base64);
        // Convert to Uint8Array and decode with TextDecoder
        const uint8Array = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
            uint8Array[i] = binaryStr.charCodeAt(i);
        }
        const decoder = new TextDecoder('utf-8');
        const jsonStr = decoder.decode(uint8Array);
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error('Failed to decode data:', e);
        return null;
    }
}

// Load data from URL hash
function loadFromUrlHash() {
    try {
        const hash = window.location.hash;
        if (hash && hash.startsWith('#data=')) {
            const encoded = hash.substring(6); // Remove '#data='
            const data = decodeDataFromUrl(encoded);
            if (data && data.queenPhoto && data.balloonPhotos) {
                queenPhoto = data.queenPhoto;
                balloonPhotos = data.balloonPhotos;
                return true;
            }
        }
    } catch (e) {
        console.error('Failed to load from URL:', e);
    }
    return false;
}

// Generate shareable link with embedded data
function generateShareLink() {
    // Handle edge cases with query params and hash fragments
    const baseUrl = window.location.href.split('?')[0].split('#')[0];
    
    // Create data object with compressed images
    const data = {
        queenPhoto: queenPhoto,
        balloonPhotos: balloonPhotos
    };
    
    const encoded = encodeDataForUrl(data);
    if (encoded) {
        return baseUrl + '?view=surprise#data=' + encoded;
    }
    
    // Fallback to localStorage-based link
    return baseUrl + '?view=surprise';
}

// Initialize - Now always shows the surprise directly with pre-loaded photos
document.addEventListener('DOMContentLoaded', () => {
    // Always in viewer mode with pre-loaded photos
    isViewerMode = true;
    
    // Use default pre-loaded photos
    queenPhoto = DEFAULT_QUEEN_PHOTO;
    balloonPhotos = [...DEFAULT_BALLOON_PHOTOS];
    
    // Hide setup screen and show opening screen directly
    setupScreen.classList.add('hidden');
    setupViewerEventListeners();
    showSurpriseExperience();
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
    openingContent.textContent = '';
    
    const crownDiv = document.createElement('div');
    crownDiv.className = 'crown-emoji';
    crownDiv.textContent = '💔';
    
    const heading = document.createElement('h1');
    heading.className = 'glitter-text';
    heading.textContent = 'Oops!';
    
    const subtitle = document.createElement('p');
    subtitle.className = 'opening-subtitle';
    subtitle.textContent = 'No surprise has been created yet. Ask your special someone to set it up first! 💕';
    
    openingContent.appendChild(crownDiv);
    openingContent.appendChild(heading);
    openingContent.appendChild(subtitle);
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
    
    // Share modal event listeners
    if (shareModalClose) {
        shareModalClose.addEventListener('click', closeShareModal);
    }
    if (shareModalBackdrop) {
        shareModalBackdrop.addEventListener('click', closeShareModal);
    }
    if (shareModalCopyBtn) {
        shareModalCopyBtn.addEventListener('click', copyShareModalLink);
    }
    if (shareModalPreviewBtn) {
        shareModalPreviewBtn.addEventListener('click', previewFromModal);
    }
}

// Copy share link to clipboard
function copyShareLink() {
    if (shareLink) {
        shareLink.select();
        shareLink.setSelectionRange(0, 99999); // For mobile
        
        navigator.clipboard.writeText(shareLink.value).then(() => {
            showCopySuccess();
        }).catch(err => {
            // Fallback: try execCommand for older browsers, but handle failure gracefully
            console.warn('Clipboard API failed, trying fallback:', err);
            try {
                const success = document.execCommand('copy');
                if (success) {
                    showCopySuccess();
                } else {
                    showCopyFailure();
                }
            } catch (fallbackErr) {
                console.error('Copy failed:', fallbackErr);
                showCopyFailure();
            }
        });
    }
}

// Show copy success message
function showCopySuccess() {
    copyStatus.textContent = '✅ Link copied!';
    copyStatus.classList.remove('hidden');
    setTimeout(() => {
        copyStatus.classList.add('hidden');
    }, 3000);
}

// Show copy failure message
function showCopyFailure() {
    copyStatus.textContent = '❌ Copy failed - please copy manually';
    copyStatus.classList.remove('hidden');
    setTimeout(() => {
        copyStatus.classList.add('hidden');
    }, 3000);
}

// View surprise preview (admin preview)
function viewSurprisePreview() {
    window.open(generateShareLink(), '_blank');
}

// Close share modal
function closeShareModal() {
    shareModal.classList.add('hidden');
    // Return focus to the create button for accessibility
    if (createBtn) {
        createBtn.focus();
    }
}

// Copy link from share modal
function copyShareModalLink() {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareModalLink.value).then(() => {
            showModalCopySuccess();
        }).catch((err) => {
            console.error('Failed to copy:', err);
            fallbackModalCopy();
        });
    } else {
        fallbackModalCopy();
    }
}

// Fallback copy for share modal
function fallbackModalCopy() {
    try {
        shareModalLink.select();
        shareModalLink.setSelectionRange(0, 99999);
        const success = document.execCommand('copy');
        if (success) {
            showModalCopySuccess();
        } else {
            showModalCopyFailure();
        }
    } catch (err) {
        console.error('Fallback copy failed:', err);
        showModalCopyFailure();
    }
}

// Show copy success in modal
function showModalCopySuccess() {
    shareModalCopyStatus.textContent = '✅ Link copied to clipboard!';
    shareModalCopyStatus.classList.remove('hidden');
    
    // Update button temporarily
    const originalText = shareModalCopyBtn.innerHTML;
    shareModalCopyBtn.innerHTML = '<span class="copy-icon">✅</span><span class="copy-text">Copied!</span>';
    
    setTimeout(() => {
        shareModalCopyStatus.classList.add('hidden');
        shareModalCopyBtn.innerHTML = originalText;
    }, 3000);
}

// Show copy failure in modal
function showModalCopyFailure() {
    shareModalCopyStatus.textContent = '❌ Copy failed - please copy manually';
    shareModalCopyStatus.classList.remove('hidden');
    setTimeout(() => {
        shareModalCopyStatus.classList.add('hidden');
    }, 3000);
}

// Preview surprise from modal
function previewFromModal() {
    window.open(shareModalLink.value, '_blank');
}

// Create surprise (save data and show share link modal)
function createSurprise() {
    // Save to localStorage
    if (saveToLocalStorage()) {
        // Generate the share link
        const link = generateShareLink();
        
        // Show the modal popup
        shareModal.classList.remove('hidden');
        
        // Set the link in the modal
        shareModalLink.value = link;
        
        // Focus on the copy button for accessibility
        if (shareModalCopyBtn) {
            setTimeout(() => shareModalCopyBtn.focus(), 100);
        }
        
        // Also update inline share section (for compatibility)
        shareSection.classList.remove('hidden');
        shareLink.value = link;
        
        // Disable create button and show success
        createBtn.textContent = '✅ Surprise Created!';
        createBtn.disabled = true;
    } else {
        alert('Failed to save surprise. Please try again.');
    }
}

// Handle queen photo upload
function handleQueenPhotoUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
            // Compress the image for URL embedding
            const compressed = await compressImage(event.target.result);
            queenPhoto = compressed;
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
        reader.onload = async (event) => {
            // Compress the image for URL embedding
            const compressed = await compressImage(event.target.result);
            balloonPhotos[index] = compressed;
            
            // Update preview
            const slot = e.target.closest('.balloon-upload-slot');
            slot.classList.add('uploaded');
            
            // Remove existing preview if any
            const existingImg = slot.querySelector('img');
            if (existingImg) existingImg.remove();
            
            const img = document.createElement('img');
            img.src = compressed;
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
