import React, { useEffect, useRef, useContext } from 'react';
import { motion } from 'framer-motion';
import { ThemeContext } from '../context/ThemeContext';

const NetworkBackground = ({ isDark }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let particles = [];
    const particleCount = 70; 
    const connectionDistance = 180;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    // Adaptive colors based on theme
    const particleColor = isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(30, 58, 138, 0.4)';
    const lineColor = isDark ? 'rgba(255, 255, 255,' : 'rgba(30, 58, 138,';
    const bgColor = isDark ? '#000000' : '#ffffff';

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.radius = Math.random() * 1.5 + 0.5;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = particleColor;
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    const animate = () => {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        p1.update();
        p1.draw();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            const opacity = 1 - (distance / connectionDistance);
            ctx.beginPath();
            ctx.strokeStyle = `${lineColor} ${opacity * (isDark ? 0.3 : 0.2)})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDark]); // Re-run effect when theme changes

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ willChange: 'transform' }}
    />
  );
};

const FloatingImageFragment = ({ isDark, delay = 0, duration = 20, yPos = '20%' }) => {
  return (
    <motion.div
      initial={{ x: '-10%', opacity: 0 }}
      animate={{ 
        x: '110%', 
        opacity: [0, 0.3, 0.3, 0],
      }}
      transition={{ 
        duration, 
        repeat: Infinity, 
        delay, 
        ease: "linear" 
      }}
      className="fixed pointer-events-none z-0 select-none will-change-transform"
      style={{ top: yPos }}
    >
      <div className={`relative w-16 h-16 sm:w-24 sm:h-24 overflow-hidden rounded-lg border ${isDark ? 'border-white/10 shadow-lg' : 'border-blue-900/10 shadow-md'} backdrop-blur-sm`}>
        <div className={`absolute inset-0 ${isDark ? 'bg-white/5' : 'bg-blue-900/5'}`} />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1620712943543-bcc4628c7190?auto=format&fit=crop&q=80&w=200')] bg-cover bg-center grayscale opacity-10" />
      </div>
    </motion.div>
  );
};

const BackgroundEffects = () => {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  return (
    <div className={`fixed inset-0 overflow-hidden pointer-events-none -z-10 transition-colors duration-700 ${isDark ? 'bg-black' : 'bg-white'}`}>
      <NetworkBackground isDark={isDark} />
      
      <FloatingImageFragment isDark={isDark} delay={0} duration={25} yPos="20%" />
      <FloatingImageFragment isDark={isDark} delay={8} duration={35} yPos="60%" />
      
      {isDark && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)] z-10 opacity-40" />
      )}
      {!isDark && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(255,255,255,0.8)_100%)] z-10 opacity-20" />
      )}
    </div>
  );
};

export default BackgroundEffects;
