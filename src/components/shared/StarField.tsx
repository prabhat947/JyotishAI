'use client';

import React, { useEffect, useRef } from 'react';

interface StarFieldProps {
  density?: number;
  speed?: number;
  className?: string;
}

export const StarField: React.FC<StarFieldProps> = ({
  density = 100,
  speed = 0.5,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Capture non-null canvas reference for use inside class
    const canvasEl = canvas;

    // Set canvas size
    const setCanvasSize = () => {
      canvasEl.width = window.innerWidth;
      canvasEl.height = window.innerHeight;
    };
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    // Star class
    class Star {
      x: number;
      y: number;
      z: number;
      radius: number;
      color: string;
      twinkleSpeed: number;
      twinklePhase: number;

      constructor() {
        this.x = Math.random() * canvasEl.width;
        this.y = Math.random() * canvasEl.height;
        this.z = Math.random() * canvasEl.width;
        this.radius = Math.random() * 1.5 + 0.5;
        this.color = this.getStarColor();
        this.twinkleSpeed = Math.random() * 0.02 + 0.01;
        this.twinklePhase = Math.random() * Math.PI * 2;
      }

      getStarColor(): string {
        const colors = [
          'rgba(255, 255, 255, 0.9)', // white
          'rgba(201, 162, 39, 0.8)', // gold
          'rgba(124, 58, 237, 0.7)', // purple
          'rgba(147, 197, 253, 0.8)', // light blue
        ];
        return colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.z -= speed;
        if (this.z <= 0) {
          this.z = canvasEl.width;
          this.x = Math.random() * canvasEl.width;
          this.y = Math.random() * canvasEl.height;
        }
        this.twinklePhase += this.twinkleSpeed;
      }

      draw(ctx: CanvasRenderingContext2D) {
        const x = (this.x - canvasEl.width / 2) * (canvasEl.width / this.z);
        const y = (this.y - canvasEl.height / 2) * (canvasEl.width / this.z);
        const radius = this.radius * (canvasEl.width / this.z);

        const centerX = canvasEl.width / 2 + x;
        const centerY = canvasEl.height / 2 + y;

        // Twinkle effect
        const twinkle = (Math.sin(this.twinklePhase) + 1) / 2;
        const alpha = 0.3 + twinkle * 0.7;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color.replace(/[\d.]+\)$/g, `${alpha})`);
        ctx.fill();

        // Add glow for brighter stars
        if (radius > 1) {
          const gradient = ctx.createRadialGradient(
            centerX,
            centerY,
            0,
            centerX,
            centerY,
            radius * 3
          );
          gradient.addColorStop(0, this.color.replace(/[\d.]+\)$/g, `${alpha * 0.5})`));
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Create stars
    const stars: Star[] = [];
    for (let i = 0; i < density; i++) {
      stars.push(new Star());
    }

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      ctx.fillStyle = 'rgba(10, 10, 26, 0.1)'; // Slow fade for trail effect
      ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);

      stars.forEach((star) => {
        star.update();
        star.draw(ctx);
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', setCanvasSize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [density, speed]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none ${className}`}
      style={{ zIndex: -1 }}
    />
  );
};

// CSS-only alternative for simpler use cases
export const StarFieldCSS: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`fixed inset-0 overflow-hidden pointer-events-none ${className}`} style={{ zIndex: -1 }}>
      <div className="stars-layer-1" />
      <div className="stars-layer-2" />
      <div className="stars-layer-3" />

      <style jsx>{`
        .stars-layer-1,
        .stars-layer-2,
        .stars-layer-3 {
          position: absolute;
          width: 100%;
          height: 100%;
          background: transparent;
        }

        .stars-layer-1 {
          background-image:
            radial-gradient(2px 2px at 20px 30px, rgba(255, 255, 255, 0.8), transparent),
            radial-gradient(2px 2px at 60px 70px, rgba(201, 162, 39, 0.6), transparent),
            radial-gradient(1px 1px at 50px 50px, rgba(124, 58, 237, 0.5), transparent),
            radial-gradient(1px 1px at 130px 80px, rgba(255, 255, 255, 0.7), transparent),
            radial-gradient(2px 2px at 80px 10px, rgba(147, 197, 253, 0.6), transparent);
          background-size: 200px 200px;
          background-repeat: repeat;
          animation: twinkle1 4s infinite ease-in-out;
        }

        .stars-layer-2 {
          background-image:
            radial-gradient(1px 1px at 40px 60px, rgba(255, 255, 255, 0.6), transparent),
            radial-gradient(1px 1px at 110px 90px, rgba(201, 162, 39, 0.5), transparent),
            radial-gradient(1px 1px at 150px 30px, rgba(124, 58, 237, 0.4), transparent);
          background-size: 180px 180px;
          background-repeat: repeat;
          animation: twinkle2 5s infinite ease-in-out;
        }

        .stars-layer-3 {
          background-image:
            radial-gradient(1px 1px at 90px 40px, rgba(255, 255, 255, 0.5), transparent),
            radial-gradient(1px 1px at 170px 80px, rgba(147, 197, 253, 0.4), transparent);
          background-size: 220px 220px;
          background-repeat: repeat;
          animation: twinkle3 6s infinite ease-in-out;
        }

        @keyframes twinkle1 {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @keyframes twinkle2 {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 0.3; }
        }

        @keyframes twinkle3 {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.2; }
        }
      `}</style>
    </div>
  );
};

