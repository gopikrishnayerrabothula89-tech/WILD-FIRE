import React, { useEffect, useRef, useState, useCallback } from 'react';

const GRID_SIZE = 20;
const CELL_SIZE = 20;

type Point = { x: number; y: number };

const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };

export default function SnakeGame({ onScoreUpdate }: { onScoreUpdate: (score: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Point>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Point>({ x: 15, y: 5 });
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);

  const directionRef = useRef(INITIAL_DIRECTION);

  const generateFood = useCallback((currentSnake: Point[]) => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      // eslint-disable-next-line no-loop-func
      if (!currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
        break;
      }
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    directionRef.current = INITIAL_DIRECTION;
    setFood({ x: 15, y: 5 });
    setGameOver(false);
    setScore(0);
    onScoreUpdate(0);
    setIsPaused(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault(); // Prevent page scrolling
      }

      if (e.key === ' ') {
        e.preventDefault();
        setIsPaused(prev => !prev);
        return;
      }

      if (gameOver) return;

      const newDir = { ...directionRef.current };
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          if (directionRef.current.y === 0) { newDir.x = 0; newDir.y = -1; }
          break;
        case 'ArrowDown':
        case 's':
          if (directionRef.current.y === 0) { newDir.x = 0; newDir.y = 1; }
          break;
        case 'ArrowLeft':
        case 'a':
          if (directionRef.current.x === 0) { newDir.x = -1; newDir.y = 0; }
          break;
        case 'ArrowRight':
        case 'd':
          if (directionRef.current.x === 0) { newDir.x = 1; newDir.y = 0; }
          break;
      }
      setDirection(newDir);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver]);

  // Sync actual direction reference for use in game loop
  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  // Game loop
  useEffect(() => {
    if (gameOver || isPaused) return;

    const moveSnake = () => {
      setSnake(prevSnake => {
        const head = prevSnake[0];
        const newHead = {
          x: head.x + directionRef.current.x,
          y: head.y + directionRef.current.y,
        };

        // Check walls collision
        if (
          newHead.x < 0 ||
          newHead.x >= GRID_SIZE ||
          newHead.y < 0 ||
          newHead.y >= GRID_SIZE
        ) {
          setGameOver(true);
          return prevSnake;
        }

        // Check self collision
        if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Check food collision
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => {
            const newScore = s + 10;
            onScoreUpdate(newScore);
            return newScore;
          });
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const intervalId = setInterval(moveSnake, 120);
    return () => clearInterval(intervalId);
  }, [gameOver, isPaused, food, onScoreUpdate, generateFood]);

  // Render to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Make canvas transparent

    // Draw snake
    snake.forEach((segment, index) => {
      // Create a neon glow effect for snake head
      if (index === 0) {
        ctx.fillStyle = '#39FF14'; // Neon Green
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#39FF14';
      } else {
        ctx.fillStyle = '#22cc0b'; // Slightly darker green for body
        ctx.shadowBlur = 0;
      }
      ctx.fillRect(segment.x * CELL_SIZE, segment.y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
    });
    ctx.shadowBlur = 0; // reset shadow for rest

    // Draw food (red)
    ctx.fillStyle = '#ef4444';
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#ef4444';
    ctx.beginPath();
    ctx.arc(
      food.x * CELL_SIZE + CELL_SIZE / 2,
      food.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2 - 2,
      0,
      2 * Math.PI
    );
    ctx.fill();
    ctx.shadowBlur = 0;

  }, [snake, food]);

  return (
    <div className="relative flex flex-col items-center justify-center font-mono w-full">
      <div 
        className="w-full max-w-[500px] aspect-square border-2 border-[#1a1a1a] bg-[#050505] rounded shadow-2xl relative overflow-hidden flex items-center justify-center" 
        style={{backgroundImage: "radial-gradient(#111 1px, transparent 1px)", backgroundSize: "24px 24px"}}
      >
        <canvas
          ref={canvasRef}
          width={GRID_SIZE * CELL_SIZE}
          height={GRID_SIZE * CELL_SIZE}
          className="block"
        />
        
        {gameOver && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
            <h2 className="text-4xl text-[#39FF14] font-bold tracking-widest mb-4 shadow-[0_0_15px_rgba(57,255,20,0.8)]" style={{textShadow: "0 0 10px #39FF14, 0 0 20px #39FF14"}}>
              SYSTEM HALT
            </h2>
            <p className="text-white text-xl mb-6 shadow-[#39FF14]">Score: {score}</p>
            <button
              onClick={resetGame}
              className="px-6 py-2 border-2 border-[#39FF14] text-[#39FF14] font-bold uppercase tracking-wider rounded hover:bg-[#39FF14] hover:text-black transition-colors shadow-[0_0_10px_rgba(57,255,20,0.5)] hover:shadow-[0_0_20px_rgba(57,255,20,0.9)]"
            >
              Reboot Sequence
            </button>
          </div>
        )}

        {isPaused && !gameOver && (
           <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
             <h2 className="text-3xl text-zinc-400 font-bold tracking-widest">
               STANDBY
             </h2>
             <p className="text-zinc-500 mt-2 text-sm">(Space to resume)</p>
           </div>
        )}

        <div className="absolute bottom-4 left-4 text-[10px] text-zinc-600 font-mono">SYS_FRAME_RENDER: 60FPS // ENGINE_ID: VIPER_01</div>
      </div>

      <div className="mt-6 flex justify-between w-full max-w-[500px] text-[#71717a] text-xs tracking-widest uppercase">
        <p>Controls: WASD / Arrows</p>
        <p>Pause: Space</p>
      </div>
    </div>
  );
}
