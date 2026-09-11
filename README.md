# GLITCH

A browser-based arcade game built using HTML, CSS, and vanilla JavaScript.

GLITCH places the player inside a corrupted digital system where they must collect data fragments, avoid corrupted objects, and survive as the system becomes increasingly unstable.

The game uses the HTML5 Canvas API for rendering and `requestAnimationFrame()` as the core game loop for smooth real-time animation.

## Features

- Real-time game loop using `requestAnimationFrame()`
- HTML5 Canvas-based rendering
- Keyboard-controlled player movement
- Score and level progression
- System integrity system
- Collectible data fragments
- Moving obstacles
- Increasing difficulty
- Temporary control reversal
- Dynamic glitch effects
- Particle effects
- Player movement trails
- Animated background
- FPS counter
- Pause and resume functionality
- Game-over and restart system
- Responsive interface

## Controls

| Key | Action |
|-----|--------|
| W / Arrow Up | Move Up |
| A / Arrow Left | Move Left |
| S / Arrow Down | Move Down |
| D / Arrow Right | Move Right |
| Space | Pause / Resume |

## How the Game Works

The player controls a digital entity inside the game area.

Valid data fragments increase the player's score, while corrupted fragments and obstacles reduce system integrity.

As the score increases, the game level increases. Higher levels introduce faster objects and more frequent system instability events.

During a glitch event, the interface becomes unstable and the player's controls may temporarily reverse.

The game ends when system integrity reaches zero.

## Technologies Used

- HTML5
- CSS3
- JavaScript
- HTML5 Canvas API
- `requestAnimationFrame()`

No frameworks, libraries, or game engines are used.

## Animation Loop

The game is driven by the browser's `requestAnimationFrame()` API.

The main loop continuously updates the game state and renders the next frame:

```javascript
function gameLoop(timestamp) {
    const deltaTime = (timestamp - lastTime) / 1000;

    lastTime = timestamp;

    update(deltaTime);
    draw();

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
