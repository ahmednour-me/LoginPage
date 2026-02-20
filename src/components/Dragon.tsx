import { useEffect, useRef, useState, useCallback } from "react";
import AuthForm from "./AuthForm";
import SettingsBar from "./SettingsBar";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";

interface Point {
  x: number;
  y: number;
}

interface DragonState {
  segments: Point[];
  isColliding: boolean;
  collisionPoint?: Point;
  velocity: Point;
  shake: number;
  lookAt?: Point;
}

type AuthMode = 'login' | 'signup' | 'forgot-password';
type DragonBehavior = "free" | "watching-form" | "watching-user" | "celebrating";

const Dragon = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { t, isRTL } = useLanguage();
  const { isDark } = useTheme();
  
  const [dragons, setDragons] = useState<DragonState[]>([
    { segments: [], isColliding: false, velocity: { x: 0, y: 0 }, shake: 0 },
    { segments: [], isColliding: false, velocity: { x: 0, y: 0 }, shake: 0 },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [dragonBehavior, setDragonBehavior] = useState<DragonBehavior>("free");
  const [formBounds, setFormBounds] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [celebrationStartTime, setCelebrationStartTime] = useState<number>(0);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  
  const animationRef = useRef<number>();
  const targetRef = useRef<Point>({ x: 0.5, y: 0.3 });
  const dragon2TargetRef = useRef<Point>({ x: 0.7, y: 0.5 });
  const dragon2DirectionRef = useRef<number>(Math.random() * Math.PI * 2);
  const dragon1DirectionRef = useRef<number>(Math.random() * Math.PI * 2);
  const lastDirectionChangeRef = useRef<number>(0);
  const lastDirection1ChangeRef = useRef<number>(0);
  const formRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const mousePositionRef = useRef<Point>({ x: 0.5, y: 0.5 });

  const numSegments = 50;
  const segmentLength = 8;

  // Update form bounds
  useEffect(() => {
    const updateFormBounds = () => {
      if (formRef.current && containerRef.current) {
        const formRect = formRef.current.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        
        setFormBounds({
          x: (formRect.left - containerRect.left) / containerRect.width,
          y: (formRect.top - containerRect.top) / containerRect.height,
          width: formRect.width / containerRect.width,
          height: formRect.height / containerRect.height,
        });
      }
    };

    updateFormBounds();
    window.addEventListener("resize", updateFormBounds);
    return () => window.removeEventListener("resize", updateFormBounds);
  }, []);

  useEffect(() => {
    const initialDragons: DragonState[] = [
      { segments: [], isColliding: false, velocity: { x: 0, y: 0 }, shake: 0 },
      { segments: [], isColliding: false, velocity: { x: 0, y: 0 }, shake: 0 },
    ];
    
    for (let d = 0; d < 2; d++) {
      const offsetX = d === 0 ? 0.15 : 0.85;
      const offsetY = 0.15;
      for (let i = 0; i < numSegments; i++) {
        initialDragons[d].segments.push({ 
          x: offsetX, 
          y: offsetY + i * 0.012 
        });
      }
    }
    
    setDragons(initialDragons);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        mousePositionRef.current = {
          x: (e.clientX - rect.left) / rect.width,
          y: (e.clientY - rect.top) / rect.height,
        };
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleFormFocus = () => {
    setDragonBehavior("watching-form");
  };

  const handleFormBlur = () => {
    setTimeout(() => {
      if (!isTyping) {
        setDragonBehavior("free");
      }
    }, 2000);
  };

  const handleLoginSuccess = () => {
    setDragonBehavior("celebrating");
    setCelebrationStartTime(Date.now());
    
    setTimeout(() => {
      setDragonBehavior("free");
    }, 4000);
  };

  const handleAuthModeChange = (mode: AuthMode) => {
    setAuthMode(mode);
  };

  const handleFormTyping = () => {
    setIsTyping(true);
    setDragonBehavior("watching-form");
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      setDragonBehavior("watching-user");
      
      setTimeout(() => {
        setDragonBehavior("free");
      }, 3000);
    }, 1500);
  };

  const isInsideForm = useCallback((point: Point, padding: number = 0.02): boolean => {
    if (!formBounds) return false;
    return (
      point.x > formBounds.x - padding &&
      point.x < formBounds.x + formBounds.width + padding &&
      point.y > formBounds.y - padding &&
      point.y < formBounds.y + formBounds.height + padding
    );
  }, [formBounds]);

  const getWatchPosition = useCallback((dragonIndex: number): Point => {
    if (!formBounds) return { x: 0.5, y: 0.3 };
    
    const time = Date.now() / 1000;
    
    if (dragonIndex === 0) {
      return {
        x: formBounds.x - 0.15 + Math.sin(time * 0.3) * 0.015,
        y: formBounds.y + formBounds.height * 0.4 + Math.cos(time * 0.4) * 0.02,
      };
    } else {
      return {
        x: formBounds.x + formBounds.width + 0.15 + Math.sin(time * 0.35) * 0.015,
        y: formBounds.y + formBounds.height * 0.4 + Math.cos(time * 0.45) * 0.02,
      };
    }
  }, [formBounds]);

  const getCelebrationPosition = useCallback((dragonIndex: number): Point => {
    if (!formBounds) return { x: 0.5, y: 0.3 };
    
    const time = Date.now() / 1000;
    const elapsedTime = (Date.now() - celebrationStartTime) / 1000;
    
    const formCenterX = formBounds.x + formBounds.width / 2;
    const formCenterY = formBounds.y + formBounds.height / 2;
    
    if (dragonIndex === 0) {
      const radius = 0.12 + Math.sin(elapsedTime * 2) * 0.03;
      const angle = time * 3 + Math.PI;
      return {
        x: formCenterX - 0.2 + Math.cos(angle) * radius,
        y: formCenterY + Math.sin(angle * 2) * 0.08 + Math.sin(elapsedTime * 5) * 0.02,
      };
    } else {
      const radius = 0.12 + Math.cos(elapsedTime * 2) * 0.03;
      const angle = -time * 3;
      return {
        x: formCenterX + 0.2 + Math.cos(angle) * radius,
        y: formCenterY + Math.sin(angle * 2) * 0.08 + Math.cos(elapsedTime * 5) * 0.02,
      };
    }
  }, [formBounds, celebrationStartTime]);

  const getLookAtPoint = useCallback((): Point | undefined => {
    if (!formBounds) return undefined;
    
    if (dragonBehavior === "watching-form") {
      return {
        x: formBounds.x + formBounds.width / 2,
        y: formBounds.y + formBounds.height * 0.4,
      };
    } else if (dragonBehavior === "watching-user") {
      return mousePositionRef.current;
    }
    return undefined;
  }, [formBounds, dragonBehavior]);

  useEffect(() => {
    const animate = () => {
      const now = Date.now();

      setDragons((prevDragons) => {
        if (prevDragons[0].segments.length === 0) return prevDragons;

        const lookAtPoint = getLookAtPoint();

        const newDragons = prevDragons.map((dragon, dragonIndex) => {
          const newSegments = [...dragon.segments];
          let newVelocity = { ...dragon.velocity };

          let targetPoint: Point;

          if (dragonBehavior === "celebrating") {
            targetPoint = getCelebrationPosition(dragonIndex);
          } else if (dragonBehavior === "watching-form" || dragonBehavior === "watching-user") {
            targetPoint = getWatchPosition(dragonIndex);
          } else {
            if (dragonIndex === 0) {
              if (now - lastDirection1ChangeRef.current > 2000 + Math.random() * 2000) {
                dragon1DirectionRef.current += (Math.random() - 0.5) * Math.PI;
                lastDirection1ChangeRef.current = now;
              }
              
              const speed = 0.006;
              targetRef.current.x += Math.cos(dragon1DirectionRef.current) * speed;
              targetRef.current.y += Math.sin(dragon1DirectionRef.current) * speed;
              
              if (targetRef.current.x < 0.1 || targetRef.current.x > 0.9) {
                dragon1DirectionRef.current = Math.PI - dragon1DirectionRef.current;
                targetRef.current.x = Math.max(0.1, Math.min(0.9, targetRef.current.x));
              }
              if (targetRef.current.y < 0.1 || targetRef.current.y > 0.9) {
                dragon1DirectionRef.current = -dragon1DirectionRef.current;
                targetRef.current.y = Math.max(0.1, Math.min(0.9, targetRef.current.y));
              }
              
              targetPoint = targetRef.current;
            } else {
              if (now - lastDirectionChangeRef.current > 2000 + Math.random() * 2000) {
                dragon2DirectionRef.current += (Math.random() - 0.5) * Math.PI;
                lastDirectionChangeRef.current = now;
              }
              
              const speed = 0.006;
              dragon2TargetRef.current.x += Math.cos(dragon2DirectionRef.current) * speed;
              dragon2TargetRef.current.y += Math.sin(dragon2DirectionRef.current) * speed;
              
              if (dragon2TargetRef.current.x < 0.1 || dragon2TargetRef.current.x > 0.9) {
                dragon2DirectionRef.current = Math.PI - dragon2DirectionRef.current;
                dragon2TargetRef.current.x = Math.max(0.1, Math.min(0.9, dragon2TargetRef.current.x));
              }
              if (dragon2TargetRef.current.y < 0.1 || dragon2TargetRef.current.y > 0.9) {
                dragon2DirectionRef.current = -dragon2DirectionRef.current;
                dragon2TargetRef.current.y = Math.max(0.1, Math.min(0.9, dragon2TargetRef.current.y));
              }
              
              targetPoint = dragon2TargetRef.current;
            }
          }

          const speedMultiplier = 0.08;
          newVelocity.x = (targetPoint.x - newSegments[0].x) * speedMultiplier;
          newVelocity.y = (targetPoint.y - newSegments[0].y) * speedMultiplier;
          
          let newHeadPos = {
            x: newSegments[0].x + newVelocity.x,
            y: newSegments[0].y + newVelocity.y,
          };
          
          const shouldBlockForm = dragonBehavior === "watching-form" || dragonBehavior === "watching-user";
          
          if (shouldBlockForm && isInsideForm(newHeadPos, 0.05)) {
            if (formBounds) {
              const formCenterX = formBounds.x + formBounds.width / 2;
              const formCenterY = formBounds.y + formBounds.height / 2;
              const pushAngle = Math.atan2(newHeadPos.y - formCenterY, newHeadPos.x - formCenterX);
              const pushDistance = formBounds.width / 2 + 0.08;
              newHeadPos.x = formCenterX + Math.cos(pushAngle) * pushDistance;
              newHeadPos.y = formCenterY + Math.sin(pushAngle) * (formBounds.height / 2 + 0.08);
            }
          }
          
          newSegments[0] = newHeadPos;

          for (let i = 1; i < newSegments.length; i++) {
            const prev = newSegments[i - 1];
            const curr = newSegments[i];
            const dx = curr.x - prev.x;
            const dy = curr.y - prev.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const targetDist = segmentLength / 1000;

            if (dist > 0) {
              const ratio = targetDist / dist;
              newSegments[i] = {
                x: prev.x + dx * ratio,
                y: prev.y + dy * ratio,
              };
            }
          }

          return { 
            segments: newSegments, 
            isColliding: false,
            collisionPoint: undefined,
            velocity: newVelocity,
            shake: 0,
            lookAt: lookAtPoint,
          };
        });

        return newDragons;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [dragonBehavior, formBounds, getWatchPosition, getLookAtPoint, isInsideForm, getCelebrationPosition]);

  const getAngle = (p1: Point, p2: Point) => {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x);
  };

  const renderSingleDragon = (
    dragon: DragonState,
    dragonIndex: number,
    width: number,
    height: number
  ) => {
    const { segments, lookAt } = dragon;
    if (segments.length < 2) return null;
    
    const pixelSegments = segments.map((s) => ({
      x: s.x * width,
      y: s.y * height,
    }));

    let headAngle: number;
    if (lookAt && dragonBehavior !== "free") {
      const lookAtPixel = { x: lookAt.x * width, y: lookAt.y * height };
      headAngle = getAngle(pixelSegments[0], lookAtPixel);
    } else {
      headAngle = getAngle(pixelSegments[1], pixelSegments[0]);
    }

    const time = Date.now() / 1000;
    const isCelebrating = dragonBehavior === "celebrating";
    const isWatching = dragonBehavior === "watching-form" || dragonBehavior === "watching-user";
    
    const wingFlapSpeed = isCelebrating ? 12 : isWatching ? 3 : 5;
    const wingFlapIntensity = isCelebrating ? 0.6 : isWatching ? 0.3 : 0.4;
    const wingFlap = Math.sin(time * wingFlapSpeed + dragonIndex * Math.PI) * wingFlapIntensity;
    
    const headNod = isCelebrating ? Math.sin(time * 8) * 8 : 0;
    const bodyBounce = isCelebrating ? Math.abs(Math.sin(time * 6)) * 5 : 0;

    const wingIndex = 6;
    const wingBase = pixelSegments[wingIndex];
    const wingAngle = getAngle(pixelSegments[wingIndex + 1], pixelSegments[wingIndex]);

    const idPrefix = `dragon${dragonIndex}`;
    
    // Theme-aware colors
    const baseColor = isDark 
      ? (dragonIndex === 0 ? "#c4b5a0" : "#8fa8b8")
      : (dragonIndex === 0 ? "#2a2a2a" : "#1a3a4a");
    const bodyColor = baseColor;
    const wingColor = isDark
      ? (dragonIndex === 0 ? "#d4c5b0" : "#a0b8c8")
      : (dragonIndex === 0 ? "#3a3a3a" : "#2a4a5a");
    const accentColor = isDark
      ? (dragonIndex === 0 ? "#e0d5c5" : "#b0c8d8")
      : (dragonIndex === 0 ? "#4a4a4a" : "#3a5a6a");
    
    const eyeColor = isCelebrating 
      ? (dragonIndex === 0 ? "#ffea00" : "#7cff00")
      : isWatching 
        ? (dragonIndex === 0 ? "#ffd700" : "#50fa7b") 
        : (dragonIndex === 0 ? "#ffc107" : "#00ff88");

    return (
      <g key={dragonIndex}>
        <defs>
          <filter id={`watch-glow-${dragonIndex}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="glow"/>
            <feMerge>
              <feMergeNode in="glow"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id={`celebration-glow-${dragonIndex}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="glow"/>
            <feColorMatrix
              type="matrix"
              values="1.2 0 0 0 0.1
                      0 1.2 0 0 0.1
                      0 0 0.8 0 0
                      0 0 0 1 0"
            />
            <feMerge>
              <feMergeNode in="glow"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <g 
          filter={isCelebrating ? `url(#celebration-glow-${dragonIndex})` : isWatching ? `url(#watch-glow-${dragonIndex})` : undefined}
          transform={`translate(0, ${-bodyBounce})`}
        >
          
          {/* Wings */}
          <g transform={`translate(${wingBase.x}, ${wingBase.y}) rotate(${(wingAngle * 180) / Math.PI})`}>
            <g transform={`rotate(${-90 + wingFlap * 25})`}>
              <path
                d={`M 0 0 L -20 -60 Q -35 -100, -80 -120 L -60 -80 Q -70 -60, -100 -80 L -70 -50 Q -80 -30, -110 -40 L -60 -20 Q -40 -10, -30 0 Z`}
                fill={wingColor}
                opacity="0.85"
              />
              <line x1="0" y1="0" x2="-80" y2="-120" stroke={bodyColor} strokeWidth="3" />
              <line x1="0" y1="0" x2="-100" y2="-80" stroke={bodyColor} strokeWidth="2" />
              <line x1="0" y1="0" x2="-110" y2="-40" stroke={bodyColor} strokeWidth="2" />
            </g>

            <g transform={`rotate(${90 - wingFlap * 25})`}>
              <path
                d={`M 0 0 L -20 60 Q -35 100, -80 120 L -60 80 Q -70 60, -100 80 L -70 50 Q -80 30, -110 40 L -60 20 Q -40 10, -30 0 Z`}
                fill={wingColor}
                opacity="0.85"
              />
              <line x1="0" y1="0" x2="-80" y2="120" stroke={bodyColor} strokeWidth="3" />
              <line x1="0" y1="0" x2="-100" y2="80" stroke={bodyColor} strokeWidth="2" />
              <line x1="0" y1="0" x2="-110" y2="40" stroke={bodyColor} strokeWidth="2" />
            </g>
          </g>

          {/* Body */}
          {pixelSegments.map((seg, i) => {
            if (i >= pixelSegments.length - 1) return null;
            const next = pixelSegments[i + 1];
            const thickness = Math.max(3, 22 - i * 0.4);
            
            return (
              <line
                key={`${idPrefix}-body-${i}`}
                x1={seg.x}
                y1={seg.y}
                x2={next.x}
                y2={next.y}
                stroke={bodyColor}
                strokeWidth={thickness}
                strokeLinecap="round"
              />
            );
          })}

          {/* Belly */}
          {pixelSegments.slice(0, 35).map((seg, i) => {
            if (i % 2 !== 0) return null;
            const thickness = Math.max(1, 8 - i * 0.2);
            const nextSeg = pixelSegments[i + 1] || seg;
            const angle = getAngle(seg, nextSeg) + Math.PI / 2;
            
            return (
              <ellipse
                key={`${idPrefix}-belly-${i}`}
                cx={seg.x + Math.cos(angle) * (10 - i * 0.2)}
                cy={seg.y + Math.sin(angle) * (10 - i * 0.2)}
                rx={thickness}
                ry={thickness * 0.6}
                fill={accentColor}
                opacity="0.5"
              />
            );
          })}

          {/* Spines */}
          {pixelSegments.slice(3, 30).map((seg, i) => {
            if (i % 2 !== 0) return null;
            const nextSeg = pixelSegments[i + 4] || seg;
            const angle = getAngle(seg, nextSeg) - Math.PI / 2;
            const spineLength = 18 - i * 0.4;
            
            return (
              <path
                key={`${idPrefix}-spine-${i}`}
                d={`M ${seg.x} ${seg.y} Q ${seg.x + Math.cos(angle) * spineLength * 0.5} ${seg.y + Math.sin(angle) * spineLength * 0.5}, ${seg.x + Math.cos(angle) * spineLength} ${seg.y + Math.sin(angle) * spineLength}`}
                stroke={bodyColor}
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
            );
          })}

          {/* Head */}
          <g transform={`translate(${pixelSegments[0].x}, ${pixelSegments[0].y}) rotate(${(headAngle * 180) / Math.PI + headNod})`}>
            <ellipse cx="10" cy="0" rx="28" ry="18" fill={bodyColor} />
            <ellipse cx="35" cy="0" rx="18" ry="10" fill={bodyColor} />
            
            <path d="M 20 -8 Q 40 -12, 50 -5" stroke={wingColor} strokeWidth="3" fill="none" />
            <path d="M 20 8 Q 40 12, 50 5" stroke={wingColor} strokeWidth="3" fill="none" />
            
            <path d="M -5 -15 Q -25 -25, -35 -45 Q -30 -50, -25 -55" stroke={bodyColor} strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M -5 15 Q -25 25, -35 45 Q -30 50, -25 55" stroke={bodyColor} strokeWidth="6" fill="none" strokeLinecap="round" />
            
            {/* Eyes */}
            <ellipse cx="15" cy="-10" rx={isCelebrating ? 13 : isWatching ? 11 : 8} ry={isCelebrating ? 11 : isWatching ? 9 : 6} fill={eyeColor}>
              {isCelebrating && <animate attributeName="ry" values="11;8;11" dur="0.3s" repeatCount="indefinite" />}
              {isWatching && !isCelebrating && <animate attributeName="ry" values="9;7;9" dur="2s" repeatCount="indefinite" />}
            </ellipse>
            <ellipse cx="15" cy="10" rx={isCelebrating ? 13 : isWatching ? 11 : 8} ry={isCelebrating ? 11 : isWatching ? 9 : 6} fill={eyeColor}>
              {isCelebrating && <animate attributeName="ry" values="11;8;11" dur="0.3s" repeatCount="indefinite" />}
              {isWatching && !isCelebrating && <animate attributeName="ry" values="9;7;9" dur="2s" repeatCount="indefinite" />}
            </ellipse>
            {/* Pupils */}
            <ellipse cx="17" cy="-10" rx={isCelebrating ? 3 : isWatching ? 5 : 4} ry={isCelebrating ? 4 : isWatching ? 7 : 5} fill={isDark ? "#1a1a1a" : "#1a1a1a"}>
              {isCelebrating && <animate attributeName="rx" values="3;4;3" dur="0.2s" repeatCount="indefinite" />}
            </ellipse>
            <ellipse cx="17" cy="10" rx={isCelebrating ? 3 : isWatching ? 5 : 4} ry={isCelebrating ? 4 : isWatching ? 7 : 5} fill={isDark ? "#1a1a1a" : "#1a1a1a"}>
              {isCelebrating && <animate attributeName="rx" values="3;4;3" dur="0.2s" repeatCount="indefinite" />}
            </ellipse>
            {/* Eye highlights */}
            <circle cx="16" cy="-11" r={isCelebrating ? 4 : isWatching ? 3 : 2} fill="#fff">
              {isCelebrating && <animate attributeName="r" values="4;2;4" dur="0.25s" repeatCount="indefinite" />}
            </circle>
            <circle cx="16" cy="9" r={isCelebrating ? 4 : isWatching ? 3 : 2} fill="#fff">
              {isCelebrating && <animate attributeName="r" values="4;2;4" dur="0.25s" repeatCount="indefinite" />}
            </circle>
            
            {/* Happy mouth */}
            {isCelebrating && (
              <path 
                d="M 30 0 Q 35 8, 45 3" 
                stroke={isDark ? "#1a1a1a" : "#1a1a1a"} 
                strokeWidth="2" 
                fill="none"
                strokeLinecap="round"
              >
                <animate attributeName="d" values="M 30 0 Q 35 8, 45 3;M 30 0 Q 35 10, 45 5;M 30 0 Q 35 8, 45 3" dur="0.3s" repeatCount="indefinite" />
              </path>
            )}
            
            {/* Nostrils */}
            <ellipse cx="48" cy="-4" rx="3" ry="2" fill={isDark ? "#1a1a1a" : "#1a1a1a"} />
            <ellipse cx="48" cy="4" rx="3" ry="2" fill={isDark ? "#1a1a1a" : "#1a1a1a"} />
            
            {/* Ears/horns */}
            <path d="M 0 -16 Q 10 -30, 5 -40 Q 0 -35, -5 -25 Q -3 -20, 0 -16" fill={wingColor} />
            <path d="M 0 16 Q 10 30, 5 40 Q 0 35, -5 25 Q -3 20, 0 16" fill={wingColor} />
          </g>

          {/* Tail */}
          {pixelSegments.length > 5 && (
            <g transform={`translate(${pixelSegments[pixelSegments.length - 1].x}, ${pixelSegments[pixelSegments.length - 1].y}) rotate(${(getAngle(pixelSegments[pixelSegments.length - 3], pixelSegments[pixelSegments.length - 1]) * 180) / Math.PI})`}>
              <path d="M 0 0 L 25 -6 L 35 0 L 25 6 Z" fill={bodyColor} />
            </g>
          )}
        </g>
      </g>
    );
  };

  const renderDragons = () => {
    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;

    return (
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 10 }}
      >
        {dragons[1] && renderSingleDragon(dragons[1], 1, width, height)}
        {dragons[0] && renderSingleDragon(dragons[0], 0, width, height)}
      </svg>
    );
  };

  const getAuthTitle = () => {
    const titles = {
      en: {
        login: { title: 'Welcome Back', subtitle: 'Sign in to continue' },
        signup: { title: 'Create Account', subtitle: 'Enter your details to sign up' },
        'forgot-password': { title: 'Reset Password', subtitle: 'Enter your email address' },
      },
      ar: {
        login: { title: 'مرحباً بك', subtitle: 'سجل دخولك للمتابعة' },
        signup: { title: 'إنشاء حساب جديد', subtitle: 'أدخل بياناتك للتسجيل' },
        'forgot-password': { title: 'استعادة كلمة المرور', subtitle: 'أدخل بريدك الإلكتروني' },
      },
    };
    
    const lang = isRTL ? 'ar' : 'en';
    return titles[lang][authMode];
  };

  const authTitles = getAuthTitle();

  // Background color based on theme
  const bgColor = isDark ? "hsl(30, 15%, 8%)" : "#e8e0d5";
  const cardBg = isDark 
    ? 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)'
    : 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)';
  const cardBorder = isDark 
    ? '1px solid rgba(255,255,255,0.15)'
    : '1px solid rgba(255,255,255,0.3)';
  const titleColor = isDark ? 'rgba(255,255,255,0.9)' : 'rgba(45,45,45,0.9)';
  const subtitleColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(75,75,75,0.7)';
  const footerColor = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(74,74,74,0.5)';

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-screen overflow-hidden transition-colors duration-500"
      style={{ backgroundColor: bgColor, cursor: "default" }}
    >
      <SettingsBar />
      {renderDragons()}

      {/* Auth Card */}
      <div 
        ref={formRef}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md px-4"
        style={{ zIndex: 5 }}
      >
        <div 
          className="relative overflow-hidden rounded-3xl p-8 transition-all duration-500 ease-out"
          style={{
            background: cardBg,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: cardBorder,
            boxShadow: isDark 
              ? '0 8px 32px rgba(0,0,0,0.4), inset 0 0 32px rgba(255,255,255,0.05)'
              : '0 8px 32px rgba(0,0,0,0.1), inset 0 0 32px rgba(255,255,255,0.1), 0 0 0 1px rgba(255,255,255,0.1)',
          }}
        >
          {/* Decorative gradient orbs */}
          <div 
            className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl"
            style={{ background: `radial-gradient(circle, rgba(255,193,7,${isDark ? '0.15' : '0.2'}) 0%, transparent 70%)` }}
          />
          <div 
            className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full blur-3xl"
            style={{ background: `radial-gradient(circle, rgba(59,130,246,${isDark ? '0.1' : '0.15'}) 0%, transparent 70%)` }}
          />
          
          {/* Glass reflection line */}
          <div 
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, rgba(255,255,255,${isDark ? '0.2' : '0.5'}), transparent)` }}
          />
          
          <div className="relative z-10">
            <div className={`text-center mb-8 ${isRTL ? 'rtl' : 'ltr'}`}>
              <h1 
                className="text-3xl font-bold mb-2"
                style={{ color: titleColor }}
              >
                {authTitles.title}
              </h1>
              <p style={{ color: subtitleColor, fontSize: '0.9rem' }}>
                {authTitles.subtitle}
              </p>
            </div>

            <AuthForm
              onModeChange={handleAuthModeChange}
              onSuccess={handleLoginSuccess}
              onFormFocus={handleFormFocus}
              onFormBlur={handleFormBlur}
              onTyping={handleFormTyping}
            />
          </div>
        </div>
      </div>

      <div 
        className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs tracking-wide text-center"
        style={{ color: footerColor, zIndex: 1 }}
      >
        <a 
          href="https://ahmednour.vercel.app" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:opacity-80 transition-opacity"
        >
          {t.developedBy}
        </a>
      </div>
    </div>
  );
};

export default Dragon;
