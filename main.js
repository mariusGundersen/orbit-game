import Game from './game.js';
import Stats from './stats.js';

const stats = new Stats();
stats.showPanel( 1 ); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild( stats.dom );

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const bgCanvas = document.getElementById('background');
const bgCtx = bgCanvas.getContext('2d');


let game = new Game();

function resize() {
    const width = window.innerWidth * devicePixelRatio;
    const height = window.innerHeight * devicePixelRatio;
    canvas.width = width;
    canvas.height = height;
    bgCanvas.width = width;
    bgCanvas.height = height;
    game.viewport.setScreenSize(width, height);
    drawBackground(width, height);
}
resize();

window.addEventListener('resize', resize);


function drawBackground(width, height) {
    const stars = [];
    for (let i = 0; i < 200; i++) {
        stars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 1.5 + 0.5,
            alpha: Math.random() * 0.5 + 0.3
        });
    }
    bgCtx.scale(devicePixelRatio, devicePixelRatio);
    bgCtx.fillStyle = '#0a0a12';
    bgCtx.fillRect(0, 0, width, height);
    stars.forEach(s => {
        bgCtx.globalAlpha = s.alpha;
        bgCtx.fillStyle = '#ffffff';
        bgCtx.beginPath();
        bgCtx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        bgCtx.fill();
    });
    bgCtx.globalAlpha = 1;
    bgCtx.resetTransform();
}

const fuelGauge = document.getElementById('fuelGauge');
const fuelText = document.getElementById('fuelText');

function updateFuelGauge() {
    if (fuelGauge && fuelText) {
        const fuelPct = Math.max(0, Math.min(1, game.ship.fuel / 1000));
        const levelHeight = 26 * fuelPct;
        const level = fuelGauge.querySelector('.fuel-level');
        if (level) {
            level.setAttribute('y', 36 - levelHeight);
            level.setAttribute('height', levelHeight);
        }
        fuelText.textContent = Math.round(game.ship.fuel);
        
        if (fuelPct < 0.25) {
            fuelGauge.classList.add('low');
        } else {
            fuelGauge.classList.remove('low');
        }
    }
}

function drawGameOver() {
    ctx.fillStyle = '#ff3535';
    ctx.font = 'bold 36px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ff3535';
    ctx.shadowBlur = 20;
    ctx.fillText('GAME OVER', game.viewport.worldWidth / 2, 50);
    ctx.shadowBlur = 0;
    
    ctx.font = '16px "Courier New", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Highest Level: ${game.level}`, game.viewport.worldWidth / 2, 90);
        
    ctx.font = '14px "Courier New", monospace';
    ctx.fillStyle = '#666666';
    ctx.fillText('Click to restart', game.viewport.worldWidth / 2, game.viewport.worldHeight - 30);
}

function resetGame() {
    game = new Game(game.viewport);
}

let lastTime = 0;
let dt = 0.016;
function gameLoop(timestamp) {
    dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;
    stats.begin();
    game.update(dt);

    ctx.reset();
    ctx.translate(game.viewport.screenWidth/2, game.viewport.screenHeight/2);
    ctx.scale(game.viewport.screenScale, game.viewport.screenScale);
    ctx.translate(-game.viewport.worldWidth/2, -game.viewport.worldHeight/2);
    
    game.draw(ctx);
    if(game.gameOver){
        drawGameOver();
    }else{
        updateFuelGauge();
    }
    
    
    ctx.resetTransform();
    stats.end();
    requestAnimationFrame(gameLoop);
}

function handleStart(e) {
    e.preventDefault();
    if (game.gameOver) {
        if(!game.viewport.sliding){
            resetGame();
        }
        return;
    }
    
    game.ship.setThrust(e.clientX < game.viewport.screenWidth / 2 / devicePixelRatio ? -1 : 1);
}

function handleEnd(e) {
    e.preventDefault();
    game.ship.setThrust(0);
}

canvas.addEventListener('pointerdown', handleStart);
canvas.addEventListener('pointerup', handleEnd);
canvas.addEventListener('pointerleave', handleEnd);

function handleKeyDown(e) {
    if (game.gameOver) {
        if(!game.viewport.sliding){
            resetGame();
        }
        return;
    }
    
    if (e.code === 'ArrowLeft' || e.code === 'KeyA' || e.code === 'KeyQ') {
        game.ship.setThrust(-1);
    } else if (e.code === 'ArrowRight' || e.code === 'KeyD' || e.code === 'KeyW') {
        game.ship.setThrust(1);
    }
}

function handleKeyUp(e) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA' || e.code === 'KeyQ' || 
        e.code === 'ArrowRight' || e.code === 'KeyD' || e.code === 'KeyW') {
        game.ship.setThrust(0);
    }
}

window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);

requestAnimationFrame(gameLoop);