# GEMINI Project: Super Snake Game

## Project Overview

This project is a classic Snake game implemented using HTML, CSS, and vanilla JavaScript. It's a single-page web application designed to be played directly in a web browser. The game is responsive and supports both keyboard controls for desktop and touch controls for mobile devices.

**Core Technologies:**

*   **HTML:** Provides the basic structure and layout of the game.
*   **CSS:** Styles the game elements, including the snake, food, and UI components.
*   **JavaScript:** Contains all the game logic, including movement, collision detection, scoring, and game state management.

**Key Features:**

*   Classic snake gameplay.
*   Selectable difficulty levels (Easy, Medium, Hard).
*   Toggleable borders (walls).
*   "Super Snake" mode with special food.
*   High score and last score tracking using `localStorage`.
*   Responsive design for desktop and mobile.
*   Fullscreen mode.
*   Pause and resume functionality.

## Building and Running

This is a static web project with no build process.

**To run the game:**

1.  Ensure you have a modern web browser installed.
2.  Open the `index.html` file in your web browser.

There are no dependencies to install or build scripts to run.

## Development Conventions

*   The project follows a standard HTML, CSS, and JavaScript structure.
*   The JavaScript code is well-organized into functions for different aspects of the game (game flow, core logic, collision detection, UI, etc.).
*   The code is not minified or bundled, making it easy to read and debug.
*   The game state is managed through a set of global variables.
*   The game loop is implemented using `setInterval` for game logic updates and `requestAnimationFrame` for rendering.
