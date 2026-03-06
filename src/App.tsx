/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useRef, useMemo } from 'react';
import { motion, useScroll, useSpring, AnimatePresence } from 'motion/react';

const SECTIONS = [
  { id: 'hero', label: '01. ORIGIN' },
  { id: 'photosynthesis', label: '02. SYNTHESIS' },
  { id: 'respiration', label: '03. RELEASE' },
  { id: 'decomposition', label: '04. DECAY' },
  { id: 'carbon-storage', label: '05. STORAGE' },
  { id: 'water-cycle', label: '06. FLUX' },
  { id: 'closed-loop', label: '07. LOOP' },
];

const GrainOverlay = () => (
  <div className="grain-overlay">
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <filter id="noiseFilter">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#noiseFilter)" />
    </svg>
  </div>
);

const Tooltip = ({ text }: { text: string }) => (
  <div className="tooltip left-1/2">
    {text}
  </div>
);

const MoleculeTracer = ({ path, color, isActive }: { path: string; color: string; isActive: boolean }) => {
  const pathRef = useRef<SVGPathElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isActive && pathRef.current) {
      let start: number | null = null;
      const duration = 3000;

      const animate = (time: number) => {
        if (!start) start = time;
        const p = Math.min((time - start) / duration, 1);
        setProgress(p);
        if (p < 1) requestAnimationFrame(animate);
      };

      requestAnimationFrame(animate);
    } else {
      setProgress(0);
    }
  }, [isActive]);

  return (
    <g className="pointer-events-none">
      <path
        ref={pathRef}
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="1"
        opacity="0.1"
      />
      {/* Trail */}
      {[0.02, 0.04, 0.06, 0.08].map((p, i) => (
        progress > p && (
          <motion.circle
            key={i}
            r={2 - i * 0.3}
            fill={color}
            opacity={0.3 - i * 0.05}
            style={{
              offsetPath: `path("${path}")`,
              offsetDistance: `${(progress - p) * 100}%`,
            }}
          />
        )
      ))}
      {/* Head */}
      {progress > 0 && (
        <motion.circle
          r="3"
          fill={color}
          style={{
            offsetPath: `path("${path}")`,
            offsetDistance: `${progress * 100}%`,
          }}
          className="shadow-[0_0_15px_currentColor]"
        />
      )}
    </g>
  );
};

const CO2Particles = () => {
  const particles = useMemo(() => {
    return Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      duration: `${10 + Math.random() * 15}s`,
      delay: `${Math.random() * -20}s`,
      size: 0.5 + Math.random() * 0.5,
      drift: `${(Math.random() - 0.5) * 100}px`,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="co2-particle"
          style={{
            left: p.left,
            animationDuration: p.duration,
            animationDelay: p.delay,
            '--drift': p.drift,
          } as any}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" style={{ transform: `scale(${p.size})` }}>
            <circle cx="10" cy="10" r="4" fill="currentColor" />
            <circle cx="4" cy="10" r="3" fill="currentColor" opacity="0.6" />
            <circle cx="16" cy="10" r="3" fill="currentColor" opacity="0.6" />
          </svg>
        </div>
      ))}
    </div>
  );
};

const SectionHeading = ({ number, title, colorClass }: { number: string; title: string; colorClass: string }) => (
  <div className="mb-8 overflow-hidden">
    <motion.span 
      initial={{ translateY: -20, opacity: 0 }}
      whileInView={{ translateY: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`font-mono text-xs tracking-[0.4em] uppercase ${colorClass} mb-2 block`}
    >
      {number}
    </motion.span>
    <motion.h2 
      initial={{ translateY: 20, opacity: 0 }}
      whileInView={{ translateY: 0, opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
      className="text-5xl md:text-7xl italic font-display tracking-tight"
    >
      {title}
    </motion.h2>
  </div>
);

const ChemicalEquation = ({ equation, colorClass }: { equation: string; colorClass: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
    className={`glass-box border-l-4 ${colorClass} my-8`}
  >
    <span className="text-[10px] uppercase tracking-widest opacity-40 block mb-2">Chemical Equation</span>
    <code className="text-sm md:text-base font-mono tracking-tight text-white/90">
      {equation}
    </code>
  </motion.div>
);

export default function App() {
  const [activeSection, setActiveSection] = useState('hero');
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    container: containerRef
  });
  
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const observerOptions = {
      root: containerRef.current,
      threshold: 0.5,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.target.id !== activeSection) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    
    SECTIONS.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative bg-bg text-white selection:bg-accent selection:text-bg">
      <GrainOverlay />
      <CO2Particles />
      
      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-accent origin-left z-50"
        style={{ scaleX }}
      />

      {/* Navigation Dots */}
      <nav className="fixed right-8 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-6 items-end">
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            onClick={() => scrollToSection(section.id)}
            className="group flex items-center gap-4 cursor-pointer relative"
          >
            <span className={`text-[10px] tracking-widest transition-all duration-500 opacity-0 group-hover:opacity-100 ${activeSection === section.id ? 'opacity-100 text-accent' : 'text-white/40'}`}>
              {section.label}
            </span>
            <div
              className={`w-2 h-2 rounded-full transition-all duration-500 border relative ${
                activeSection === section.id
                  ? 'bg-accent border-accent scale-125 nav-dot-active'
                  : 'bg-transparent border-white/20 group-hover:border-white/60'
              }`}
            />
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main ref={containerRef} className="snap-container no-scrollbar">
        {/* Hero Section */}
        <section id="hero" className="snap-section flex flex-col items-center justify-center relative overflow-hidden">
          <motion.div 
            style={{ y: useSpring(scrollYProgress, { stiffness: 50, damping: 20 }) }}
            className="absolute inset-0 opacity-20 pointer-events-none"
          >
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-solar/10 rounded-full blur-[120px]" />
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="text-center z-10 px-6"
          >
            <span className="text-accent text-xs tracking-[0.6em] uppercase mb-8 block font-mono">as seen through a terrarium</span>
            <h1 className="text-[96px] md:text-[120px] font-light tracking-tighter mb-8 italic font-display leading-none">The Carbon Cycle</h1>
            <p className="max-w-2xl mx-auto text-white/40 text-sm leading-relaxed tracking-widest font-mono uppercase">
              A closed system of transformation.
            </p>
          </motion.div>
          
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-40 animate-bounce-subtle">
            <span className="text-[10px] tracking-[0.3em] uppercase">Scroll</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
            </svg>
          </div>
        </section>

        {/* Photosynthesis Section */}
        <section id="photosynthesis" className="snap-section flex items-center justify-center relative bg-bg overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 w-full h-full">
            <div className="flex items-center justify-center p-12 bg-accent/5 border-r border-white/5 relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, x: -50 }}
                whileInView={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ duration: 1 }}
                className="w-full max-w-lg"
              >
                {/* Leaf Cross Section SVG - Enhanced 3D-like Detail */}
                <svg viewBox="0 0 400 400" className="w-full h-auto drop-shadow-[0_0_30px_rgba(92,186,92,0.2)]">
                  <defs>
                    <linearGradient id="cellGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#7ed97e" />
                      <stop offset="100%" stopColor="#3d7a3d" />
                    </linearGradient>
                    <radialGradient id="chloroplastGrad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#a8e6a8" />
                      <stop offset="100%" stopColor="#2d5a2d" />
                    </radialGradient>
                    <filter id="innerShadow">
                      <feOffset dx="1" dy="1" />
                      <feGaussianBlur stdDeviation="1" result="offset-blur" />
                      <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
                      <feFlood floodColor="black" floodOpacity="0.3" result="color" />
                      <feComposite operator="in" in="color" in2="inverse" result="shadow" />
                      <feComposite operator="over" in="shadow" in2="SourceGraphic" />
                    </filter>
                  </defs>
                  
                  <MoleculeTracer path="M180 360 Q200 300 180 200 Q160 100 200 60" color="#5cba5c" isActive={activeSection === 'photosynthesis'} />
                  
                  {/* Waxy Cuticle Layer */}
                  <g className="group">
                    <rect x="40" y="60" width="320" height="10" rx="2" fill="#a8e6a8" opacity="0.4" stroke="#5cba5c" strokeWidth="0.5" className="svg-hover-element" />
                    <Tooltip text="Waxy Cuticle: Prevents water loss." />
                  </g>

                  {/* Upper Epidermis */}
                  <g className="group">
                    <rect x="40" y="70" width="320" height="20" rx="4" fill="none" stroke="#5cba5c" strokeWidth="1" className="svg-hover-element" />
                    {Array.from({ length: 10 }).map((_, i) => (
                      <rect key={i} x={45 + i * 31} y="72" width="28" height="16" rx="2" fill="#5cba5c" opacity="0.1" />
                    ))}
                    <Tooltip text="Upper Epidermis: Transparent layer for light penetration." />
                  </g>

                  {/* Palisade Mesophyll - 3D Cells */}
                  {Array.from({ length: 10 }).map((_, i) => (
                    <g key={i} className="group">
                      <rect 
                        x={50 + i * 30} y="100" width="25" height="90" rx="12" 
                        fill="url(#cellGrad)" stroke="#2d5a2d" strokeWidth="0.5" 
                        filter="url(#innerShadow)"
                        className="svg-hover-element" 
                      />
                      {/* Chloroplasts inside */}
                      {Array.from({ length: 6 }).map((_, j) => (
                        <circle 
                          key={j} 
                          cx={62.5 + i * 30} cy={115 + j * 12} r="3" 
                          fill="url(#chloroplastGrad)" 
                        >
                          <animate attributeName="opacity" values="0.6;1;0.6" dur={`${2 + i * 0.2}s`} repeatCount="indefinite" />
                        </circle>
                      ))}
                      <Tooltip text="Palisade Cell: Packed with chloroplasts for max light absorption." />
                    </g>
                  ))}

                  {/* Spongy Mesophyll - 3D Spheres */}
                  {Array.from({ length: 12 }).map((_, i) => (
                    <g key={i} className="group">
                      <circle 
                        cx={70 + (i % 4) * 80} cy={220 + Math.floor(i / 4) * 40} r="18" 
                        fill="url(#cellGrad)" stroke="#2d5a2d" strokeWidth="0.5" 
                        filter="url(#innerShadow)"
                        className="svg-hover-element" 
                      />
                      <Tooltip text="Spongy Cell: Large air spaces for gas diffusion." />
                    </g>
                  ))}

                  {/* Vascular Bundle (Vein) */}
                  <g className="group">
                    <circle cx="200" cy="240" r="30" fill="none" stroke="#4a9eff" strokeWidth="2" strokeDasharray="4 2" className="svg-hover-element" />
                    <text x="185" y="245" fill="#4a9eff" fontSize="8" className="font-mono">XYLEM</text>
                    <Tooltip text="Vascular Bundle: Transports water (Xylem) and sugar (Phloem)." />
                  </g>

                  {/* Stomata & Guard Cells */}
                  <g className="group">
                    <ellipse cx="185" cy="330" rx="10" ry="15" fill="none" stroke="#ffd84a" strokeWidth="1.5" className="svg-hover-element" />
                    <ellipse cx="215" cy="330" rx="10" ry="15" fill="none" stroke="#ffd84a" strokeWidth="1.5" className="svg-hover-element" />
                    <path d="M195 320 Q200 330 205 320" fill="none" stroke="#ffd84a" strokeWidth="2" />
                    <Tooltip text="Stomata: Regulated by guard cells to control gas exchange." />
                  </g>
                  
                  <motion.text 
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    x="175" y="370" fill="#ffd84a" fontSize="10" className="font-mono font-bold"
                  >
                    CO₂ IN
                  </motion.text>
                  
                  <motion.text 
                    animate={{ y: [0, 5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                    x="240" y="370" fill="#4a9eff" fontSize="10" className="font-mono font-bold"
                  >
                    O₂ OUT
                  </motion.text>

                  {/* Sunlight Rays - Enhanced */}
                  <g className="group">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <motion.line 
                        key={i}
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: [0, 0.4, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
                        x1={300 + i * 20} y1="0" x2={250 + i * 20} y2="100" 
                        stroke="#ffd84a" strokeWidth="2" 
                        className="svg-hover-element" 
                      />
                    ))}
                    <Tooltip text="Solar Energy: Captured by chlorophyll pigments." />
                  </g>
                </svg>
              </motion.div>
            </div>
            <div className="flex flex-col justify-center section-padding relative">
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <motion.span 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.36 }}
                  className="badge bg-accent/20 text-accent border border-accent/30"
                >
                  Carbon Sink
                </motion.span>
                <SectionHeading number="STAGE 01" title="Photosynthesis" colorClass="text-accent" />
                <div className="space-y-6 text-white/60 text-sm leading-relaxed max-w-md">
                  <p>
                    Photosynthesis is the foundational process of the carbon cycle, where autotrophs—primarily plants, algae, and cyanobacteria—harness solar radiation to synthesize high-energy organic molecules. Within the chloroplasts, chlorophyll pigments capture photons, initiating a complex series of reactions that split water molecules and fix atmospheric carbon dioxide.
                  </p>
                  <p>
                    This biological carbon fixation transforms inorganic carbon into glucose, a stable form of chemical energy. This process not only builds the physical structure of the biosphere but also releases oxygen as a vital byproduct, supporting almost all aerobic life on Earth.
                  </p>
                </div>
                <ChemicalEquation equation="6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂" colorClass="border-accent" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Respiration Section */}
        <section id="respiration" className="snap-section flex items-center justify-center relative bg-bg overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 w-full h-full">
            <div className="flex flex-col justify-center section-padding order-2 md:order-1 relative">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <motion.span 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 }}
                  className="badge bg-solar/20 text-solar border border-solar/30"
                >
                  Carbon Source
                </motion.span>
                <SectionHeading number="STAGE 02" title="Respiration" colorClass="text-solar" />
                <div className="space-y-6 text-white/60 text-sm leading-relaxed max-w-md">
                  <p>
                    Cellular respiration is the metabolic counterpart to photosynthesis. It occurs within the mitochondria of all living cells, where organic carbon compounds are oxidized to release the chemical energy required for life's processes. This oxidation breaks the carbon-carbon bonds formed during synthesis.
                  </p>
                  <p>
                    As energy is harvested in the form of ATP, carbon is released back into the environment as carbon dioxide. This continuous flux between synthesis and respiration maintains the atmospheric balance, ensuring that carbon remains available for future generations of primary producers.
                  </p>
                </div>
                <ChemicalEquation equation="C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + ATP" colorClass="border-solar" />
              </motion.div>
            </div>
            <div className="flex items-center justify-center section-padding bg-solar/5 border-l border-white/5 order-1 md:order-2">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, x: 50 }}
                whileInView={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ duration: 1 }}
                className="w-full max-w-lg"
              >
                {/* Mitochondria SVG - Enhanced 3D Detail */}
                <svg viewBox="0 0 400 400" className="w-full h-auto drop-shadow-[0_0_30px_rgba(255,216,74,0.1)]">
                  <defs>
                    <linearGradient id="mitoOuterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ffd84a" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#e07840" stopOpacity="0.2" />
                    </linearGradient>
                    <linearGradient id="mitoInnerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ffd84a" />
                      <stop offset="100%" stopColor="#e07840" />
                    </linearGradient>
                  </defs>

                  <MoleculeTracer path="M200 220 Q250 180 200 120 Q150 60 200 30" color="#ffd84a" isActive={activeSection === 'respiration'} />
                  
                  {/* Outer Membrane - 3D Bean Shape */}
                  <g className="group">
                    <path 
                      d="M80 200 C80 120 150 80 200 80 C250 80 320 120 320 200 C320 280 250 320 200 320 C150 320 80 280 80 200" 
                      fill="url(#mitoOuterGrad)" stroke="#ffd84a" strokeWidth="2" 
                      className="svg-hover-element" 
                    />
                    <Tooltip text="Outer Membrane: Permeable to small molecules." />
                  </g>

                  {/* Inner Membrane (Cristae) - Complex Folds */}
                  <g className="group">
                    <path 
                      d="M110 200 Q120 160 140 200 Q160 240 180 200 Q200 160 220 200 Q240 240 260 200 Q280 160 290 200" 
                      fill="none" stroke="#ffd84a" strokeWidth="2" strokeLinecap="round"
                      className="svg-hover-element" 
                    >
                      <animate attributeName="stroke-dasharray" values="0,1000;1000,0" dur="4s" repeatCount="indefinite" />
                    </path>
                    <Tooltip text="Cristae: Site of the Electron Transport Chain." />
                  </g>

                  {/* Matrix Area */}
                  <g className="group">
                    <path d="M140 180 Q200 140 260 180" fill="none" stroke="#ffd84a" strokeWidth="0.5" strokeDasharray="2 4" />
                    <text x="175" y="160" fill="#ffd84a" fontSize="8" className="font-mono opacity-60">MATRIX</text>
                    <Tooltip text="Matrix: Where the Krebs Cycle occurs." />
                  </g>

                  {/* ATP "Sparks" - Energy Release */}
                  {Array.from({ length: 12 }).map((_, i) => (
                    <motion.g
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ 
                        opacity: [0, 1, 0], 
                        scale: [0, 1.5, 0],
                        x: (Math.random() - 0.5) * 100,
                        y: (Math.random() - 0.5) * 100
                      }}
                      transition={{ 
                        duration: 1.5, 
                        repeat: Infinity, 
                        delay: i * 0.2,
                        ease: "easeOut"
                      }}
                      style={{ transformOrigin: "200px 200px" }}
                    >
                      <circle cx="200" cy="200" r="2" fill="#ffd84a" />
                      <circle cx="200" cy="200" r="4" fill="#ffd84a" opacity="0.2" />
                    </motion.g>
                  ))}

                  {/* Labels & Flux */}
                  <g className="group">
                    <motion.path 
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      d="M200 80 L200 40" stroke="#ffd84a" strokeWidth="1.5" markerEnd="url(#arrowhead)" 
                    />
                    <text x="210" y="50" fill="#ffd84a" fontSize="10" className="font-mono font-bold">CO₂ RELEASE</text>
                    <Tooltip text="Flux: Carbon returns to the atmosphere." />
                  </g>

                  <text x="140" y="350" fill="#ffd84a" fontSize="10" className="font-mono text-center">CELLULAR METABOLISM</text>
                </svg>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Decomposition Section */}
        <section id="decomposition" className="snap-section flex items-center justify-center relative bg-bg overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 w-full h-full">
            <div className="flex items-center justify-center section-padding bg-amber/5 border-r border-white/5">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, x: -50 }}
                whileInView={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ duration: 1 }}
                className="w-full max-w-lg"
              >
                {/* Fungi and Soil SVG - Enhanced 3D Detail */}
                <svg viewBox="0 0 400 400" className="w-full h-auto drop-shadow-[0_0_30px_rgba(224,120,64,0.1)]">
                  <defs>
                    <linearGradient id="soilGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#3d2b1f" />
                      <stop offset="100%" stopColor="#1a120b" />
                    </linearGradient>
                    <radialGradient id="microbeGrad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#e07840" />
                      <stop offset="100%" stopColor="#3d2b1f" />
                    </radialGradient>
                  </defs>

                  <MoleculeTracer path="M150 350 Q160 300 140 250 Q130 200 150 150 Q170 100 200 50" color="#e07840" isActive={activeSection === 'decomposition'} />
                  
                  {/* Soil Profile - 3D Layers */}
                  <g className="group">
                    <rect x="40" y="250" width="320" height="120" fill="url(#soilGrad)" stroke="#e07840" strokeWidth="0.5" className="svg-hover-element" />
                    <Tooltip text="Soil Profile: Complex matrix of organic and inorganic matter." />
                  </g>

                  {/* Organic Matter (Detritus) */}
                  {Array.from({ length: 15 }).map((_, i) => (
                    <motion.path 
                      key={i}
                      animate={{ rotate: [0, 5, 0] }}
                      transition={{ duration: 3, repeat: Infinity, delay: i * 0.2 }}
                      d={`M${60 + i * 20} 245 Q${70 + i * 20} 235 ${80 + i * 20} 245`} 
                      fill="none" stroke="#e07840" strokeWidth="1" opacity="0.6" 
                    />
                  ))}

                  {/* Fungal Mycelium Network - 3D Spreading */}
                  <g className="group">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <motion.path 
                        key={i}
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        transition={{ duration: 2, delay: i * 0.1 }}
                        d={`M200 250 Q${150 + i * 10} ${280 + i * 5} ${100 + i * 20} ${350 - i * 5}`} 
                        fill="none" stroke="#e07840" strokeWidth="0.5" strokeDasharray="2 2" 
                        className="svg-hover-element"
                      />
                    ))}
                    <Tooltip text="Mycelium: Underground network that breaks down organic matter." />
                  </g>

                  {/* Microbes - Animated Particles */}
                  {Array.from({ length: 20 }).map((_, i) => (
                    <motion.circle 
                      key={i}
                      animate={{ 
                        x: [0, Math.random() * 20 - 10, 0], 
                        y: [0, Math.random() * 20 - 10, 0],
                        opacity: [0.2, 0.8, 0.2]
                      }}
                      transition={{ duration: 2 + Math.random() * 2, repeat: Infinity }}
                      cx={60 + Math.random() * 280} cy={270 + Math.random() * 80} r="2" 
                      fill="url(#microbeGrad)" 
                    />
                  ))}

                  {/* Mushrooms - 3D-like */}
                  <g className="group">
                    <path d="M185 250 L215 250 L210 210 Q200 200 190 210 Z" fill="#3d2b1f" stroke="#e07840" strokeWidth="1" className="svg-hover-element" />
                    <path d="M160 210 Q200 160 240 210" fill="#e07840" stroke="#3d2b1f" strokeWidth="1" />
                    <Tooltip text="Fruiting Body: Releases spores and signals healthy decomposition." />
                  </g>

                  {/* Labels */}
                  <text x="140" y="100" fill="#e07840" fontSize="10" className="font-mono font-bold">CARBON RECYCLING</text>
                  <text x="130" y="385" fill="#e07840" fontSize="8" className="font-mono opacity-60">SOIL MICROBIOME</text>
                </svg>
              </motion.div>
            </div>
            <div className="flex flex-col justify-center section-padding relative">
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <motion.span 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.36 }}
                  className="badge bg-amber/20 text-amber border border-amber/30"
                >
                  Carbon Source
                </motion.span>
                <SectionHeading number="STAGE 03" title="Decomposition" colorClass="text-amber" />
                <div className="space-y-6 text-white/60 text-sm leading-relaxed max-w-md">
                  <p>
                    Decomposition is the biological breakdown of complex organic matter into simpler molecules. Fungi, bacteria, and detritivores act as the Earth's recyclers, secreting enzymes that dissolve the structural components of dead organisms, such as lignin and cellulose.
                  </p>
                  <p>
                    During this process, carbon that was sequestered in biological tissues is either incorporated into the soil matrix as humus or released into the atmosphere as CO₂ or methane (CH₄). This recycling ensures that the finite supply of carbon atoms remains in circulation, fueling new growth.
                  </p>
                </div>
                <ChemicalEquation equation="Organic Matter + O₂ → CO₂ + H₂O + Nutrients" colorClass="border-amber" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Carbon Storage Section */}
        <section id="carbon-storage" className="snap-section flex items-center justify-center relative bg-bg overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 w-full h-full">
            <div className="flex flex-col justify-center section-padding order-2 md:order-1 relative">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <motion.span 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 }}
                  className="badge bg-storage/20 text-storage border border-storage/30"
                >
                  Carbon Sink
                </motion.span>
                <SectionHeading number="STAGE 04" title="Carbon Storage" colorClass="text-storage" />
                <div className="space-y-6 text-white/60 text-sm leading-relaxed max-w-md">
                  <p>
                    Carbon storage, or sequestration, occurs when carbon is removed from the active cycle for extended periods. The Earth's lithosphere holds the largest share of carbon, stored in sedimentary rocks like limestone and in fossil fuel deposits formed from ancient organic remains.
                  </p>
                  <p>
                    The oceans act as a massive thermal and chemical buffer, absorbing nearly a third of anthropogenic CO₂ emissions. Within these reservoirs, carbon can remain trapped for millions of years, acting as a stabilizer for the global climate system until geological or human forces release it.
                  </p>
                </div>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.24 }}
                  className="glass-box border-l-4 border-storage my-8"
                >
                  <span className="text-[10px] uppercase tracking-widest opacity-40 block mb-2">Reservoir Capacity</span>
                  <p className="text-xs font-mono text-white/70 italic">Lithosphere: ~100,000,000 GtC</p>
                  <p className="text-xs font-mono text-white/70 italic">Oceans: ~38,000 GtC</p>
                </motion.div>
              </motion.div>
            </div>
            <div className="flex items-center justify-center section-padding bg-storage/5 border-l border-white/5 order-1 md:order-2">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, x: 50 }}
                whileInView={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ duration: 1 }}
                className="w-full max-w-lg"
              >
                {/* Geological Layers SVG - Enhanced Isometric 3D Detail */}
                <svg viewBox="0 0 400 400" className="w-full h-auto drop-shadow-[0_0_30px_rgba(142,142,142,0.1)]">
                  <defs>
                    <linearGradient id="layer1Grad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#8e8e8e" />
                      <stop offset="100%" stopColor="#4a4a4a" />
                    </linearGradient>
                    <linearGradient id="oilGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#1a1a1a" />
                      <stop offset="100%" stopColor="#000000" />
                    </linearGradient>
                  </defs>

                  <MoleculeTracer path="M50 150 L350 150 L350 280 L50 280" color="#8e8e8e" isActive={activeSection === 'carbon-storage'} />
                  
                  {/* Isometric Layers */}
                  <g transform="skewY(-10)">
                    {/* Top Layer (Active Soil) */}
                    <g className="group">
                      <rect x="50" y="100" width="300" height="30" fill="#5cba5c" fillOpacity="0.2" stroke="#8e8e8e" strokeWidth="1" className="svg-hover-element" />
                      <Tooltip text="Active Layer: Fast carbon exchange via biology." />
                    </g>
                    
                    {/* Sedimentary Rock Layer */}
                    <g className="group">
                      <rect x="50" y="130" width="300" height="60" fill="url(#layer1Grad)" fillOpacity="0.3" stroke="#8e8e8e" strokeWidth="1" className="svg-hover-element" />
                      <Tooltip text="Limestone/Sediment: Massive inorganic carbon reservoir." />
                    </g>

                    {/* Fossil Fuel Reservoir */}
                    <g className="group">
                      <rect x="50" y="190" width="300" height="80" fill="url(#layer1Grad)" fillOpacity="0.5" stroke="#8e8e8e" strokeWidth="1" className="svg-hover-element" />
                      {/* Oil/Gas Pockets */}
                      <ellipse cx="150" cy="230" rx="40" ry="20" fill="url(#oilGrad)" stroke="#8e8e8e" strokeWidth="0.5">
                        <animate attributeName="opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite" />
                      </ellipse>
                      <ellipse cx="250" cy="250" rx="30" ry="15" fill="url(#oilGrad)" stroke="#8e8e8e" strokeWidth="0.5">
                        <animate attributeName="opacity" values="0.6;1;0.6" dur="4s" repeatCount="indefinite" />
                      </ellipse>
                      <Tooltip text="Fossil Fuels: Ancient organic carbon sequestered for millions of years." />
                    </g>

                    {/* Bedrock */}
                    <g className="group">
                      <rect x="50" y="270" width="300" height="40" fill="#1a1a1a" stroke="#8e8e8e" strokeWidth="1" className="svg-hover-element" />
                      <Tooltip text="Lithosphere: The deepest and largest carbon sink." />
                    </g>
                  </g>

                  {/* Labels */}
                  <text x="140" y="360" fill="#8e8e8e" fontSize="10" className="font-mono font-bold">GEOLOGICAL SEQUESTRATION</text>
                  <text x="280" y="120" fill="#8e8e8e" fontSize="8" className="font-mono opacity-60" transform="skewY(-10)">BIOSPHERE</text>
                  <text x="280" y="230" fill="#8e8e8e" fontSize="8" className="font-mono opacity-60" transform="skewY(-10)">LITHOSPHERE</text>
                </svg>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Water Cycle Section */}
        <section id="water-cycle" className="snap-section flex items-center justify-center relative bg-bg overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 w-full h-full">
            <div className="flex items-center justify-center section-padding bg-water/5 border-r border-white/5">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, x: -50 }}
                whileInView={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ duration: 1 }}
                className="w-full max-w-lg"
              >
                {/* Water and Clouds SVG - Enhanced Scenic 3D Detail */}
                <svg viewBox="0 0 400 400" className="w-full h-auto drop-shadow-[0_0_30px_rgba(74,158,255,0.1)]">
                  <defs>
                    <linearGradient id="oceanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#4a9eff" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="#1a3a5a" />
                    </linearGradient>
                    <radialGradient id="sunGrad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#ffd84a" />
                      <stop offset="100%" stopColor="transparent" />
                    </radialGradient>
                  </defs>

                  <MoleculeTracer path="M200 280 Q250 200 200 120 Q150 80 100 120" color="#4a9eff" isActive={activeSection === 'water-cycle'} />
                  
                  {/* Sun - Driver of the Cycle */}
                  <g className="group">
                    <circle cx="350" cy="50" r="40" fill="url(#sunGrad)" opacity="0.6" className="svg-hover-element" />
                    <Tooltip text="Solar Energy: Drives evaporation and the global water cycle." />
                  </g>

                  {/* Ocean - 3D Perspective */}
                  <g className="group">
                    <path d="M0 300 Q200 280 400 300 L400 400 L0 400 Z" fill="url(#oceanGrad)" className="svg-hover-element" />
                    {/* Ocean Waves */}
                    {Array.from({ length: 5 }).map((_, i) => (
                      <motion.path 
                        key={i}
                        animate={{ x: [-10, 10, -10] }}
                        transition={{ duration: 4, repeat: Infinity, delay: i * 0.5 }}
                        d={`M${i * 100} 310 Q${i * 100 + 50} 300 ${i * 100 + 100} 310`} 
                        fill="none" stroke="#4a9eff" strokeWidth="0.5" opacity="0.4" 
                      />
                    ))}
                    <Tooltip text="Ocean: Absorbs atmospheric CO₂ via dissolution." />
                  </g>

                  {/* Evaporation - Animated Upward Lines */}
                  <g className="group">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <motion.path 
                        key={i}
                        animate={{ y: [0, -100], opacity: [0, 0.6, 0] }}
                        transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                        d={`M${100 + i * 40} 280 Q${110 + i * 40} 250 ${100 + i * 40} 220`} 
                        fill="none" stroke="#4a9eff" strokeWidth="1" strokeDasharray="2 4" 
                      />
                    ))}
                    <Tooltip text="Evaporation: Water vapor carries energy into the atmosphere." />
                  </g>

                  {/* Clouds - 3D-like Volume */}
                  <g className="group">
                    <motion.path 
                      animate={{ x: [-10, 10, -10] }}
                      transition={{ duration: 10, repeat: Infinity }}
                      d="M100 120 Q120 90 150 100 Q180 70 220 90 Q260 80 280 110 Q310 120 290 150 L110 150 Z" 
                      fill="white" fillOpacity="0.1" stroke="#4a9eff" strokeWidth="1" 
                      className="svg-hover-element" 
                    />
                    <Tooltip text="Condensation: Water vapor forms clouds, trapping trace gases." />
                  </g>

                  {/* Precipitation - Detailed Rain */}
                  <g className="group">
                    {Array.from({ length: 15 }).map((_, i) => (
                      <motion.line 
                        key={i}
                        animate={{ y: [0, 150], opacity: [0, 1, 0] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                        x1={120 + i * 12} y1="150" x2={115 + i * 12} y2="165" 
                        stroke="#4a9eff" strokeWidth="1" 
                      />
                    ))}
                    <Tooltip text="Precipitation: Rain scrubs CO₂ from the air, forming carbonic acid." />
                  </g>

                  {/* Labels */}
                  <text x="140" y="380" fill="#4a9eff" fontSize="10" className="font-mono font-bold">ATMOSPHERE-OCEAN EXCHANGE</text>
                  <text x="50" y="250" fill="#4a9eff" fontSize="8" className="font-mono opacity-60">EVAPORATION</text>
                  <text x="250" y="200" fill="#4a9eff" fontSize="8" className="font-mono opacity-60">PRECIPITATION</text>
                </svg>
              </motion.div>
            </div>
            <div className="flex flex-col justify-center section-padding relative">
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <motion.span 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.36 }}
                  className="badge bg-water/20 text-water border border-water/30"
                >
                  Carbon Flux
                </motion.span>
                <SectionHeading number="STAGE 05" title="Hydrological Flux" colorClass="text-water" />
                <div className="space-y-6 text-white/60 text-sm leading-relaxed max-w-md">
                  <p>
                    The water cycle is a primary driver of carbon transport across the globe. Precipitation scrubs CO₂ from the atmosphere, creating a weak carbonic acid that facilitates the chemical weathering of silicate rocks. This process consumes atmospheric carbon and transports it as bicarbonate ions into river systems and eventually the oceans.
                  </p>
                  <p>
                    In the marine environment, these ions are utilized by calcifying organisms to build shells and skeletons. When these organisms die, they sink to the ocean floor, effectively burying carbon in deep-sea sediments. This coupling of water and carbon cycles acts as a long-term planetary thermostat.
                  </p>
                </div>
                <ChemicalEquation equation="CO₂ + H₂O ⇌ H₂CO₃ ⇌ H⁺ + HCO₃⁻" colorClass="border-water" />
                <button 
                  onClick={() => scrollToSection('hero')}
                  className="mt-12 px-8 py-3 border border-white/20 hover:border-accent hover:text-accent transition-colors text-[10px] tracking-[0.3em] uppercase font-mono"
                >
                  Return to Origin
                </button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Closed Loop Section */}
        <section id="closed-loop" className="snap-section flex flex-col items-center justify-center relative bg-bg overflow-hidden section-padding">
          <motion.div 
            style={{ y: useSpring(scrollYProgress, { stiffness: 50, damping: 20 }) }}
            className="absolute inset-0 opacity-10 pointer-events-none"
          >
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--color-accent)_0%,_transparent_70%)]" />
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="text-center z-10 px-6 max-w-4xl"
          >
            <span className="text-accent text-xs tracking-[0.4em] uppercase mb-4 block">Conclusion</span>
            <h2 className="text-6xl md:text-8xl mb-12 italic">The Closed Loop</h2>
            
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="w-full max-w-sm">
                {/* Terrarium SVG - Enhanced High-Detail Isometric Detail */}
                <svg viewBox="0 0 400 400" className="w-full h-auto drop-shadow-[0_0_30px_rgba(92,186,92,0.2)]">
                  <defs>
                    <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="white" stopOpacity="0.2" />
                      <stop offset="50%" stopColor="white" stopOpacity="0.05" />
                      <stop offset="100%" stopColor="white" stopOpacity="0.2" />
                    </linearGradient>
                  </defs>

                  {/* Glass Jar - 3D Volume */}
                  <g className="group">
                    <path d="M100 100 Q100 50 200 50 Q300 50 300 100 L300 300 Q300 350 200 350 Q100 350 100 300 Z" fill="url(#glassGrad)" stroke="white" strokeWidth="1" opacity="0.4" className="svg-hover-element" />
                    <Tooltip text="Closed System: A finite environment where matter is recycled." />
                  </g>

                  {/* Soil Layers - 3D Perspective */}
                  <g className="group">
                    <path d="M100 280 Q200 270 300 280 L300 300 Q300 350 200 350 Q100 350 100 300 Z" fill="#3d2b1f" opacity="0.4" className="svg-hover-element" />
                    <Tooltip text="Substrate: Provides nutrients and holds moisture." />
                  </g>
                  
                  {/* Roots with Pulse */}
                  <motion.g 
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    style={{ transformOrigin: "200px 280px" }}
                  >
                    <path d="M200 280 Q180 300 190 320" fill="none" stroke="#e07840" strokeWidth="1.5" opacity="0.6" />
                    <path d="M200 280 Q220 310 210 330" fill="none" stroke="#e07840" strokeWidth="1.5" opacity="0.6" />
                    <path d="M200 280 Q200 340 180 340" fill="none" stroke="#e07840" strokeWidth="1" opacity="0.4" />
                  </motion.g>

                  {/* Plant - Detailed 3D-like */}
                  <g className="group">
                    <path d="M200 280 L200 180" stroke="#5cba5c" strokeWidth="3" strokeLinecap="round" />
                    {/* Leaves */}
                    <path d="M200 220 Q240 200 260 220" fill="#5cba5c" fillOpacity="0.6" stroke="#2d5a2d" strokeWidth="1" />
                    <path d="M200 240 Q160 220 140 240" fill="#5cba5c" fillOpacity="0.6" stroke="#2d5a2d" strokeWidth="1" />
                    <path d="M200 200 Q220 170 240 180" fill="#5cba5c" fillOpacity="0.6" stroke="#2d5a2d" strokeWidth="1" />
                    <Tooltip text="Primary Producer: Fixes carbon via photosynthesis." />
                  </g>
                  
                  {/* Sun Rays - Rotating Scenic */}
                  <motion.g 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    style={{ transformOrigin: "50px 50px" }}
                  >
                    {Array.from({ length: 12 }).map((_, i) => (
                      <line 
                        key={i} 
                        x1="50" y1="50" x2="120" y2="120" 
                        stroke="#ffd84a" strokeWidth="0.5" opacity="0.15" 
                        transform={`rotate(${i * 30}, 50, 50)`}
                      />
                    ))}
                  </motion.g>

                  {/* Orbiting CO2 Molecules - 3D Orbit */}
                  <motion.g
                    animate={{ rotateY: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    style={{ transformOrigin: "200px 180px", perspective: "1000px" }}
                  >
                    <g transform="translate(100, 0)">
                      <circle r="4" fill="#ffd84a" className="shadow-lg">
                        <animate attributeName="opacity" values="0.4;1;0.4" dur="5s" repeatCount="indefinite" />
                      </circle>
                    </g>
                    <g transform="translate(-100, 40)">
                      <circle r="4" fill="#ffd84a">
                        <animate attributeName="opacity" values="0.4;1;0.4" dur="7s" repeatCount="indefinite" />
                      </circle>
                    </g>
                  </motion.g>

                  {/* Animated Cycle Arrows - High Detail */}
                  <g className="group">
                    <motion.path 
                      animate={{ strokeDashoffset: [0, -20] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      d="M260 150 Q320 200 260 250" 
                      fill="none" stroke="#ffd84a" strokeWidth="1.5" strokeDasharray="4 4" 
                    />
                    <motion.path 
                      animate={{ strokeDashoffset: [0, 20] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      d="M140 250 Q80 200 140 150" 
                      fill="none" stroke="#5cba5c" strokeWidth="1.5" strokeDasharray="4 4" 
                    />
                    <Tooltip text="The Loop: Continuous transformation of matter." />
                  </g>

                  {/* Labels */}
                  <text x="140" y="380" fill="white" opacity="0.4" fontSize="10" className="font-mono font-bold">MINIATURE BIOSPHERE</text>
                </svg>
              </div>
              <div className="text-left space-y-6">
                <p className="text-white/60 text-sm leading-relaxed">
                  Inside a terrarium, the carbon cycle runs in miniature — a closed system where nothing is lost. Every atom of carbon that is fixed by the plants is eventually returned to the air through respiration or decay.
                </p>
                <p className="text-white/60 text-sm leading-relaxed">
                  This microcosm mirrors our planet. Earth is a finite vessel, and the delicate balance of its carbon flux is what sustains all life within its boundaries.
                </p>
                <button 
                  onClick={() => scrollToSection('hero')}
                  className="px-8 py-3 border border-white/20 hover:border-accent hover:text-accent transition-colors text-[10px] tracking-[0.3em] uppercase font-mono"
                >
                  Restart Journey
                </button>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 p-8 z-40 flex justify-between items-end pointer-events-none">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] tracking-[0.5em] uppercase text-white/20 font-mono">
            Jack Koll Gunderson
          </span>
          <span className="text-[10px] tracking-[0.5em] uppercase text-white/20 font-mono">
            Earth Systems / Carbon Flux v2.1
          </span>
        </div>
        <div className="text-[10px] tracking-[0.5em] uppercase text-white/20 font-mono">
          {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
      </footer>
    </div>
  );
}
