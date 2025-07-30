const gameBoard = document.getElementById('game-board');
const ctx = gameBoard.getContext('2d');
const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('high-score');
const lastScoreDisplay = document.getElementById('last-score');
const difficultyButtons = document.querySelectorAll('.difficulty-btn');
const borderToggleButton = document.getElementById('border-toggle-btn');
const fullscreenButton = document.getElementById('fullscreen-btn');
const startMessage = document.getElementById('start-message');
const gameOverMessage = document.getElementById('game-over-message');
const restartHint = document.getElementById('restart-hint');
const timerContainer = document.getElementById('super-snake-timer-container');
const gameContainer = document.getElementById('game-container');

const gridSize = 20;
gameBoard.width = 400;
gameBoard.height = 400;

const pauseMessage = document.getElementById('pause-message');

// Game state variables
let snake, food, superFood, score, highScore, lastScore, direction, nextDirection, gameSpeed, gameLoopInterval, animationFrameId, isGameOver, isPaused, canRestart, borderIsSolid, isSuperSnake, superSnakeTimer, textEffects, gameTick, collisionFlashInterval, pauseStartTime, isFlashing = false, showHeadMark = false, isGrowingInitially = false;
let touchStartX = 0;
let touchStartY = 0;

const difficulties = { easy: 150, medium: 100, hard: 70 };
let currentDifficulty = 'medium';

// --- Device Detection ---
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// --- Game Scaling ---
function scaleGame() {
    if (isMobile()) {
        const containerWidth = gameContainer.offsetWidth;
        const containerHeight = gameContainer.offsetHeight;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const scale = Math.min(viewportWidth / containerWidth, viewportHeight / containerHeight) * 0.95;
        gameContainer.style.transform = `scale(${scale})`;
        gameContainer.classList.add('mobile-scale');
    } else {
        gameContainer.style.transform = 'scale(1)';
        gameContainer.classList.remove('mobile-scale');
    }
}


// --- Game Flow Functions ---

function resetGameState() {
    clearInterval(gameLoopInterval);
    clearTimeout(superSnakeTimer?.timer);
    if (superFood) clearTimeout(superFood.disappearTimer);
    clearInterval(collisionFlashInterval);

    score = 0;
    scoreDisplay.innerHTML = `<span>🐍</span> ${score}`;
    food = {};
    showHeadMark = false;
    gameSpeed = difficulties[currentDifficulty];
    isSuperSnake = false;
    superFood = null;
    textEffects = [];
    gameTick = 0;
    gameBoard.classList.remove('blurred');
    restartHint.classList.remove('visible');
}

function prepareGame() {
    isGameOver = true;
    canRestart = false;
    resetGameState();
    snake = [
        { x: 10, y: 10 }
    ];
    startMessage.classList.add('visible');
    gameOverMessage.classList.remove('visible');

    // Customize splash text
    const startText = startMessage.querySelector('p');
    const restartText = restartHint;
    if (isMobile()) {
        startText.textContent = 'Swipe to start!';
        restartText.textContent = 'Swipe to restart';
    } else {
        startText.textContent = 'Press an arrow key to start!';
        restartText.textContent = 'Press any arrow key to restart';
    }

    loadScores();
    draw();
}

function startGame(startDirection) {
    resetGameState();
    const head = { x: 10, y: 10 };
    snake = [head];
    isGrowingInitially = true;

    nextDirection = startDirection;
    direction = startDirection;
    isGameOver = false;
    canRestart = false;
    startMessage.classList.remove('visible');
    gameOverMessage.classList.remove('visible');
    createFood();
    gameLoopInterval = setInterval(gameLoop, gameSpeed);
    animationFrameId = requestAnimationFrame(drawLoop);
}

function gameOver() {
    isGameOver = true;
    clearInterval(gameLoopInterval);
    clearTimeout(superSnakeTimer?.timer);
    if (superFood) clearTimeout(superFood.disappearTimer);
    isSuperSnake = false;

    saveScores();
    updateHighScoreDisplay();

    isFlashing = true;
    let flashCount = 0;
    collisionFlashInterval = setInterval(() => {
        flashCount++;
        isFlashing = !isFlashing;
        if (flashCount >= 10) {
            clearInterval(collisionFlashInterval);
            isFlashing = false;
            showHeadMark = true;
            setTimeout(() => {
                gameBoard.classList.add('blurred');
                gameOverMessage.classList.add('visible');
                setTimeout(() => {
                    restartHint.classList.add('visible');
                    canRestart = true;
                }, 500);
            }, 1000);
        }
    }, 80);
}

function gameLoop() {
    update();
}

function drawLoop() {
    draw();
    animationFrameId = requestAnimationFrame(drawLoop);
}

function togglePause() {
    if (isGameOver) return;
    isPaused = !isPaused;
    if (isPaused) {
        pauseGame();
    } else {
        resumeGame();
    }
}

function pauseGame() {
    clearInterval(gameLoopInterval);
    cancelAnimationFrame(animationFrameId);
    pauseStartTime = Date.now();
    if (superFood) clearTimeout(superFood.disappearTimer);
    if (isSuperSnake) clearTimeout(superSnakeTimer?.timer);
    pauseMessage.classList.add('visible');
    gameBoard.classList.add('blurred');
}

function resumeGame() {
    isPaused = false;
    const pauseDuration = Date.now() - pauseStartTime;

    if (isSuperSnake && superSnakeTimer) {
        const timeElapsedBeforePause = pauseStartTime - superSnakeTimer.startTime;
        const remainingDuration = superSnakeTimer.duration - timeElapsedBeforePause;

        if (remainingDuration > 0) {
            superSnakeTimer.startTime += pauseDuration;
            superSnakeTimer.timer = setTimeout(() => {
                isSuperSnake = false;
                superSnakeTimer = null;
            }, remainingDuration);
        } else {
            isSuperSnake = false;
            superSnakeTimer = null;
        }
    }

    if (superFood) {
        const timeElapsedBeforePause = pauseStartTime - superFood.createdAt;
        const remainingDuration = 8000 - timeElapsedBeforePause;

        if (remainingDuration > 0) {
            superFood.createdAt += pauseDuration;
            superFood.disappearTimer = setTimeout(() => {
                if (superFood) superFood = null;
            }, remainingDuration);
        } else {
            superFood = null;
        }
    }

    gameLoopInterval = setInterval(gameLoop, gameSpeed);
    animationFrameId = requestAnimationFrame(drawLoop);
    pauseMessage.classList.remove('visible');
    gameBoard.classList.remove('blurred');
}

// --- Core Game Logic ---

function update() {
    if (isGameOver) return;

    direction = nextDirection;
    const head = { x: snake[0].x, y: snake[0].y };

    switch (direction) {
        case 'up': head.y--; break;
        case 'down': head.y++; break;
        case 'left': head.x--; break;
        case 'right': head.x++; break;
    }

    if (handleWallCollision(head)) return;
    if (checkSelfCollision(head) && !isSuperSnake) {
        snake.unshift(head);
        gameOver();
        return;
    }

    snake.unshift(head);

    if (isGrowingInitially) {
        if (snake.length < 3) {
            // Grow to initial length
        } else {
            isGrowingInitially = false;
        }
    } else if (superFood && head.x === superFood.x && head.y === superFood.y) {
        score += 5;
        createTextEffect('+5', superFood);
        clearTimeout(superFood.disappearTimer);
        superFood = null;
        activateSuperSnake();
    } else if (head.x === food.x && head.y === food.y) {
        score++;
        createTextEffect('+1', food);
        createFood();
    } else {
        snake.pop();
    }
    scoreDisplay.innerHTML = `<span>🐍</span> ${score}`;

    textEffects.forEach((effect, index) => {
        effect.life--;
        if (effect.life <= 0) textEffects.splice(index, 1);
    });
}

function interpolateColor(hex1, hex2, factor) {
    const r1 = parseInt(hex1.substring(1, 3), 16);
    const g1 = parseInt(hex1.substring(3, 5), 16);
    const b1 = parseInt(hex1.substring(5, 7), 16);

    const r2 = parseInt(hex2.substring(1, 3), 16);
    const g2 = parseInt(hex2.substring(3, 5), 16);
    const b2 = parseInt(hex2.substring(5, 7), 16);

    const r = Math.round(r1 + (r2 - r1) * factor);
    const g = Math.round(g1 + (g2 - g1) * factor);
    const b = Math.round(b1 + (b2 - b1) * factor);

    return `rgb(${r}, ${g}, ${b})`;
}

function draw() {
    ctx.clearRect(0, 0, gameBoard.width, gameBoard.height);

    let superSnakeGlow = 0;
    let transitionFactor = 1.0;
    let currentTime = Date.now();

    if (isPaused) {
        currentTime = pauseStartTime;
    }

    if (isSuperSnake && superSnakeTimer) {
        const timeElapsed = currentTime - superSnakeTimer.startTime;
        const timeRemaining = superSnakeTimer.duration - timeElapsed;

        if (timeElapsed < 500) {
            transitionFactor = timeElapsed / 500;
        } else if (timeRemaining < 1000) {
            transitionFactor = Math.max(0, timeRemaining / 1000);
        }

        const glowPulseFactor = (Math.sin(currentTime / 200) + 1) / 2;
        superSnakeGlow = (5 + (glowPulseFactor * 5)) * transitionFactor;

        const maxVisualTimerDashes = 200;
        const linearDurationMs = 5000;
        const dashValueMs = 50;
        const logShift = linearDurationMs * 2;

        let dashesToDraw;
        const visualTimeRemaining = Math.min(timeRemaining, 100000);

        if (visualTimeRemaining <= linearDurationMs) {
            dashesToDraw = Math.ceil(visualTimeRemaining / dashValueMs);
        } else {
            const linearDashesCount = linearDurationMs / dashValueMs;
            const timeInLogarithmicSegment = visualTimeRemaining - linearDurationMs;
            const logRangeMs = (100000) - linearDurationMs;
            const logDashesCount = maxVisualTimerDashes - linearDashesCount;
            const normalizedLogTime = (Math.log(timeInLogarithmicSegment + logShift) - Math.log(logShift)) / (Math.log(logRangeMs + logShift) - Math.log(logShift));
            const dashesFromLog = normalizedLogTime * logDashesCount;
            dashesToDraw = Math.ceil(linearDashesCount + dashesFromLog);
        }

        dashesToDraw = Math.max(0, Math.min(dashesToDraw, maxVisualTimerDashes));

        timerContainer.innerHTML = '';
        for (let i = 0; i < dashesToDraw; i++) {
            const dash = document.createElement('div');
            dash.classList.add('timer-dash');
            let dashColor = (timeRemaining < 1500) ? interpolateColor('#FF00FF', '#FF0000', 1 - Math.max(0, (timeRemaining - 1000) / 500)) : '#FF00FF';
            if (i === dashesToDraw - 1) dashColor = '#FFFF00';
            dash.style.backgroundColor = dashColor;
            dash.style.boxShadow = `0 0 ${superSnakeGlow}px ${dashColor}`;
            timerContainer.appendChild(dash);
        }
    } else {
        timerContainer.innerHTML = '';
    }

    const normalHeadColor = '#00AA00';
    const superHeadColor = '#FFFF00';
    const normalBodyColor = '#00FF00';
    const superBodyColor = '#FF00FF';

    snake.forEach((segment, index) => {
        const isHead = index === 0;
        let color;
        let glow = 0;

        if (isSuperSnake && superSnakeTimer) {
            glow = superSnakeGlow;
            let baseColor = isHead ? interpolateColor(normalHeadColor, superHeadColor, transitionFactor) : interpolateColor(normalBodyColor, superBodyColor, transitionFactor);
            if (!isHead) {
                const bodyPulseFactor = (Math.sin(currentTime / 150) + 1) / 2 * 0.1 + 0.9;
                const rgb = baseColor.match(/\d+/g);
                if (rgb) {
                    color = `rgb(${Math.round(parseInt(rgb[0]) * bodyPulseFactor)}, ${Math.round(parseInt(rgb[1]) * bodyPulseFactor)}, ${Math.round(parseInt(rgb[2]) * bodyPulseFactor)})`;
                } else {
                    color = baseColor;
                }
            } else {
                color = baseColor;
            }
        } else {
            color = isHead ? normalHeadColor : normalBodyColor;
        }
        if (isFlashing) color = '#fff';
        drawRect(segment.x, segment.y, color, glow, color);
    });

    if (isGameOver && (showHeadMark || gameOverMessage.classList.contains('visible'))) {
        const head = snake[0];
        const headDrawPos = { x: head.x, y: head.y };
        if (borderIsSolid) {
            if (headDrawPos.x < 0) headDrawPos.x = 0;
            if (headDrawPos.x * gridSize >= gameBoard.width) headDrawPos.x = (gameBoard.width / gridSize) - 1;
            if (headDrawPos.y < 0) headDrawPos.y = 0;
            if (headDrawPos.y * gridSize >= gameBoard.height) headDrawPos.y = (gameBoard.height / gridSize) - 1;
        }
        ctx.fillStyle = 'rgba(255, 0, 0, 0.9)';
        ctx.font = 'bold 18px Courier New';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('X', headDrawPos.x * gridSize + gridSize / 2, headDrawPos.y * gridSize + gridSize / 2);
    }

    if (food.x !== undefined) drawRect(food.x, food.y, '#fff');

    if (superFood) {
        const age = currentTime - superFood.createdAt;
        let alpha = 1.0;
        const glow = Math.sin(currentTime / 150) * 5 + 10;
        const fadeStartTime = 5000;
        const fadeDuration = 3000;
        if (age > fadeStartTime) {
            const timeIntoFade = age - fadeStartTime;
            const pulseFrequency = 6 * 2 * Math.PI;
            alpha = (Math.cos((timeIntoFade / fadeDuration) * pulseFrequency) + 1) / 2;
        }
        ctx.globalAlpha = Math.max(0, alpha);
        drawRect(superFood.x, superFood.y, '#00f', glow, '#00f');
        ctx.globalAlpha = 1.0;
    }

    drawTextEffects();
}

function drawRect(x, y, color, glow = 0, glowColor = '#fff') {
    ctx.fillStyle = color;
    if (glow > 0) {
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = glow;
    }
    ctx.fillRect(x * gridSize, y * gridSize, gridSize - 1, gridSize - 1);
    ctx.shadowBlur = 0;
}

function drawTextEffects() {
    ctx.font = 'bold 16px Courier New';
    textEffects.forEach(effect => {
        ctx.globalAlpha = effect.life / 30;
        ctx.fillStyle = effect.text === '+5' ? '#ff80ff' : '#ffd700';
        const yOffset = (30 - effect.life) * 0.5;
        ctx.fillText(effect.text, effect.x * gridSize, effect.y * gridSize - yOffset);
    });
    ctx.globalAlpha = 1.0;
}

// --- Collision & Food Functions ---

function handleWallCollision(head) {
    const hitWall = head.x < 0 || head.x * gridSize >= gameBoard.width || head.y < 0 || head.y * gridSize >= gameBoard.height;
    if (hitWall) {
        if (borderIsSolid) {
            snake.unshift(head);
            gameOver();
            return true;
        }
        if (head.x < 0) head.x = gameBoard.width / gridSize - 1;
        if (head.x * gridSize >= gameBoard.width) head.x = 0;
        if (head.y < 0) head.y = gameBoard.height / gridSize - 1;
        if (head.y * gridSize >= gameBoard.height) head.y = 0;
    }
    return false;
}

function checkSelfCollision(head) {
    return snake.some((segment, index) => index > 0 && head.x === segment.x && head.y === segment.y);
}

function createFood() {
    do {
        food = { x: randomGridPos(), y: randomGridPos() };
    } while (snake.some(seg => seg.x === food.x && seg.y === food.y));

    if (Math.random() < 0.2 && !superFood) createSuperFood();
}

function createSuperFood() {
    do {
        superFood = { x: randomGridPos(), y: randomGridPos(), createdAt: Date.now() };
    } while (snake.some(seg => seg.x === superFood.x && seg.y === superFood.y) || (superFood.x === food.x && superFood.y === food.y));

    superFood.disappearTimer = setTimeout(() => { if (superFood) superFood = null; }, 8000);
}

function createTextEffect(text, pos) {
    textEffects.push({ text, x: pos.x, y: pos.y, life: 30 });
}

function activateSuperSnake() {
    clearTimeout(superSnakeTimer?.timer);

    if (isSuperSnake && superSnakeTimer) {
        superSnakeTimer.duration += 5000;
    } else {
        isSuperSnake = true;
        superSnakeTimer = {
            startTime: Date.now(),
            duration: 5000
        };
    }

    const timeElapsed = Date.now() - superSnakeTimer.startTime;
    const newRemainingTime = superSnakeTimer.duration - timeElapsed;

    superSnakeTimer.timer = setTimeout(() => {
        isSuperSnake = false;
        superSnakeTimer = null;
    }, newRemainingTime);
}

// --- High Score ---
function loadScores() {
    highScore = localStorage.getItem('snakeHighScore') || 0;
    lastScore = localStorage.getItem('snakeLastScore') || 0;
    updateScoreDisplays();
}

function saveScores() {
    lastScore = score;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
    }
    localStorage.setItem('snakeLastScore', lastScore);
}

function updateHighScoreDisplay() {
    highScoreDisplay.textContent = `👑 High: ${highScore}`;
}

function updateLastScoreDisplay() {
    lastScoreDisplay.textContent = `⏱️ Last: ${lastScore}`;
}

function updateScoreDisplays() {
    updateHighScoreDisplay();
    updateLastScoreDisplay();
}

// --- Event Handlers & UI ---

function handleDirectionChange(requestedDir) {
    if (!requestedDir) return;

    if (isPaused) {
        resumeGame();
        return;
    }

    if (isGameOver) {
        if (startMessage.classList.contains('visible') || canRestart) {
            updateLastScoreDisplay();
            startGame(requestedDir);
        }
        return;
    }

    const goingUp = direction === 'up';
    const goingDown = direction === 'down';
    const goingLeft = direction === 'left';
    const goingRight = direction === 'right';

    if ((requestedDir === 'up' && !goingDown) || (requestedDir === 'down' && !goingUp) || (requestedDir === 'left' && !goingRight) || (requestedDir === 'right' && !goingLeft)) {
        nextDirection = requestedDir;
    }
}

function handleKeyPress(event) {
    if (event.key === 'p' || event.key === 'P') {
        togglePause();
        return;
    }

    const keyMap = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
    const requestedDir = keyMap[event.key];
    if (requestedDir) {
        event.preventDefault();
        handleDirectionChange(requestedDir);
    }
}

function handleTouchStart(event) {
    event.preventDefault();
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
}

function handleTouchEnd(event) {
    event.preventDefault();
    const touchEndX = event.changedTouches[0].clientX;
    const touchEndY = event.changedTouches[0].clientY;

    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;
    const absDiffX = Math.abs(diffX);
    const absDiffY = Math.abs(diffY);

    if (absDiffX > 30 || absDiffY > 30) { // Swipe threshold
        if (absDiffX > absDiffY) {
            handleDirectionChange(diffX > 0 ? 'right' : 'left');
        } else {
            handleDirectionChange(diffY > 0 ? 'down' : 'up');
        }
    }
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
        fullscreenButton.textContent = 'Exit Fullscreen';
    } else {
        document.exitFullscreen();
        fullscreenButton.textContent = 'Fullscreen';
    }
}

function randomGridPos() {
    return Math.floor(Math.random() * (gameBoard.width / gridSize));
}

// --- Event Listeners ---
document.addEventListener('keydown', handleKeyPress);
gameBoard.addEventListener('touchstart', handleTouchStart, { passive: false });
gameBoard.addEventListener('touchend', handleTouchEnd, { passive: false });
gameBoard.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });


borderToggleButton.addEventListener('click', (e) => {
    borderIsSolid = !borderIsSolid;
    borderToggleButton.classList.toggle('active', borderIsSolid);
    gameBoard.classList.toggle('borders-on', borderIsSolid);
    e.target.blur();
});

difficultyButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        currentDifficulty = button.dataset.difficulty;
        difficultyButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        e.target.blur();
    });
});

fullscreenButton.addEventListener('click', (e) => {
    toggleFullscreen();
    e.target.blur();
});

window.addEventListener('resize', scaleGame);
document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
        fullscreenButton.textContent = 'Fullscreen';
    }
});


// --- Initial Setup ---
scaleGame();
prepareGame();