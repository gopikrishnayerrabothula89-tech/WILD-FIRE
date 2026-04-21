import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX } from 'lucide-react';

const PLAYLIST = [
  {
    title: 'NEURON_OVERRIDE.exe',
    artist: 'NULL_POINTER',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  },
  {
    title: 'SYNTH_INJECTION_V2',
    artist: 'SYS.ADMIN',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
  },
  {
    title: 'CORRUPTED_SECTOR.dat',
    artist: 'UNKNOWN_HOST',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
  }
];

export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);

  const currentTrack = PLAYLIST[currentTrackIndex];

  // Handle play/pause
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => {
            console.error("Audio playback error: ", e);
            setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex]);

  const handleEnded = () => {
    handleNext();
  };

  const handleNext = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % PLAYLIST.length);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + PLAYLIST.length) % PLAYLIST.length);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    setIsPlaying(prev => !prev);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      if (duration) {
        setProgress((current / duration) * 100);
      }
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current && audioRef.current.duration) {
      const p = parseFloat(e.target.value);
      setProgress(p);
      const newTime = (p / 100) * audioRef.current.duration;
      audioRef.current.currentTime = newTime;
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full font-vt">
      <audio
        ref={audioRef}
        src={currentTrack.url}
        onEnded={handleEnded}
        onTimeUpdate={handleTimeUpdate}
      />
      
      <div className="flex flex-col gap-2">
        <h2 className="text-sm tracking-[0.2em] text-[#0ff] font-pixel border-b-2 border-[#f0f] pb-2">AUDIO_STREAM</h2>
        
        {/* Track Display */}
        <div className="p-4 bg-black border-2 border-[#f0f] flex flex-col gap-4 relative">
           <div className="flex items-center gap-4">
             <div className="w-16 h-16 bg-[#0ff] flex items-center justify-center shrink-0 border-2 border-[#f0f]">
               <div className="text-black font-pixel text-3xl animate-pulse">!</div>
             </div>
             <div className="flex-1 overflow-hidden">
               <div className="text-xl font-pixel text-[#f0f] truncate glitch-text shrink" data-text={currentTrack.title}>{currentTrack.title}</div>
               <div className="text-lg text-[#0ff] truncate mt-1">:: {currentTrack.artist}</div>
             </div>
           </div>

           {/* Progress */}
           <div className="flex items-center gap-3 mt-4">
             <button onClick={toggleMute} className="text-[#f0f] hover:text-[#0ff] transition-none outline-none focus:outline-none bg-black p-1 border border-[#0ff] cursor-pointer">
               {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
             </button>
             <div className="flex-1 bg-black border border-[#0ff] h-4 relative cursor-pointer group">
               <input
                 type="range"
                 min="0"
                 max="100"
                 value={progress || 0}
                 onChange={handleProgressChange}
                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
               />
               <div 
                 className="bg-[#f0f] h-full transition-all group-hover:bg-[#0ff]" 
                 style={{width: `${progress}%`}}
               ></div>
               <div className="absolute top-0 right-0 h-full w-2 bg-white animate-pulse"></div>
             </div>
           </div>
           
           {/* Playback Controls */}
           <div className="flex items-center justify-center gap-8 mt-4">
             <button onClick={handlePrev} className="text-[#0ff] hover:text-[#f0f] transition-none square-btn text-2xl border-2 border-[#0ff] p-2 bg-black hover:bg-[#0ff]/20 outline-none cursor-pointer">
               <SkipBack size={24} />
             </button>
             <button 
                onClick={togglePlay} 
                className="text-[#0ff] hover:text-[#f0f] focus:text-[#000] transition-none square-btn text-2xl border-4 border-[#f0f] p-3 bg-black hover:bg-[#f0f]/20 outline-none cursor-pointer"
             >
               {isPlaying ? <Pause size={32} /> : <Play size={32} />}
             </button>
             <button onClick={handleNext} className="text-[#0ff] hover:text-[#f0f] transition-none square-btn text-2xl border-2 border-[#0ff] p-2 bg-black hover:bg-[#0ff]/20 outline-none cursor-pointer">
               <SkipForward size={24} />
             </button>
           </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm tracking-[0.2em] text-[#0ff] font-pixel border-b-2 border-[#f0f] pb-2">MEDIA_QUEUE</h2>
        <div className="flex flex-col gap-2 mt-2">
          {PLAYLIST.map((track, idx) => (
            <div 
              key={idx} 
              className={`p-3 border-2 flex items-center gap-3 transition-none cursor-pointer hover:bg-[#0ff]/10 ${
                idx === currentTrackIndex 
                  ? 'border-[#f0f] bg-[#f0f]/10' 
                  : 'border-[#0ff]/30 bg-black'
              }`}
              onClick={() => {
                setCurrentTrackIndex(idx);
                if (!isPlaying) { setIsPlaying(true); }
              }}
            >
              <div className="w-8 h-8 bg-black border border-[#0ff] flex items-center justify-center shrink-0">
                 {idx === currentTrackIndex && isPlaying && (
                    <div className="w-full h-full bg-[#f0f] animate-ping border border-[#0ff]"></div>
                 )}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className={`text-[10px] font-pixel truncate mt-1 ${idx === currentTrackIndex ? 'text-[#f0f]' : 'text-[#0ff]'}`}>
                  {track.title}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
