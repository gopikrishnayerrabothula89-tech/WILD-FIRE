import React, { useState } from 'react';
import EndlessRunner from './components/EndlessRunner';
import MusicPlayer from './components/MusicPlayer';

export default function App() {
  const [score, setScore] = useState(0);

  return (
    <div className="h-screen w-full bg-black text-[#0ff] font-vt uppercase overflow-hidden noise-bg scanlines crt-flicker">
      <div className="h-full w-full flex flex-col border-[8px] border-[#f0f] p-2 relative z-10">
        <header className="h-24 border-b-4 border-[#0ff] flex items-center justify-between px-8 bg-black shrink-0 relative">
          <div className="absolute inset-0 bg-[#f0f] opacity-20 animate-pulse mix-blend-color-dodge"></div>
          <div className="flex items-center gap-6 relative z-10">
            <h1 className="text-3xl md:text-4xl font-pixel text-[#0ff] glitch-text" data-text="SYS.RUNNER">
              SYS.RUNNER
            </h1>
          </div>
          <div className="flex items-center gap-12 relative z-10">
            <div className="text-center border-l-4 border-[#f0f] pl-4">
              <div className="text-sm tracking-[0.3em] text-[#f0f] mb-1 font-pixel">DATA_SEQ_SCORE</div>
              <div className="text-4xl font-pixel text-[#0ff]">
                {score.toString().padStart(6, '0')}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          <aside className="w-full md:w-[380px] border-r-4 border-[#0ff] bg-black p-6 flex flex-col gap-6 overflow-y-auto shrink-0 relative">
            <MusicPlayer />
            
            <div className="mt-auto p-4 bg-black border-2 border-[#f0f]">
              <div className="text-sm tracking-widest text-[#0ff] mb-4 font-pixel glitch-text" data-text="DIAGNOSTICS">DIAGNOSTICS</div>
              <div className="space-y-4">
                <div className="flex justify-between text-lg">
                  <span className="text-[#f0f]">&gt; VELOCITY_MULT</span>
                  <span className="text-[#0ff]">x{Math.max(1, Math.floor(score / 50) + 1).toFixed(1)}</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span className="text-[#f0f]">&gt; ENTS_BYPASSED</span>
                  <span className="text-[#0ff]">{Math.floor(score / 10)}</span>
                </div>
                <div className="w-full bg-[#f0f]/20 h-4 border border-[#0ff] mt-3 relative">
                  <div 
                    className="bg-[#0ff] h-full" 
                    style={{width: `${Math.min(100, (score % 50) * 2)}%`}}
                  ></div>
                </div>
              </div>
            </div>
          </aside>

          <section className="flex-1 bg-black relative flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden">
             {/* decorative corners */}
             <div className="absolute top-0 left-0 w-8 h-8 border-t-8 border-l-8 border-[#f0f]"></div>
             <div className="absolute top-0 right-0 w-8 h-8 border-t-8 border-r-8 border-[#0ff]"></div>
             <div className="absolute bottom-0 left-0 w-8 h-8 border-b-8 border-l-8 border-[#0ff]"></div>
             <div className="absolute bottom-0 right-0 w-8 h-8 border-b-8 border-r-8 border-[#f0f]"></div>

            <EndlessRunner onScoreUpdate={setScore} />
          </section>
        </main>
      </div>
    </div>
  );
}
