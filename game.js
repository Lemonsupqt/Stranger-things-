/* ========================================
   STRANGER THINGS MINI GAMES - GAME LOGIC
   ======================================== */

// ==========================================
// GLOBAL STATE
// ==========================================
let currentGame = null;
let gameState = {};

// Sound effects (using Web Audio API for retro sounds)
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    switch(type) {
        case 'click':
            oscillator.frequency.value = 440;
            oscillator.type = 'square';
            gainNode.gain.value = 0.1;
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);
            break;
        case 'match':
            oscillator.frequency.value = 523;
            oscillator.type = 'sine';
            gainNode.gain.value = 0.2;
            oscillator.start();
            setTimeout(() => oscillator.frequency.value = 659, 100);
            setTimeout(() => oscillator.frequency.value = 784, 200);
            oscillator.stop(audioContext.currentTime + 0.3);
            break;
        case 'wrong':
            oscillator.frequency.value = 200;
            oscillator.type = 'sawtooth';
            gainNode.gain.value = 0.15;
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.3);
            break;
        case 'victory':
            oscillator.frequency.value = 392;
            oscillator.type = 'sine';
            gainNode.gain.value = 0.2;
            oscillator.start();
            setTimeout(() => oscillator.frequency.value = 523, 150);
            setTimeout(() => oscillator.frequency.value = 659, 300);
            setTimeout(() => oscillator.frequency.value = 784, 450);
            oscillator.stop(audioContext.currentTime + 0.6);
            break;
        case 'gameOver':
            oscillator.frequency.value = 300;
            oscillator.type = 'sawtooth';
            gainNode.gain.value = 0.15;
            oscillator.start();
            setTimeout(() => oscillator.frequency.value = 200, 200);
            setTimeout(() => oscillator.frequency.value = 100, 400);
            oscillator.stop(audioContext.currentTime + 0.6);
            break;
        case 'light':
            oscillator.frequency.value = 300 + Math.random() * 400;
            oscillator.type = 'sine';
            gainNode.gain.value = 0.15;
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.15);
            break;
        case 'collect':
            oscillator.frequency.value = 880;
            oscillator.type = 'sine';
            gainNode.gain.value = 0.15;
            oscillator.start();
            setTimeout(() => oscillator.frequency.value = 1100, 50);
            oscillator.stop(audioContext.currentTime + 0.15);
            break;
        case 'hit':
            oscillator.frequency.value = 150;
            oscillator.type = 'square';
            gainNode.gain.value = 0.2;
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.2);
            break;
    }
}

// ==========================================
// NAVIGATION
// ==========================================
function startGame(game) {
    playSound('click');
    hideAllScreens();
    currentGame = game;
    
    switch(game) {
        case 'memory':
            document.getElementById('memory-game').classList.add('active');
            initMemoryGame();
            break;
        case 'lights':
            document.getElementById('lights-game').classList.add('active');
            initLightsGame();
            break;
        case 'chase':
            document.getElementById('chase-game').classList.add('active');
            initChaseGame();
            break;
        case 'eleven':
            document.getElementById('eleven-game').classList.add('active');
            initElevenGame();
            break;
    }
}

function goToMenu() {
    playSound('click');
    stopCurrentGame();
    hideAllScreens();
    hideOverlays();
    document.getElementById('main-menu').classList.add('active');
    currentGame = null;
}

function hideAllScreens() {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
}

function hideOverlays() {
    document.querySelectorAll('.overlay').forEach(overlay => {
        overlay.classList.remove('active');
    });
}

function showGameOver(score) {
    playSound('gameOver');
    document.getElementById('final-score').textContent = `Score: ${score}`;
    document.getElementById('game-over').classList.add('active');
}

function showVictory(score) {
    playSound('victory');
    document.getElementById('victory-score').textContent = `Score: ${score}`;
    document.getElementById('victory').classList.add('active');
}

function restartCurrentGame() {
    playSound('click');
    hideOverlays();
    startGame(currentGame);
}

function stopCurrentGame() {
    // Clear any game-specific intervals/timeouts
    if (gameState.chaseInterval) clearInterval(gameState.chaseInterval);
    if (gameState.chaseTimeout) clearTimeout(gameState.chaseTimeout);
    if (gameState.elevenInterval) clearInterval(gameState.elevenInterval);
    if (gameState.elevenTimeout) clearTimeout(gameState.elevenTimeout);
    if (gameState.lightsTimeout) clearTimeout(gameState.lightsTimeout);
    gameState = {};
}

// ==========================================
// MEMORY GAME - THE UPSIDE DOWN
// ==========================================
const memoryEmojis = ['👹', '🚲', '💡', '🧇', '🔦', '📻', '🎄', '🏠'];

function initMemoryGame() {
    stopCurrentGame();
    gameState = {
        cards: [],
        flippedCards: [],
        matchedPairs: 0,
        moves: 0,
        canFlip: true
    };
    
    // Create pairs and shuffle
    const cardPairs = [...memoryEmojis, ...memoryEmojis];
    shuffleArray(cardPairs);
    
    const board = document.getElementById('memory-board');
    board.innerHTML = '';
    
    cardPairs.forEach((emoji, index) => {
        const card = document.createElement('div');
        card.className = 'memory-card';
        card.innerHTML = `
            <div class="card-face card-back"></div>
            <div class="card-face card-front">${emoji}</div>
        `;
        card.dataset.index = index;
        card.dataset.emoji = emoji;
        card.addEventListener('click', () => flipCard(card));
        board.appendChild(card);
        gameState.cards.push(card);
    });
    
    updateMemoryStats();
}

function flipCard(card) {
    if (!gameState.canFlip) return;
    if (card.classList.contains('flipped')) return;
    if (card.classList.contains('matched')) return;
    if (gameState.flippedCards.length >= 2) return;
    
    playSound('click');
    card.classList.add('flipped');
    gameState.flippedCards.push(card);
    
    if (gameState.flippedCards.length === 2) {
        gameState.moves++;
        updateMemoryStats();
        checkMemoryMatch();
    }
}

function checkMemoryMatch() {
    gameState.canFlip = false;
    const [card1, card2] = gameState.flippedCards;
    
    if (card1.dataset.emoji === card2.dataset.emoji) {
        // Match found!
        playSound('match');
        card1.classList.add('matched');
        card2.classList.add('matched');
        gameState.matchedPairs++;
        gameState.flippedCards = [];
        gameState.canFlip = true;
        updateMemoryStats();
        
        if (gameState.matchedPairs === memoryEmojis.length) {
            setTimeout(() => {
                showVictory(`Completed in ${gameState.moves} moves!`);
            }, 500);
        }
    } else {
        // No match
        playSound('wrong');
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            gameState.flippedCards = [];
            gameState.canFlip = true;
        }, 1000);
    }
}

function updateMemoryStats() {
    document.getElementById('memory-moves').textContent = `Moves: ${gameState.moves}`;
    document.getElementById('memory-matches').textContent = `Matches: ${gameState.matchedPairs}/${memoryEmojis.length}`;
}

// ==========================================
// LIGHTS GAME - HAWKINS LIGHTS
// ==========================================
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function initLightsGame() {
    stopCurrentGame();
    gameState = {
        pattern: [],
        playerPattern: [],
        level: 1,
        score: 0,
        isShowingPattern: false,
        canInput: false
    };
    
    const wall = document.getElementById('alphabet-wall');
    wall.innerHTML = '';
    
    alphabet.forEach(letter => {
        const light = document.createElement('div');
        light.className = 'light-letter';
        light.dataset.letter = letter;
        light.innerHTML = `<span>${letter}</span>`;
        light.addEventListener('click', () => lightClicked(letter, light));
        wall.appendChild(light);
    });
    
    updateLightsStats();
    setTimeout(() => startLightsRound(), 1000);
}

function startLightsRound() {
    gameState.playerPattern = [];
    gameState.isShowingPattern = true;
    gameState.canInput = false;
    
    // Add a new letter to the pattern
    const randomLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
    gameState.pattern.push(randomLetter);
    
    updateLightsMessage('Watch the pattern...');
    setAllLightsDisabled(true);
    
    // Show the pattern
    showLightsPattern();
}

function showLightsPattern() {
    let i = 0;
    const showNext = () => {
        if (i < gameState.pattern.length) {
            const letter = gameState.pattern[i];
            const light = document.querySelector(`.light-letter[data-letter="${letter}"]`);
            
            light.classList.add('lit');
            playSound('light');
            
            setTimeout(() => {
                light.classList.remove('lit');
                i++;
                setTimeout(showNext, 300);
            }, 500);
        } else {
            // Pattern complete, player's turn
            gameState.isShowingPattern = false;
            gameState.canInput = true;
            setAllLightsDisabled(false);
            updateLightsMessage('Your turn! Repeat the pattern...');
        }
    };
    
    setTimeout(showNext, 500);
}

function lightClicked(letter, lightElement) {
    if (!gameState.canInput || gameState.isShowingPattern) return;
    
    playSound('light');
    lightElement.classList.add('lit');
    setTimeout(() => lightElement.classList.remove('lit'), 200);
    
    const expectedLetter = gameState.pattern[gameState.playerPattern.length];
    
    if (letter === expectedLetter) {
        // Correct!
        lightElement.classList.add('correct');
        setTimeout(() => lightElement.classList.remove('correct'), 300);
        
        gameState.playerPattern.push(letter);
        gameState.score += 10;
        
        if (gameState.playerPattern.length === gameState.pattern.length) {
            // Level complete!
            gameState.level++;
            gameState.canInput = false;
            updateLightsStats();
            updateLightsMessage('Correct! Get ready for the next pattern...');
            playSound('match');
            
            gameState.lightsTimeout = setTimeout(() => startLightsRound(), 1500);
        }
    } else {
        // Wrong!
        lightElement.classList.add('wrong');
        setTimeout(() => lightElement.classList.remove('wrong'), 300);
        playSound('wrong');
        
        gameState.canInput = false;
        updateLightsMessage('Wrong! Game Over');
        setAllLightsDisabled(true);
        
        setTimeout(() => {
            showGameOver(gameState.score);
        }, 1000);
    }
    
    updateLightsStats();
}

function setAllLightsDisabled(disabled) {
    document.querySelectorAll('.light-letter').forEach(light => {
        if (disabled) {
            light.classList.add('disabled');
        } else {
            light.classList.remove('disabled');
        }
    });
}

function updateLightsStats() {
    document.getElementById('lights-level').textContent = `Level: ${gameState.level}`;
    document.getElementById('lights-score').textContent = `Score: ${gameState.score}`;
}

function updateLightsMessage(msg) {
    document.getElementById('lights-message').textContent = msg;
}

// ==========================================
// CHASE GAME - DEMOGORGON CHASE
// ==========================================
function initChaseGame() {
    stopCurrentGame();
    
    const arena = document.getElementById('chase-arena');
    const arenaRect = arena.getBoundingClientRect();
    
    gameState = {
        playerX: arenaRect.width / 2 - 20,
        playerY: arenaRect.height / 2 - 20,
        demoX: 50,
        demoY: 50,
        collectibleX: 0,
        collectibleY: 0,
        score: 0,
        time: 0,
        speed: 5,
        demoSpeed: 2,
        keys: {},
        arenaWidth: arenaRect.width - 40,
        arenaHeight: arenaRect.height - 40,
        isRunning: true
    };
    
    spawnCollectible();
    updateChasePositions();
    updateChaseStats();
    
    // Key listeners
    document.addEventListener('keydown', handleChaseKeyDown);
    document.addEventListener('keyup', handleChaseKeyUp);
    
    // Game loop
    gameState.chaseInterval = setInterval(updateChaseGame, 1000/60);
    
    // Timer
    gameState.chaseTimeout = setInterval(() => {
        if (gameState.isRunning) {
            gameState.time++;
            updateChaseStats();
        }
    }, 1000);
}

function handleChaseKeyDown(e) {
    if (!gameState.isRunning) return;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
        e.preventDefault();
        gameState.keys[e.key.toLowerCase()] = true;
    }
}

function handleChaseKeyUp(e) {
    gameState.keys[e.key.toLowerCase()] = false;
}

function updateChaseGame() {
    if (!gameState.isRunning) return;
    
    // Move player
    if (gameState.keys['arrowup'] || gameState.keys['w']) {
        gameState.playerY = Math.max(0, gameState.playerY - gameState.speed);
    }
    if (gameState.keys['arrowdown'] || gameState.keys['s']) {
        gameState.playerY = Math.min(gameState.arenaHeight, gameState.playerY + gameState.speed);
    }
    if (gameState.keys['arrowleft'] || gameState.keys['a']) {
        gameState.playerX = Math.max(0, gameState.playerX - gameState.speed);
    }
    if (gameState.keys['arrowright'] || gameState.keys['d']) {
        gameState.playerX = Math.min(gameState.arenaWidth, gameState.playerX + gameState.speed);
    }
    
    // Move demogorgon towards player
    const dx = gameState.playerX - gameState.demoX;
    const dy = gameState.playerY - gameState.demoY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
        gameState.demoX += (dx / distance) * gameState.demoSpeed;
        gameState.demoY += (dy / distance) * gameState.demoSpeed;
    }
    
    // Check collision with demogorgon
    if (distance < 40) {
        gameState.isRunning = false;
        playSound('hit');
        document.removeEventListener('keydown', handleChaseKeyDown);
        document.removeEventListener('keyup', handleChaseKeyUp);
        clearInterval(gameState.chaseInterval);
        clearInterval(gameState.chaseTimeout);
        
        setTimeout(() => {
            showGameOver(`Score: ${gameState.score} | Time: ${gameState.time}s`);
        }, 500);
        return;
    }
    
    // Check collision with collectible
    const colDx = gameState.playerX - gameState.collectibleX;
    const colDy = gameState.playerY - gameState.collectibleY;
    const colDistance = Math.sqrt(colDx * colDx + colDy * colDy);
    
    if (colDistance < 40) {
        playSound('collect');
        gameState.score += 10;
        gameState.demoSpeed += 0.2; // Demogorgon gets faster!
        spawnCollectible();
        updateChaseStats();
    }
    
    updateChasePositions();
}

function spawnCollectible() {
    gameState.collectibleX = Math.random() * gameState.arenaWidth;
    gameState.collectibleY = Math.random() * gameState.arenaHeight;
}

function updateChasePositions() {
    const player = document.getElementById('player');
    const demo = document.getElementById('demogorgon');
    const collectible = document.getElementById('collectible');
    
    player.style.left = gameState.playerX + 'px';
    player.style.top = gameState.playerY + 'px';
    
    demo.style.left = gameState.demoX + 'px';
    demo.style.top = gameState.demoY + 'px';
    
    collectible.style.left = gameState.collectibleX + 'px';
    collectible.style.top = gameState.collectibleY + 'px';
}

function updateChaseStats() {
    document.getElementById('chase-score').textContent = `Score: ${gameState.score}`;
    document.getElementById('chase-time').textContent = `Time: ${gameState.time}s`;
}

// ==========================================
// ELEVEN GAME - MIND POWERS
// ==========================================
function initElevenGame() {
    stopCurrentGame();
    
    gameState = {
        score: 0,
        streak: 0,
        maxStreak: 0,
        targetsDestroyed: 0,
        targetsMissed: 0,
        isRunning: true,
        spawnRate: 2000,
        targetLifetime: 2000
    };
    
    const container = document.getElementById('targets-container');
    container.innerHTML = '';
    
    updateElevenStats();
    
    // Start spawning targets
    spawnTarget();
    gameState.elevenInterval = setInterval(() => {
        if (gameState.isRunning) {
            spawnTarget();
        }
    }, gameState.spawnRate);
}

function spawnTarget() {
    if (!gameState.isRunning) return;
    
    const container = document.getElementById('targets-container');
    const arena = document.getElementById('eleven-arena');
    const arenaRect = arena.getBoundingClientRect();
    
    const target = document.createElement('div');
    target.className = 'target';
    
    // Random position (avoiding center)
    let x, y;
    do {
        x = Math.random() * (arenaRect.width - 60);
        y = Math.random() * (arenaRect.height - 60);
    } while (Math.abs(x - arenaRect.width/2) < 80 && Math.abs(y - arenaRect.height/2) < 80);
    
    target.style.left = x + 'px';
    target.style.top = y + 'px';
    
    // Random enemy type
    const enemies = ['👹', '🦇', '👾', '🕷️', '💀'];
    target.textContent = enemies[Math.floor(Math.random() * enemies.length)];
    
    target.addEventListener('click', () => destroyTarget(target));
    
    container.appendChild(target);
    
    // Target expires
    const timeout = setTimeout(() => {
        if (target.parentNode && !target.classList.contains('destroyed')) {
            target.remove();
            gameState.targetsMissed++;
            gameState.streak = 0;
            updateElevenStats();
            playSound('wrong');
            
            // Game over if too many missed
            if (gameState.targetsMissed >= 5) {
                endElevenGame();
            }
        }
    }, gameState.targetLifetime);
    
    target.dataset.timeout = timeout;
}

function destroyTarget(target) {
    if (target.classList.contains('destroyed')) return;
    
    clearTimeout(parseInt(target.dataset.timeout));
    
    playSound('hit');
    target.classList.add('destroyed');
    
    gameState.score += 10 + (gameState.streak * 5);
    gameState.streak++;
    gameState.targetsDestroyed++;
    
    if (gameState.streak > gameState.maxStreak) {
        gameState.maxStreak = gameState.streak;
    }
    
    // Increase difficulty
    if (gameState.targetsDestroyed % 5 === 0) {
        gameState.spawnRate = Math.max(800, gameState.spawnRate - 100);
        gameState.targetLifetime = Math.max(1000, gameState.targetLifetime - 100);
        
        clearInterval(gameState.elevenInterval);
        gameState.elevenInterval = setInterval(() => {
            if (gameState.isRunning) {
                spawnTarget();
            }
        }, gameState.spawnRate);
    }
    
    updateElevenStats();
    
    setTimeout(() => {
        if (target.parentNode) {
            target.remove();
        }
    }, 300);
}

function endElevenGame() {
    gameState.isRunning = false;
    clearInterval(gameState.elevenInterval);
    
    // Remove remaining targets
    document.querySelectorAll('.target').forEach(t => {
        clearTimeout(parseInt(t.dataset.timeout));
        t.remove();
    });
    
    showGameOver(`Score: ${gameState.score} | Best Streak: ${gameState.maxStreak}`);
}

function updateElevenStats() {
    document.getElementById('eleven-score').textContent = `Score: ${gameState.score}`;
    document.getElementById('eleven-streak').textContent = `Streak: ${gameState.streak}`;
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Initialize particles effect
function initParticles() {
    const particles = document.getElementById('particles');
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            width: 2px;
            height: 2px;
            background: rgba(255, 23, 68, 0.3);
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: float ${5 + Math.random() * 10}s ease-in-out infinite;
            animation-delay: ${Math.random() * 5}s;
        `;
        particles.appendChild(particle);
    }
    
    // Add floating animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes float {
            0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
            25% { transform: translateY(-20px) translateX(10px); opacity: 0.6; }
            50% { transform: translateY(-40px) translateX(-10px); opacity: 0.3; }
            75% { transform: translateY(-20px) translateX(10px); opacity: 0.6; }
        }
    `;
    document.head.appendChild(style);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    
    // Resume audio context on first interaction
    document.body.addEventListener('click', () => {
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
    }, { once: true });
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    stopCurrentGame();
    document.removeEventListener('keydown', handleChaseKeyDown);
    document.removeEventListener('keyup', handleChaseKeyUp);
});
