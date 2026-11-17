import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Application } from '@splinetool/runtime';
import { 
  Sparkles, 
  QrCode, 
  PlusCircle, 
  ShieldCheck, 
  Zap, 
  Flame, 
  Loader2,
  MousePointerClick,
  AlertCircle
} from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';

// Patch THREE.BufferGeometry prototype to auto-provide missing vertex attributes
if (typeof window !== 'undefined' && THREE && THREE.BufferGeometry) {
  const proto = THREE.BufferGeometry.prototype as any;
  if (!proto.__fmc_patched) {
    proto.__fmc_patched = true;
    const origGet = proto.getAttribute;
    proto.getAttribute = function(name: string) {
      let attr = origGet.call(this, name);
      if (!attr && (name === 'uv' || name === 'randomColor') && this.attributes && this.attributes.position) {
        const count = this.attributes.position.count || 0;
        if (count > 0) {
          if (name === 'uv') {
            attr = new THREE.BufferAttribute(new Float32Array(count * 2), 2);
          } else {
            const arr = new Float32Array(count * 3);
            arr.fill(1.0);
            attr = new THREE.BufferAttribute(arr, 3);
          }
          this.setAttribute(name, attr);
        }
      }
      return attr;
    };

    const origHas = proto.hasAttribute;
    proto.hasAttribute = function(name: string) {
      if (origHas.call(this, name)) return true;
      if ((name === 'uv' || name === 'randomColor') && this.attributes && this.attributes.position) {
        this.getAttribute(name);
        return true;
      }
      return false;
    };
  }

  // Filter known internal upstream warnings from Three.js NodeMaterial & WebGPU
  if (!(window as any).__fmc_warn_filtered) {
    (window as any).__fmc_warn_filtered = true;
    const originalWarn = console.warn;
    console.warn = function (...args: any[]) {
      if (typeof args[0] === 'string') {
        const msg = args[0];
        if (
          msg.includes('THREE.AttributeNode') ||
          msg.includes('Vertex attribute') ||
          msg.includes('powerPreference') ||
          msg.includes('WebGPU')
        ) {
          return; // Suppress benign upstream Three/Spline node material warnings
        }
      }
      originalWarn.apply(console, args);
    };
  }
}

interface SplineHeroSectionProps {
  onOpenReportModal: () => void;
  onOpenQRScanner: () => void;
  totalComplaints: number;
  resolvedComplaints: number;
  criticalComplaints: number;
  splineSceneUrl?: string;
}

const DEFAULT_SPLINE_SCENE = 'https://prod.spline.design/XXu4OLqSxdALqRgh/scene.splinecode';

function patchSceneGeometries(scene: any) {
  if (!scene) return;
  const visit = (obj: any) => {
    if (!obj) return;
    const geo = obj.geometry || obj._geometry;
    if (geo && geo.attributes) {
      const pos = geo.attributes.position;
      const count = pos ? pos.count : 0;
      if (count > 0) {
        // 1. Missing uv
        if (!geo.attributes.uv && !geo.hasAttribute?.('uv')) {
          const uvArray = new Float32Array(count * 2);
          try {
            geo.setAttribute('uv', new THREE.BufferAttribute(uvArray, 2));
          } catch {
            geo.attributes.uv = new THREE.BufferAttribute(uvArray, 2);
          }
        }
        // 2. Missing randomColor
        if (!geo.attributes.randomColor && !geo.hasAttribute?.('randomColor')) {
          const colorArray = new Float32Array(count * 3);
          colorArray.fill(1.0);
          try {
            geo.setAttribute('randomColor', new THREE.BufferAttribute(colorArray, 3));
          } catch {
            geo.attributes.randomColor = new THREE.BufferAttribute(colorArray, 3);
          }
        }
      }
    }
    if (obj.children && Array.isArray(obj.children)) {
      obj.children.forEach(visit);
    }
  };
  visit(scene);
}

export const SplineHeroSection: React.FC<SplineHeroSectionProps> = ({
  onOpenReportModal,
  onOpenQRScanner,
  totalComplaints,
  resolvedComplaints,
  criticalComplaints,
  splineSceneUrl = DEFAULT_SPLINE_SCENE
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const splineAppRef = useRef<Application | null>(null);
  const [is3DLoaded, setIs3DLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let isMounted = true;
    setIs3DLoaded(false);
    setLoadError(false);

    try {
      // Use webgl renderer to ensure compatibility and eliminate experimental WebGPU powerPreference notices
      const app = new Application(canvas, {
        renderer: 'webgl',
        renderMode: 'continuous'
      });
      splineAppRef.current = app;

      app.load(splineSceneUrl)
        .then(() => {
          if (isMounted) {
            // Traverse and attach any missing vertex attributes to scene geometries
            try {
              if ((app as any)._scene) {
                patchSceneGeometries((app as any)._scene);
              }
              const allObjs = app.getAllObjects?.();
              if (allObjs && Array.isArray(allObjs)) {
                allObjs.forEach((o: any) => patchSceneGeometries(o));
              }
            } catch (e) {
              // Non-critical patch
            }

            setIs3DLoaded(true);
            setLoadError(false);
          }
        })
        .catch((err) => {
          console.warn('Spline 3D Scene loading note:', err);
          if (isMounted) {
            setLoadError(true);
            setIs3DLoaded(true);
          }
        });
    } catch (err) {
      console.warn('Spline 3D init exception:', err);
      if (isMounted) {
        setLoadError(true);
        setIs3DLoaded(true);
      }
    }

    return () => {
      isMounted = false;
      if (splineAppRef.current) {
        try {
          splineAppRef.current.dispose();
        } catch {
          // ignore cleanup errors
        }
        splineAppRef.current = null;
      }
    };
  }, [splineSceneUrl]);

  return (
    <ErrorBoundary fallbackTitle="Hero 3D Section" fallbackMessage="Could not render 3D container. Your facility dashboard remains fully active.">
      <section className="relative overflow-hidden pt-6 pb-12 lg:pt-10 lg:pb-16 bg-gradient-to-b from-indigo-50/40 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-b border-slate-200/60 dark:border-slate-800/60">
        
        {/* Ambient background glows */}
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Text & Actions */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              
              {/* Pill Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold shadow-sm">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Autonomous Facility Resolution Engine</span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  <Zap className="w-3 h-3" /> Real-time SLA
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
                Instant Campus Fixes, Powered by{' '}
                <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 bg-clip-text text-transparent">
                  Predictive AI
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
                Report broken lab equipment, electrical hazards, or hostel issues in seconds with 
                <span className="font-semibold text-slate-900 dark:text-white"> QR spot scanning</span>, 
                <span className="font-semibold text-indigo-600 dark:text-indigo-400"> automated duplicate grouping</span>, and 
                <span className="font-semibold text-emerald-600 dark:text-emerald-400"> intelligent technician dispatch</span>.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                <button
                  onClick={onOpenReportModal}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 active:scale-95 transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  Report Campus Issue
                </button>

                <button
                  onClick={onOpenQRScanner}
                  className="flex items-center gap-2 px-5 py-3.5 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm active:scale-95 transition-all"
                >
                  <QrCode className="w-4 h-4 text-emerald-500" />
                  Scan Room QR Code
                </button>
              </div>

              {/* Live Stats Ticker */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-200/60 dark:border-slate-800/60 max-w-lg mx-auto lg:mx-0">
                <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800/60">
                  <p className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400">
                    {totalComplaints}
                  </p>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Total Tracked
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800/60">
                  <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {resolvedComplaints}
                  </p>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Resolved Fixes
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800/60">
                  <p className="text-xl sm:text-2xl font-black text-rose-500">
                    {criticalComplaints}
                  </p>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Active Hazards
                  </p>
                </div>
              </div>

            </div>

            {/* Right Spline 3D Interactive Model Showcase */}
            <div className="lg:col-span-6 relative flex items-center justify-center">
              
              {/* Outer Glow & Glass Container */}
              <div className="relative w-full h-[450px] sm:h-[520px] lg:h-[560px] rounded-3xl bg-gradient-to-tr from-indigo-500/10 via-emerald-500/5 to-transparent border border-slate-200/80 dark:border-slate-800/80 shadow-2xl backdrop-blur-xl overflow-hidden group">
                
                {/* Floating Badge 1: AI Duplicate Watcher */}
                <div className="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-lg flex items-center gap-2 pointer-events-none backdrop-blur-md">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200 leading-none">
                      AI Duplicate Engine
                    </p>
                    <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium">
                      Active & Deduplicating
                    </p>
                  </div>
                </div>

                {/* Floating Badge 2: Emergency SLA */}
                <div className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-lg flex items-center gap-2 pointer-events-none backdrop-blur-md">
                  <div className="w-6 h-6 rounded-lg bg-rose-100 dark:bg-rose-950/80 flex items-center justify-center text-rose-600 dark:text-rose-400">
                    <Flame className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200 leading-none">
                      Critical Hazards
                    </p>
                    <p className="text-[9px] text-rose-500 font-semibold">
                      &lt; 2 Hr SLA Guarantee
                    </p>
                  </div>
                </div>

                {/* Loading Spinner Indicator */}
                {!is3DLoaded && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-100/50 dark:bg-slate-950/50 backdrop-blur-sm transition-opacity duration-300">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Loading Interactive Spline 3D Scene...
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Streaming 3D assets
                    </p>
                  </div>
                )}

                {/* Error Banner / Fallback */}
                {loadError && (
                  <div className="absolute bottom-16 inset-x-4 z-20 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2 backdrop-blur-md">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>3D Model is streaming or requires online network access to Spline CDN.</span>
                  </div>
                )}

                {/* Direct Native Canvas Container for Spline */}
                <div className="w-full h-full flex items-center justify-center relative cursor-grab active:cursor-grabbing">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full block touch-none"
                    style={{ outline: 'none' }}
                  />
                </div>

                {/* Bottom Interactive Hint Overlay */}
                <div className="absolute bottom-3 inset-x-3 z-20 flex items-center justify-between px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-md pointer-events-none text-slate-600 dark:text-slate-300">
                  <span className="text-[11px] font-semibold flex items-center gap-1.5">
                    <MousePointerClick className="w-3.5 h-3.5 text-indigo-500" />
                    Interactive Spline 3D • Hover and drag to explore
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold">
                    Spline 3D
                  </span>
                </div>

              </div>

            </div>

          </div>
        </div>
      </section>
    </ErrorBoundary>
  );
};
