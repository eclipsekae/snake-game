# Snake Game: Player Guide & Development Deep Dive

This document provides a complete overview of the Snake game, with a guide for players and a detailed breakdown of the development and design for developers.

---

## Player's Guide

Welcome to Snake! This guide will teach you everything you need to know to become a master.

### The Goal

The objective is simple: guide your snake to eat as much food as possible to grow your snake and achieve the highest score. The game gets progressively harder as the snake gets longer!

### How to Play

1.  **Start the Game**: Open the `index.html` file in your web browser.
2.  **Select Difficulty**: Choose from Easy, Medium, or Hard using the buttons at the top.
3.  **Begin Moving**: Press any **arrow key** to start the game.
4.  **Control the Snake**: Use the **arrow keys** (`↑`, `↓`, `←`, `→`) to change the snake's direction.
5.  **Eat & Grow**: Steer the snake to eat the food that appears on the screen.

### Game Rules

*   **Winning**: The game doesn't have a final "win" state. The goal is to get the highest score you can.
*   **Losing**: The game ends if you run into a wall (if borders are on) or if you run into your own snake's body.

### Items & Power-ups

*   **Red Food**: This is the standard food. Each one you eat makes your snake one segment longer and gives you **1 point**.
*   **Blue Super Food**: This special food appears occasionally and is much more valuable. It gives you **5 points** and activates Super Snake mode!
*   **Super Snake Mode**: After eating Super Food, your snake will glow and become immune to crashing into itself. Collecting additional Super Food extends the duration of your current Super Snake mode. A visual timer above the playfield indicates the remaining time.

### UI & Controls

*   **Score**: Your current score for the game.
*   **Difficulty Buttons**: Change the game speed. This can only be done before a game starts.
*   **Borders Button**: Toggles the walls on and off. When off, the snake can wrap around the screen.
*   **Last Score**: Shows your score from the previous round. This updates on screen only when a new game is started.
*   **High Score**: Tracks your best score across all play sessions. This updates immediately when a new high score is achieved.
*   **Pause & Resume**: Press the **P key** to pause the game. Press any **arrow key** to resume. All game actions and animations will freeze when paused.

---

## Development Deep Dive

This section details the technical implementation of the game, covering high-level design and low-level logic.

### Part I: Architecture, Design & Visuals

#### Coding Style & Architecture

*   **Style**: The JavaScript code follows a clean, modern style. It uses `const` for variables that are not reassigned and `let` for those that are (like the game state variables). Naming conventions are consistently `camelCase` for both functions and variables.
*   **Architecture**: The project uses a refined architecture with separate loops for game logic and rendering. The core game logic (movement, collisions, scoring) runs on a fixed-interval `setInterval` (`gameLoopInterval`), ensuring consistent gameplay speed regardless of frame rate. Visual updates and animations, however, are handled by a `requestAnimationFrame` loop (`animationFrameId`), which ensures drawing occurs at the browser's optimal refresh rate, leading to smoother animations and visual effects.

#### Visuals & Layout Design

*   **Layout**: The UI is built using **CSS Flexbox**, which arranges the header, game board, and footer in a clean vertical column. The entire game container is centered on the page. The layout is fixed-width and designed for a desktop experience.
*   **UI Elements**: The header and footer provide clear, non-intrusive information to the player. The buttons have a simple, clean design with hover and active states to provide user feedback. The game over and start messages are implemented as **overlays** that are positioned absolutely over the canvas, with their visibility toggled via a CSS class. A new `super-snake-timer-container` is positioned absolutely above the game board to display the visual timer.
*   **Color Palette**: The game uses a dark, high-contrast color scheme. The snake and food items use bright, distinct colors (`#00AA00` for the snake, `#fff` for regular food, `#00f` for super food) that stand out against the black (`#000`) canvas background. The Super Snake mode features a vibrant yellow and purple, immediately signaling the change in state.

#### Animations & Effects

The game leverages the HTML5 Canvas API for all its animations and visual effects.

*   **Snake Movement**: The illusion of movement is not a true animation but a frame-by-frame redraw. In each tick of the game logic loop, the snake's position is updated. The `requestAnimationFrame` loop then redraws the entire snake at its new position, creating smooth motion.
*   **Game Over Sequence**: This is a multi-stage animation:
    1.  **Flashing**: An `setInterval` is created to rapidly redraw the snake in solid white for a few frames, creating a flashing effect that signals a collision. This now lasts for 10 flashes.
    2.  **Head Mark**: After the flashing, an 'X' mark appears on the snake's head for 300ms.
    3.  **Blur Effect**: After the head mark, a CSS class is added to the canvas that applies a `filter: blur(3px)`, smoothly blurring the game board.
    4.  **Text Fade-in**: The "Game Over!" message appears, and the hint to restart fades in using a CSS `opacity` transition.
*   **Super Snake Glow**: This effect is achieved by dynamically setting the canvas context's `shadowBlur` and `shadowColor` properties before drawing the snake. The glow's intensity pulses using a `Math.sin()` wave, which creates a smooth, organic pulsing effect. The glow is now denser and more concentrated.
*   **Super Snake Color Transition**: When entering Super Snake mode, the snake's color smoothly fades in over 500ms. When exiting, it fades out over 1000ms, interpolating back to its normal green color.
*   **Super Snake Body Pulsation**: The body segments of the Super Snake pulse in brightness within a range of `[0.9, 1]` (almost full brightness), indicating its permeable state.
*   **Visual Timer Animation**: The timer above the playfield consists of individual dashes. Its animation is tightly integrated with the Super Snake mode:
    *   **Scaling**: The first 5 seconds of the timer are linear, and the remaining time (up to 100 seconds) scales logarithmically. This creates a seamless transition and ensures the timer fills the full width of the playfield.
    *   **Color**: The dashes are purple, with the last dash being yellow. In the last 1.5 seconds, the dashes smoothly fade to red.
    *   **Glow**: The visual timer dashes share the same pulsing glow effect as the Super Snake itself, ensuring visual consistency.
*   **Floating Score Text**: When food is eaten, a `+1` or `+5` text effect is created. These are objects stored in a `textEffects` array. Each frame, their `life` property is reduced, which is used to decrease their `globalAlpha` (making them fade out) and adjust their `y` position (making them float upwards).

### Part II: Game Logic & Entity Implementation

#### Game Items & Entities

*   **The Snake**: Represented by a JavaScript array named `snake`, where each element is an object with `{x, y}` coordinates. The head is `snake[0]`. Movement is handled in `update()` by adding a new head and (usually) removing the tail segment.
*   **Regular Food**: A single `{x, y}` object named `food`. The `createFood()` function places it randomly on an empty square.

#### Super Food & Super Snake Mode: A Detailed Look

This power-up is a core feature that involves a detailed interplay between its spawning, lifecycle, visual effects, and gameplay impact.

*   **Spawning**: The `createSuperFood()` function is triggered from within `createFood()` with a 20% probability (`Math.random() < 0.2`), but only if a super food is not already on the screen. This ensures only one can exist at a time. The spawning location is randomized until a spot is found that is not occupied by the snake or the regular food.

*   **Lifecycle & Disappearance**: The `superFood` object is given a `createdAt` timestamp when spawned. A `setTimeout` is immediately scheduled in `createSuperFood()` to set the `superFood` variable back to `null` after 8,000 milliseconds. This timer is stored in `superFood.disappearTimer` so it can be cancelled if the food is eaten.

*   **Visuals & Animation**: The super food has a distinct blue color. Its visual flair comes from two effects in the `draw()` function:
    1.  **Pulsing Glow**: Like the Super Snake, it uses `Math.sin()` to create a pulsing `shadowBlur` effect, making it stand out.
    2.  **Fade & Blink on Timeout**: The `draw()` function calculates the food's `age`. After 5 seconds, it begins to fade and blink. This is achieved by calculating an `alpha` value using `Math.cos()`, which creates a rapid oscillation of the `globalAlpha` property, warning the player that it's about to disappear.

*   **Activation of Super Snake Mode**: When the snake's head coordinates match the `superFood`'s, the `activateSuperSnake()` function is called. This function:
    1.  Sets the `isSuperSnake` boolean to `true`.
    2.  Initializes `superSnakeTimer` with `startTime` and `duration` (initially 5000ms).
    3.  If already in Super Snake mode, it extends the `superSnakeTimer.duration` by 5000ms instead of resetting it.
    4.  Sets a `setTimeout` to set `isSuperSnake` back to `false` after the calculated `newRemainingTime`.

*   **Gameplay Impact**: The `isSuperSnake` flag is the key. The self-collision logic in the `update()` function is wrapped in a condition: `if (checkSelfCollision(head) && !isSuperSnake)`. While `isSuperSnake` is `true`, this entire check is skipped, granting the snake temporary immunity.

*   **Visual Feedback for Super Snake**: While the mode is active, the `draw()` function applies a different color scheme (yellow and purple) to the snake and activates the pulsing glow effect. In the last 500ms of the power-up, the snake's color interpolates back to the standard green, providing a clear visual cue that the effect is about to end.

#### Game Events & Logic

*   **Game Loop**: The `gameLoop()` function, called by `setInterval`, is responsible for updating the game's state (snake movement, collisions, scoring). It calls `update()` to process these logic steps.
*   **Game Over**: Triggered by `handleWallCollision()` or `checkSelfCollision()`. The `gameOver()` function stops the logic loop and initiates the visual game-over sequence.
*   **Pause/Resume Logic**: The game can be paused by pressing the "P" key. This is handled in `handleKeyPress`, which calls `togglePause`. The `togglePause` function uses a new `isPaused` state variable to determine whether to call `pauseGame` or `resumeGame`. `pauseGame` stops both the `gameLoopInterval` and the `requestAnimationFrame` loop, and displays the "Paused" message. It also clears any active `superFood.disappearTimer` and `superSnakeTimer.timer` and records `pauseStartTime`. `resumeGame` restarts both loops, hides the message, and crucially, adjusts the `startTime` of `superSnakeTimer` and `createdAt` of `superFood` by the `pauseDuration` to ensure their timers resume accurately from where they left off.
*   **Scoring System**: Managed by `score`, `highScore`, and `lastScore` variables. `saveScores()` and `loadScores()` use the browser's `localStorage` to make the high and last scores persist between sessions.

### Part III: Game Data & Tuning

This section contains the specific values that define the game's feel and balance.

#### Core Mechanics

*   **Grid Size**: `20` pixels per grid unit.
*   **Canvas Dimensions**: `400x400` pixels, creating a `20x20` grid.
*   **Initial Snake Length**: `3` segments.

#### Difficulty & Speed

*   **Easy**: Game logic loop runs every `150` ms.
*   **Medium**: Game logic loop runs every `100` ms.
*   **Hard**: Game logic loop runs every `70` ms.

#### Scoring

*   **Regular Food**: `+1` point.
*   **Super Food**: `+5` points.

#### Super Food & Super Snake Timings

*   **Spawn Chance**: `20%` after eating regular food.
*   **Lifetime**: `8,000` ms (8 seconds).
*   **Warning Period**: Fading and blinking begins at `5,000` ms (5 seconds).
*   **Super Snake Initial Duration**: `5,000` ms (5 seconds).
*   **Super Snake Extension**: `5,000` ms (5 seconds) added per Super Food consumed in Super Mode.
*   **End-of-Mode Warning**: Color interpolation begins in the last `500` ms.

#### Colors

*   **Background**: `#1a1a1a` (Body), `#000` (Canvas).
*   **Snake (Normal)**: `#00AA00` (Head), `#00FF00` (Body).
*   **Snake (Super)**: `#FFFF00` (Head), `#FF00FF` (Body).
*   **Food**: `#fff` (Regular), `#00f` (Super).
*   **UI**: `#f0f0f0` (Text), `#4CAF50` (Active Button).

#### Animation & Effects

*   **Game Over Flash**: `10` flashes, `80` ms interval.
*   **Game Over Head Mark**: 'X' appears on head for `300` ms after flashing.
*   **Game Over Blur**: `3px` CSS blur.
*   **Restart Hint Delay**: Appears `500` ms after Game Over message.
*   **Floating Text Lifetime**: `30` game ticks.
*   **Super Snake Pulse Range**: `[0.9, 1]` for body brightness.
*   **Super Snake Glow Intensity**: Denser glow, `shadowBlur` from `5` to `10` pixels.
*   **Super Snake Color Fade-in**: `500` ms.
*   **Super Snake Color Fade-out**: `1000` ms.
*   **Visual Timer Dash**: `1px` width, `6px` height, `1px` gap.
*   **Visual Timer Scaling**: First `5,000` ms linear, then logarithmic up to `100,000` ms (100 seconds).
*   **Visual Timer Red Fade**: Fades to red in the last `1,500` ms (from `1,000` ms to `0` ms).