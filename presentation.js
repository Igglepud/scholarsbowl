// Presentation configuration
let presentationData = null;
let currentSlide = 0;
let currentBullet = -1;

// Three.js scene setup
let scene, camera, renderer;
let stars = [];
let textParticles = [];
const PARTICLE_COUNT = 50000;
const BACKGROUND_STARS = 300;

// Animation state
let isAnimating = false;
let animationProgress = 0;
let particleOpacity = 1.0;
let targetParticleOpacity = 1.0;
let isMorphingToFinal = false;
let animationStartTime = 0;
let nextParticleIndex = 0; // Track which particles are already assigned

// Initialize the application
async function init() {
    // Load presentation content
    await loadPresentationData();
    
    // Setup Three.js
    setupScene();
    setupCamera();
    setupRenderer();
    
    // Create space environment
    createBackgroundStars();
    createTextParticles();
    
    // Setup interaction
    setupEventListeners();
    
    // Hide loading screen
    document.getElementById('loading').style.display = 'none';
    
    // Start animation loop
    animate();
    
    // Show first slide
    nextSlide();
}

// Load presentation content from JSON
async function loadPresentationData() {
    try {
        const response = await fetch('content.json');
        presentationData = await response.json();
    } catch (error) {
        console.error('Error loading presentation data:', error);
        presentationData = {
            title: "SCHOLARS BOWL",
            slides: [{
                topic: "ERROR",
                bullets: ["COULD NOT LOAD CONTENT"]
            }]
        };
    }
}

// Create circular sprite texture for spherical particles with intense glow
function createCircleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    const center = 32;
    
    // Single smooth gradient for clean circular glow
    const gradient = ctx.createRadialGradient(center, center, 0, center, center, 32);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.15, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.4, 'rgba(255,255,255,0.6)');
    gradient.addColorStop(0.7, 'rgba(255,255,255,0.2)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

// Setup Three.js scene
function setupScene() {
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.0003);
}

// Setup camera
function setupCamera() {
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        10000
    );
    camera.position.z = 500;
}

// Setup renderer
function setupRenderer() {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000);
    document.body.appendChild(renderer.domElement);
}

// Create background stars for the space effect
function createBackgroundStars() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(BACKGROUND_STARS * 3);
    const colors = new Float32Array(BACKGROUND_STARS * 3);
    
    for (let i = 0; i < BACKGROUND_STARS; i++) {
        const i3 = i * 3;
        
        // Random position in a large sphere
        const radius = Math.random() * 3000 + 500;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        
        positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i3 + 2] = radius * Math.cos(phi);
        
        // Slight color variation (mostly white with blue/purple tint)
        const colorVariation = Math.random();
        colors[i3] = 0.8 + Math.random() * 0.2;     // R
        colors[i3 + 1] = 0.8 + Math.random() * 0.2; // G
        colors[i3 + 2] = 0.9 + Math.random() * 0.1; // B
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
        size: 3,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true,
        map: createCircleTexture()
    });
    
    const starField = new THREE.Points(geometry, material);
    scene.add(starField);
    
    // Store for rotation
    stars.push(starField);
}

// Create particles that will form text
function createTextParticles() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const originalPositions = new Float32Array(PARTICLE_COUNT * 3);
    const targetPositions = new Float32Array(PARTICLE_COUNT * 3);
    const finalTargetPositions = new Float32Array(PARTICLE_COUNT * 3);
    const velocities = new Float32Array(PARTICLE_COUNT * 3);
    const delays = new Float32Array(PARTICLE_COUNT); // Animation delay for each particle
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    
    // Initialize particles in random positions
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        const randomPos = (Math.random() - 0.5) * 2000;
        positions[i3] = randomPos;
        positions[i3 + 1] = (Math.random() - 0.5) * 2000;
        positions[i3 + 2] = (Math.random() - 0.5) * 2000;
        originalPositions[i3] = positions[i3];
        originalPositions[i3 + 1] = positions[i3 + 1];
        originalPositions[i3 + 2] = positions[i3 + 2];
        targetPositions[i3] = positions[i3];
        targetPositions[i3 + 1] = positions[i3 + 1];
        targetPositions[i3 + 2] = positions[i3 + 2];
        velocities[i3] = 0;
        velocities[i3 + 1] = 0;
        velocities[i3 + 2] = 0;
        delays[i] = Math.random() * 1.5; // Random delay 0-1.5 seconds for staggered arrival
        
        // Color variation (white to cyan/blue)
        colors[i3] = 0.7 + Math.random() * 0.3;
        colors[i3 + 1] = 0.8 + Math.random() * 0.2;
        colors[i3 + 2] = 1.0;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('originalPosition', new THREE.BufferAttribute(originalPositions, 3));
    geometry.setAttribute('targetPosition', new THREE.BufferAttribute(targetPositions, 3));
    geometry.setAttribute('finalTargetPosition', new THREE.BufferAttribute(finalTargetPositions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('delay', new THREE.BufferAttribute(delays, 1));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
        size: 6,
        transparent: true,
        opacity: 1,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        vertexColors: false,
        color: 0xffffff,
        depthWrite: false,
        map: createCircleTexture()
    });
    
    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    
    textParticles.push(particles);
}

// Convert text to particle positions
function textToParticles(text, yOffset = 0, tight = false, fontSize = 70) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Setup canvas - wider to accommodate long text
    canvas.width = 2048;
    canvas.height = 256;
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw text
    ctx.fillStyle = 'white';
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    
    // Get pixel data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    
    // Find white pixels
    const points = [];
    const step = tight ? 3 : 4; // Tighter sampling for final position
    
    for (let y = 0; y < canvas.height; y += step) {
        for (let x = 0; x < canvas.width; x += step) {
            const i = (y * canvas.width + x) * 4;
            if (pixels[i] > 128) { // If pixel is bright enough
                // Convert to 3D coordinates
                const px = (x - canvas.width / 2) * 0.8;
                const py = (canvas.height / 2 - y) * 0.8 + yOffset;
                const pz = tight ? -50 : 0; // Original position
                points.push({ x: px, y: py, z: pz });
            }
        }
    }
    
    return points;
}

// Animate particles to form text
function formText(texts, setFinalTarget = true) {
    const particles = textParticles[0];
    const positions = particles.geometry.attributes.position.array;
    const targetPositions = particles.geometry.attributes.targetPosition.array;
    const finalTargetPositions = particles.geometry.attributes.finalTargetPosition.array;
    
    // Calculate text positions with proper vertical offset for each line
    let allPoints = [];
    const spacing = 64; // Vertical spacing between lines
    const slide = presentationData.slides[currentSlide];
    
    // Position each text line separately with proper spacing
    texts.forEach((text, index) => {
        // Each line gets its own Y offset: 0 at -35, 1 at -99, 2 at -163, etc.
        const yOffset = -35 - (index * spacing);
        const points = textToParticles(text, yOffset, false);
        allPoints = allPoints.concat(points);
    });
    
    // Calculate tight final positions
    let allFinalPoints = [];
    if (setFinalTarget) {
        texts.forEach((text, index) => {
            const yOffset = -35 - (index * spacing);
            const points = textToParticles(text, yOffset, true);
            allFinalPoints = allFinalPoints.concat(points);
        });
    }
    
    // Distribute particles to target positions
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        
        if (i < allPoints.length) {
            // Particle has a target position in the text
            targetPositions[i3] = allPoints[i].x;
            targetPositions[i3 + 1] = allPoints[i].y;
            targetPositions[i3 + 2] = allPoints[i].z;
            
            if (setFinalTarget && i < allFinalPoints.length) {
                finalTargetPositions[i3] = allFinalPoints[i].x;
                finalTargetPositions[i3 + 1] = allFinalPoints[i].y;
                finalTargetPositions[i3 + 2] = allFinalPoints[i].z;
            } else {
                finalTargetPositions[i3] = targetPositions[i3];
                finalTargetPositions[i3 + 1] = targetPositions[i3 + 1];
                finalTargetPositions[i3 + 2] = targetPositions[i3 + 2];
            }
        } else {
            // Extra particles stay far off-screen and invisible
            const direction = Math.floor(Math.random() * 4);
            switch(direction) {
                case 0: // Far left
                    targetPositions[i3] = -(3000 + Math.random() * 1000);
                    targetPositions[i3 + 1] = (Math.random() - 0.5) * 2000;
                    break;
                case 1: // Far right
                    targetPositions[i3] = (3000 + Math.random() * 1000);
                    targetPositions[i3 + 1] = (Math.random() - 0.5) * 2000;
                    break;
                case 2: // Far top
                    targetPositions[i3] = (Math.random() - 0.5) * 2000;
                    targetPositions[i3 + 1] = (1500 + Math.random() * 1000);
                    break;
                case 3: // Far bottom
                    targetPositions[i3] = (Math.random() - 0.5) * 2000;
                    targetPositions[i3 + 1] = -(1500 + Math.random() * 1000);
                    break;
            }
            targetPositions[i3 + 2] = -(1000 + Math.random() * 500);
            finalTargetPositions[i3] = targetPositions[i3];
            finalTargetPositions[i3 + 1] = targetPositions[i3 + 1];
            finalTargetPositions[i3 + 2] = targetPositions[i3 + 2];
        }
    }
    
    particles.geometry.attributes.targetPosition.needsUpdate = true;
    particles.geometry.attributes.finalTargetPosition.needsUpdate = true;
}

// Scatter particles randomly with swirl effect
function scatterParticles() {
    const particles = textParticles[0];
    const positions = particles.geometry.attributes.position.array;
    const targetPositions = particles.geometry.attributes.targetPosition.array;
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        
        // Position particles in a circle around the screen (360 degrees)
        const angle = Math.random() * Math.PI * 2; // Random angle 0 to 2π
        const distance = 2500 + Math.random() * 1500; // Distance from center
        
        const offscreenX = Math.cos(angle) * distance;
        const offscreenY = Math.sin(angle) * distance;
        const offscreenZ = (Math.random() - 0.5) * 500 - 800;
        
        // Set both current position and target position to off-screen
        // so particles immediately jump off-screen
        positions[i3] = offscreenX;
        positions[i3 + 1] = offscreenY;
        positions[i3 + 2] = offscreenZ;
        
        targetPositions[i3] = offscreenX;
        targetPositions[i3 + 1] = offscreenY;
        targetPositions[i3 + 2] = offscreenZ;
    }
    
    particles.geometry.attributes.position.needsUpdate = true;
    particles.geometry.attributes.targetPosition.needsUpdate = true;
}

// Move particles smoothly off-screen
function explodeParticles() {
    const particles = textParticles[0];
    const positions = particles.geometry.attributes.position.array;
    const targetPositions = particles.geometry.attributes.targetPosition.array;
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        
        // Get current position
        const currentX = positions[i3];
        const currentY = positions[i3 + 1];
        const currentZ = positions[i3 + 2];
        
        // Calculate direction from center (0,0,0) or current position
        const angle = Math.random() * Math.PI * 2;
        const speed = 50 + Math.random() * 50; // 3x slower than previous
        
        // Explode outward from current position
        targetPositions[i3] = currentX + Math.cos(angle) * speed;
        targetPositions[i3 + 1] = currentY + Math.sin(angle) * speed;
        targetPositions[i3 + 2] = currentZ + (Math.random() - 0.5) * 33; // 3x slower
    }
    
    particles.geometry.attributes.targetPosition.needsUpdate = true;
}

// Update particle positions towards targets
function updateParticles(deltaTime) {
    const particles = textParticles[0];
    const positions = particles.geometry.attributes.position.array;
    const targetPositions = particles.geometry.attributes.targetPosition.array;
    const finalTargetPositions = particles.geometry.attributes.finalTargetPosition.array;
    const delays = particles.geometry.attributes.delay.array;
    const material = particles.material;
    
    const smoothing = 0.04; // Slower animation for more visible individual stars
    const time = Date.now() * 0.001;
    const elapsed = time - animationStartTime;
    
    // Smooth opacity transition
    particleOpacity += (targetParticleOpacity - particleOpacity) * 0.05;
    material.opacity = particleOpacity;
    
    // Morphing phase removed - particles stay in their formed positions
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        
        // Check if this particle's delay has passed
        const particleDelay = delays[i];
        const delayProgress = Math.max(0, Math.min(1, (elapsed - particleDelay) / 0.5));
        
        // Smooth movement towards target (only after delay)
        const diffX = targetPositions[i3] - positions[i3];
        const diffY = targetPositions[i3 + 1] - positions[i3 + 1];
        const diffZ = targetPositions[i3 + 2] - positions[i3 + 2];
        
        // Apply movement with delay factor - particles only move after their delay
        positions[i3] += diffX * smoothing * delayProgress;
        positions[i3 + 1] += diffY * smoothing * delayProgress;
        positions[i3 + 2] += diffZ * smoothing * delayProgress;
    }
    
    particles.geometry.attributes.position.needsUpdate = true;
}

// Handle navigation
function nextSlide() {
    if (isAnimating) return;
    
    // Check if we need to move to next slide/topic
    const slide = presentationData.slides[currentSlide];
    
    // For slides with no bullets, treat first click as showing it, second click as advancing
    if (slide.bullets.length === 0) {
        if (currentBullet === -1) {
            // First click on empty slide - show it
            currentBullet = 0;
            showCurrentSlide();
            updateProgress();
            return;
        } else {
            // Second click - advance to next slide
            hideTextOverlay();
            isAnimating = true;
            
            setTimeout(() => {
                currentSlide++;
                currentBullet = -1;
                
                if (currentSlide >= presentationData.slides.length) {
                    // End of presentation
                    currentSlide = 0;
                }
                
                // Zoom transition to next topic with particle explosion
                isAnimating = false;
                zoomToNextTopic();
            }, 300);
            
            updateProgress();
            return;
        }
    }
    
    // For slides with bullets, increment through topic (-1) then bullets (0, 1, 2...)
    currentBullet++;
    
    if (currentBullet >= slide.bullets.length) {
        // Move to next topic - hide text and prepare for zoom with explosion
        hideTextOverlay();
        
        isAnimating = true;
        
        setTimeout(() => {
            currentSlide++;
            currentBullet = -1; // Start at -1 so first click shows topic
            
            if (currentSlide >= presentationData.slides.length) {
                // End of presentation
                currentSlide = 0;
            }
            
            // Zoom transition to next topic with particle explosion
            isAnimating = false;
            zoomToNextTopic();
        }, 300);
    } else {
        // Show next bullet point
        showCurrentSlide();
    }
    
    updateProgress();
}

// Show topic title with particle swarm effect
function showTopicWithSwarm(topicText, centered = false) {
    const topicTitle = document.getElementById('topic-title');
    // Hide HTML overlay - using particles only
    topicTitle.style.display = 'none';
    
    // Create temporary particle swarm for the topic
    targetParticleOpacity = 1.0;
    
    // Particles are already exploded from zoom - just form topic immediately
    animationStartTime = Date.now() * 0.001;
    
    // Reset particle assignment counter
    nextParticleIndex = 0;
    
    // Use the addNewLine function for the topic (line index 0)
    addNewLine(topicText, 0);
    
    // No CSS text overlay needed - particles form the text
    // Particles stop when they reach their positions (no morphing)
}

// Show current slide content
function showCurrentSlide() {
    const slide = presentationData.slides[currentSlide];
    
    // Handle slides with no bullets (like title slide)
    if (slide.bullets.length === 0) {
        const centered = true;
        showTopicWithSwarm(slide.topic, centered);
        isAnimating = false;
        return;
    }
    
    // If currentBullet is -1, just show the topic
    if (currentBullet === -1) {
        const centered = false;
        showTopicWithSwarm(slide.topic, centered);
        isAnimating = false;
        return;
    }
    
    const allTextsToShow = slide.bullets.slice(0, currentBullet + 1);
    const newBulletText = slide.bullets[currentBullet];
    
    // Show the topic and bullet together
    startBulletSwarm(slide, allTextsToShow, newBulletText, currentBullet === 0);
}

function startBulletSwarm(slide, allTextsToShow, newBulletText, isFirstBullet) {
    isAnimating = true;
    
    // Don't scatter - keep existing particles in place
    targetParticleOpacity = 1.0;
    
    // Only add the NEW bullet, don't reform existing text
    const bulletIndex = allTextsToShow.length - 1;
    const lineIndex = bulletIndex + 1; // +1 because topic is line 0
    
    addNewLine(newBulletText, lineIndex);
    
    // Mark animation as complete after particles arrive
    setTimeout(() => {
        isAnimating = false;
    }, 4000);
}

// Add a new line of text without moving existing particles
function addNewLine(text, lineIndex) {
    const particles = textParticles[0];
    const positions = particles.geometry.attributes.position.array;
    const targetPositions = particles.geometry.attributes.targetPosition.array;
    
    animationStartTime = Date.now() * 0.001;
    
    const spacing = 64;
    // Line 0 is the topic at Y=277 (higher up), bullets start at -35 and go down
    const yOffset = (lineIndex === 0) ? 277 : -35 - ((lineIndex - 1) * spacing);
    // Use larger font for topic (line 0), normal font for bullets
    const fontSize = (lineIndex === 0) ? 140 : 70;
    const points = textToParticles(text, yOffset, false, fontSize);
    
    // Use the global counter to track which particles to use
    let particleIndex = nextParticleIndex;
    
    // Assign the new particles
    for (let p = 0; p < points.length && particleIndex < PARTICLE_COUNT; p++, particleIndex++) {
        const i3 = particleIndex * 3;
        
        // Don't move particles to off-screen - they'll move from wherever they currently are
        // Just set the target position
        targetPositions[i3] = points[p].x;
        targetPositions[i3 + 1] = points[p].y;
        targetPositions[i3 + 2] = points[p].z;
    }
    
    // Update the global counter for next call
    nextParticleIndex = particleIndex;
    
    particles.geometry.attributes.position.needsUpdate = true;
    particles.geometry.attributes.targetPosition.needsUpdate = true;
}

// Scatter only the particles that aren't already forming text
function scatterNewBulletParticles(topic, existingBullets) {
    const particles = textParticles[0];
    const positions = particles.geometry.attributes.position.array;
    const targetPositions = particles.geometry.attributes.targetPosition.array;
    
    // Calculate how many particles are already used
    const allLines = [topic].concat(existingBullets);
    const spacing = 64;
    let usedParticleCount = 0;
    
    allLines.forEach((text, index) => {
        const yOffset = -35 - (index * spacing);
        const points = textToParticles(text, yOffset, false);
        usedParticleCount += points.length;
    });
    
    // Only scatter unused particles
    for (let i = usedParticleCount; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        
        const angle = Math.random() * Math.PI * 2;
        const distance = 2000 + Math.random() * 1000;
        
        const offscreenX = Math.cos(angle) * distance;
        const offscreenY = Math.sin(angle) * distance;
        const offscreenZ = (Math.random() - 0.5) * 500 - 800;
        
        positions[i3] = offscreenX;
        positions[i3 + 1] = offscreenY;
        positions[i3 + 2] = offscreenZ;
        
        targetPositions[i3] = offscreenX;
        targetPositions[i3 + 1] = offscreenY;
        targetPositions[i3 + 2] = offscreenZ;
    }
    
    particles.geometry.attributes.position.needsUpdate = true;
    particles.geometry.attributes.targetPosition.needsUpdate = true;
}

// Show crisp text overlay
function showTextOverlay(texts) {
    const textContent = document.getElementById('text-content');
    
    // Only add the new bullet, don't recreate existing ones
    const currentDivCount = textContent.children.length;
    
    // If we have fewer divs than texts, add the new one
    if (currentDivCount < texts.length) {
        const newText = texts[texts.length - 1];
        const div = document.createElement('div');
        div.className = 'text-line';
        div.textContent = newText;
        div.style.opacity = '0';
        div.style.transition = 'opacity 5000ms ease';
        
        // Position each line centered, with 80px spacing downward
        // Center of container is at 300px, first line at center, subsequent below
        const lineIndex = texts.length - 1;
        div.style.top = (300 + lineIndex * 80) + 'px';
        
        textContent.appendChild(div);
        
        // Trigger fade in immediately
        setTimeout(() => {
            div.style.opacity = '1';
        }, 50);
    }
}

// Hide text overlay
function hideTextOverlay() {
    const textContent = document.getElementById('text-content');
    const topicTitle = document.getElementById('topic-title');
    const lines = textContent.querySelectorAll('.text-line');
    lines.forEach(line => {
        line.style.opacity = '0';
        line.style.transition = 'opacity 0.3s ease';
    });
    topicTitle.style.opacity = '0';
    topicTitle.style.transition = 'opacity 0.3s ease';
    
    // Clear all text after fade out animation completes
    setTimeout(() => {
        textContent.innerHTML = '';
    }, 400);
}

// Zoom camera to next topic
function zoomToNextTopic() {
    isAnimating = true;
    
    // Reset topic title to invisible (will be shown by showTopicWithSwarm)
    const slide = presentationData.slides[currentSlide];
    const topicTitle = document.getElementById('topic-title');
    topicTitle.textContent = '';
    topicTitle.style.opacity = '0';
    
    // Explode particles outward at the start of zoom
    targetParticleOpacity = 1.0;
    const particles = textParticles[0];
    particles.material.opacity = 1.0; // Ensure particles are visible immediately
    explodeParticles();
    
    // Enhanced zoom effect with rotation
    const startZ = camera.position.z;
    const endZ = -1000;
    const startRotation = camera.rotation.z;
    const endRotation = startRotation + Math.PI * 2;
    const duration = 5000; // Doubled from 2500 to slow down by half
    const startTime = Date.now();
    
    // Add stars rushing past effect
    const material = particles.material;
    const originalSize = material.size;
    
    targetParticleOpacity = 1.0;
    
    function zoomAnimation() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease in-out cubic
        const eased = progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        
        camera.position.z = startZ + (endZ - startZ) * eased;
        camera.rotation.z = startRotation + (endRotation - startRotation) * eased * 0.3;
        
        // Increase particle size during zoom for hyperspace effect
        material.size = originalSize + (15 - originalSize) * eased;
        
        if (progress < 1) {
            requestAnimationFrame(zoomAnimation);
        } else {
            // Smoothly animate camera back to normal position
            const resetDuration = 800;
            const resetStartTime = Date.now();
            const resetStartZ = camera.position.z;
            const resetStartRotation = camera.rotation.z;
            
            function resetAnimation() {
                const elapsed = Date.now() - resetStartTime;
                const progress = Math.min(elapsed / resetDuration, 1);
                
                // Ease out
                const eased = 1 - Math.pow(1 - progress, 3);
                
                camera.position.z = resetStartZ + (500 - resetStartZ) * eased;
                camera.rotation.z = resetStartRotation + (0 - resetStartRotation) * eased;
                material.size = originalSize;
                
                if (progress < 1) {
                    requestAnimationFrame(resetAnimation);
                } else {
                    camera.position.z = 500;
                    camera.rotation.z = 0;
                    isAnimating = false;
                    showCurrentSlide();
                }
            }
            
            resetAnimation();
        }
    }
    
    zoomAnimation();
}

// Update progress indicator
function updateProgress() {
    const total = presentationData.slides.length;
    const progressEl = document.getElementById('progress');
    if (progressEl) {
        progressEl.textContent = `Slide ${currentSlide + 1} of ${total}`;
    }
}

// Setup event listeners
function setupEventListeners() {
    // Click to advance
    document.addEventListener('click', () => {
        nextSlide();
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.code === 'ArrowRight' || e.code === 'Enter') {
            e.preventDefault();
            nextSlide();
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Rotate background stars slowly
    stars.forEach(starField => {
        starField.rotation.y += 0.0001;
        starField.rotation.x += 0.00005;
    });
    
    // Update particles
    updateParticles(0.016);
    
    renderer.render(scene, camera);
}

// Start the application
init();
