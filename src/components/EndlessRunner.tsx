import React, { useEffect, useRef, useState } from 'react';

export default function EndlessRunner({ onScoreUpdate }: { onScoreUpdate: (score: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [localScore, setLocalScore] = useState(0);

  const requestRef = useRef<number>();
  
  const gameState = useRef({
    laneIdx: 1, // 0: left, 1: center, 2: right
    smoothX: 0,
    playerY: 0,
    jumpVel: 0,
    obstacles: [] as { lane: number, z: number, passed: boolean }[],
    speed: 1200,
    score: 0,
    gameOver: false,
    isPaused: false,
    distance: 0,
    lastTime: 0
  });

  const resetGame = () => {
    gameState.current = {
      ...gameState.current,
      laneIdx: 1,
      smoothX: 0,
      playerY: 0,
      jumpVel: 0,
      obstacles: [],
      speed: 1200,
      score: 0,
      gameOver: false,
      distance: 0,
      lastTime: performance.now()
    };
    setGameOver(false);
    setIsPaused(false);
    setLocalScore(0);
    onScoreUpdate(0);
  };

  useEffect(() => {
    gameState.current.isPaused = isPaused;
  }, [isPaused]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'p' || e.key === 'Escape') {
         setIsPaused(p => !p);
         return;
      }

      if (gameState.current.gameOver || gameState.current.isPaused) return;

      if (e.key === 'ArrowLeft' || e.key === 'a') {
        gameState.current.laneIdx = Math.max(0, gameState.current.laneIdx - 1);
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        gameState.current.laneIdx = Math.min(2, gameState.current.laneIdx + 1);
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') {
        if (gameState.current.playerY <= 0.1) {
          gameState.current.jumpVel = 1400; // Jump force
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const update = (time: number) => {
      const state = gameState.current;
      
      if (!state.lastTime) state.lastTime = time;
      const dt = Math.min((time - state.lastTime) / 1000, 0.1);
      state.lastTime = time;

      if (state.gameOver || state.isPaused) {
        requestRef.current = requestAnimationFrame(update);
        return;
      }

      // Physics update
      const targetX = (state.laneIdx - 1) * 200;
      state.smoothX += (targetX - state.smoothX) * 15 * dt;

      if (state.playerY > 0 || state.jumpVel > 0) {
        state.playerY += state.jumpVel * dt;
        state.jumpVel -= 4000 * dt; // Gravity
        if (state.playerY < 0) {
          state.playerY = 0;
          state.jumpVel = 0;
        }
      }

      state.distance += state.speed * dt;
      state.speed += 20 * dt; // Slow natural acceleration

      // Spawn obstacles farther out
      const lastObs = state.obstacles[state.obstacles.length - 1];
      if (!lastObs || lastObs.z < 2500) {
        if (Math.random() > 0.4) {
          const spawnLane = Math.floor(Math.random() * 3);
          state.obstacles.push({ lane: spawnLane, z: 4000, passed: false });
          
          // Chance for secondary obstacle in a different lane
          if (Math.random() > 0.7) {
             const secondLane = (spawnLane + 1 + Math.floor(Math.random() * 2)) % 3;
             state.obstacles.push({ lane: secondLane, z: 4000, passed: false });
          }
        }
      }

      // Move & Collide
      const playerZ = 150;
      for (let i = state.obstacles.length - 1; i >= 0; i--) {
        const obs = state.obstacles[i];
        obs.z -= state.speed * dt;

        const playerThickness = 80;
        
        // Z-Overlap Check
        if (obs.z < playerZ + playerThickness && obs.z > playerZ - playerThickness) {
          // X-Overlap Check
          const pX = state.smoothX;
          const oX = (obs.lane - 1) * 200;
          if (Math.abs(pX - oX) < 100) {
            // Y-Overlap Check
            if (state.playerY < 100) { // Hit by obstacle
              state.gameOver = true;
              setGameOver(true);
            }
          }
        }

        // Passed Obstacle Scoring
        if (obs.z < playerZ - playerThickness && !obs.passed && !state.gameOver) {
          obs.passed = true;
          state.score += 10;
          setLocalScore(Math.floor(state.score));
          onScoreUpdate(Math.floor(state.score));
        }

        // Cleanup
        if (obs.z < -200) {
           state.obstacles.splice(i, 1);
        }
      }

      draw();
      requestRef.current = requestAnimationFrame(update);
    };

    requestRef.current = requestAnimationFrame(update);
    
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [onScoreUpdate]);

  const draw = () => {
     const canvas = canvasRef.current;
     if (!canvas) return;
     const ctx = canvas.getContext('2d');
     if (!ctx) return;
     const width = canvas.width;
     const height = canvas.height;

     // Transparent Background
     ctx.clearRect(0, 0, width, height);

     const project = (x: number, y: number, z: number) => {
        const fov = 350;
        const scale = fov / (fov + Math.max(0, z));
        return {
            x: width / 2 + x * scale,
            y: height / 2 + y * scale,
            scale
        };
     };

     const cameraY = 150;
     const state = gameState.current;

     // Horizon Background
     const hLine = project(0, cameraY, 4000);
     ctx.fillStyle = '#000000';
     ctx.fillRect(0, 0, width, hLine.y);
     
     // Horizon Line Glow
     ctx.strokeStyle = '#00ffff';
     ctx.shadowBlur = 10;
     ctx.shadowColor = '#00ffff';
     ctx.lineWidth = 2;
     ctx.beginPath();
     ctx.moveTo(0, hLine.y);
     ctx.lineTo(width, hLine.y);
     ctx.stroke();
     ctx.shadowBlur = 0;
     ctx.lineWidth = 1;

     // Grid Floor Effects
     ctx.globalAlpha = 0.4;
     ctx.strokeStyle = '#ff00ff';
     
     // Lane separators
     for (let i = -2; i <= 2; i++) {
       ctx.beginPath();
       const top = project(i * 100, cameraY, 4000);
       const bottom = project(i * 100, cameraY, 0);
       ctx.moveTo(bottom.x, bottom.y);
       ctx.lineTo(top.x, top.y);
       ctx.stroke();
     }

     // Moving horizontal lines
     ctx.strokeStyle = '#00ffff';
     const floorSpacing = 300;
     const zOffset = state.distance % floorSpacing;
     for (let i = 0; i < 20; i++) {
        const z = i * floorSpacing - zOffset;
        if (z < 0) continue;
        ctx.beginPath();
        const left = project(-600, cameraY, z);
        const right = project(600, cameraY, z);
        ctx.moveTo(left.x, left.y);
        ctx.lineTo(right.x, right.y);
        ctx.stroke();
     }
     ctx.globalAlpha = 1.0;

     // Sort to draw furthest objects first (Painter's Algorithm)
     const drawList = [...state.obstacles].sort((a,b) => b.z - a.z);
     
     drawList.forEach(obs => {
        if (obs.z < 0) return;
        const obsX = (obs.lane - 1) * 200;
        const size = 120;
        
        const pBot = project(obsX, cameraY, obs.z);
        const pTop = project(obsX, cameraY - size, obs.z);
        const w = size * pBot.scale;
        const h = pBot.y - pTop.y;
        
        ctx.fillStyle = '#ff00ff'; // Glitch Magenta
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff00ff';
        ctx.fillRect(pBot.x - w/2, pTop.y, w, h);
        ctx.shadowBlur = 0;
        
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(pBot.x - w/2, pTop.y, w, h);
        
        // Inner Cross for styling
        ctx.beginPath();
        ctx.moveTo(pBot.x - w/2, pTop.y);
        ctx.lineTo(pBot.x + w/2, pBot.y);
        ctx.moveTo(pBot.x + w/2, pTop.y);
        ctx.lineTo(pBot.x - w/2, pBot.y);
        ctx.stroke();
     });

     // Player Rendering
     const playerZ = 150;
     const pBot = project(state.smoothX, cameraY - state.playerY, playerZ);
     const pBodySize = 100;
     const pTop = project(state.smoothX, cameraY - state.playerY - pBodySize, playerZ);
     const pw = pBodySize * pBot.scale;
     const ph = pBot.y - pTop.y;

     ctx.fillStyle = '#00ffff'; // Glitch Cyan
     ctx.shadowBlur = 20;
     ctx.shadowColor = '#00ffff';
     ctx.fillRect(pBot.x - pw/2, pTop.y, pw, ph);
     ctx.shadowBlur = 0;
     
     ctx.strokeStyle = '#ff00ff';
     ctx.lineWidth = 4;
     ctx.strokeRect(pBot.x - pw/2, pTop.y, pw, ph);

     // Glowing Core Pattern
     ctx.fillStyle = '#000000';
     ctx.fillRect(pBot.x - pw/6, pTop.y + ph/3, pw/3, ph/3);
  };

  return (
    <div className="relative flex flex-col items-center justify-center font-vt w-full h-full">
      <div 
        className="w-full max-w-[500px] aspect-square border-[6px] border-[#0ff] bg-[#000] relative flex items-center justify-center p-1" 
      >
        <div className="absolute inset-0 border-2 border-[#f0f] m-2 pointer-events-none"></div>
        <canvas
          ref={canvasRef}
          width={600}
          height={600}
          className="block w-full h-full object-cover scanlines noise-bg"
        />
        
        {gameOver && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-10">
            <h2 className="text-4xl text-[#f0f] tracking-widest mb-4 font-pixel glitch-text" data-text="FATAL_ERROR">
              FATAL_ERROR
            </h2>
            <p className="text-[#0ff] text-2xl mb-6 font-pixel bg-[#f0f]/20 px-4 py-2 border border-[#0ff]">SCORE_LOG: {localScore}</p>
            <button
              onClick={resetGame}
              className="px-6 py-4 border-4 border-[#0ff] text-[#0ff] font-pixel text-xl uppercase tracking-wider hover:bg-[#f0f] hover:text-white hover:border-[#f0f] transition-none shadow-[4px_4px_0_#f0f]"
            >
              EXEC_REBOOT
            </button>
          </div>
        )}

        {isPaused && !gameOver && (
           <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10 border-4 border-[#f0f] m-8">
             <h2 className="text-4xl text-[#0ff] font-pixel tracking-widest glitch-text" data-text="SYS_PAUSED">
               SYS_PAUSED
             </h2>
             <p className="text-[#f0f] mt-4 text-xl font-vt tracking-widest bg-black px-2">&gt; INPUT WAIT</p>
           </div>
        )}

        <div className="absolute bottom-6 left-6 text-sm text-[#0ff] opacity-80 font-pixel drop-shadow-[0_0_5px_#f0f] pointer-events-none">SYS_FRAME_RENDER: 60FPS // ENGINE_ID: GLITCH_RUN</div>
      </div>

      <div className="mt-8 flex justify-between w-full max-w-[500px] text-[#f0f] text-sm sm:text-base tracking-widest font-pixel">
        <p>CTRL_SEQ: WASD/SPACE</p>
        <p>HALT: P/ESC</p>
      </div>
    </div>
  );
}
