import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, useCallback, useEffect } from "react";
import baseImg from "@/assets/base.jpg.asset.json";
import neviimImg from "@/assets/neviim.png.asset.json";
import amimImg from "@/assets/amim.png.asset.json";
import iconsImg from "@/assets/icons.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ציר זמן - יהודה וישראל" },
      { name: "description", content: "ציר זמן אינטראקטיבי של מלכי יהודה וישראל עם שכבות נביאים, עמים, מלחמה ושלום" },
    ],
  }),
  component: TimelinePage,
});

type LayerKey = "neviim" | "amim" | "icons";

const LAYERS: { key: LayerKey; label: string; src: string }[] = [
  { key: "neviim", label: "נביאים", src: neviimImg.url },
  { key: "amim", label: "עמים", src: amimImg.url },
  { key: "icons", label: "מלחמה ושלום", src: iconsImg.url },
];

const BASE_WIDTH = 1920;
const MAGNIFICATION = 3;

function TimelinePage() {
  const [active, setActive] = useState<Record<LayerKey, boolean>>({
    neviim: false,
    amim: false,
    icons: false,
  });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [customZoom, setCustomZoom] = useState("100");
  const dragging = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hScrollRef = useRef<HTMLDivElement>(null);
  const ignoreScrollRef = useRef(false);
  const [containerWidth, setContainerWidth] = useState(0);

  const fitScale = useCallback(() => {
    const el = containerRef.current;
    if (!el) return 1;
    return (el.clientWidth / (BASE_WIDTH * MAGNIFICATION)) * 0.98;
  }, []);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) setContainerWidth(containerRef.current.clientWidth);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    setCustomZoom(String(Math.round(scale * 100)));
  }, [scale]);

  const toggle = (k: LayerKey) => setActive((s) => ({ ...s, [k]: !s[k] }));

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
    (e.target as Element).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    setOffset({ x: e.clientX - dragging.current.x, y: e.clientY - dragging.current.y });
  };
  const onPointerUp = (e: React.PointerEvent) => {
    dragging.current = null;
    try { (e.target as Element).releasePointerCapture(e.pointerId); } catch {}
  };

  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      setScale((s) => clampScale(s * (e.deltaY < 0 ? 1.1 : 0.9)));
    } else {
      const dx = e.shiftKey ? (e.deltaY || e.deltaX || 0) : (e.deltaX || 0);
      const dy = e.shiftKey ? 0 : (e.deltaY || 0);
      setOffset((o) => ({ x: o.x - dx, y: o.y - dy }));
    }
  }, []);

  const onHScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (ignoreScrollRef.current) return;
    const bar = e.currentTarget;
    const sl = bar.scrollLeft;
    const contentWidth = BASE_WIDTH * scale * MAGNIFICATION;
    const newX = -sl - containerWidth / 2 + contentWidth / 2;
    setOffset((o) => ({ ...o, x: newX }));
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [onWheel]);

  useEffect(() => {
    const bar = hScrollRef.current;
    if (!bar || !containerWidth) return;
    if (ignoreScrollRef.current) return;
    const contentWidth = BASE_WIDTH * scale * MAGNIFICATION;
    if (contentWidth <= containerWidth) {
      bar.scrollLeft = 0;
      return;
    }
    const contentLeftEdge = containerWidth / 2 + offset.x - contentWidth / 2;
    const sl = Math.max(0, Math.min(bar.scrollWidth - bar.clientWidth, -contentLeftEdge));
    ignoreScrollRef.current = true;
    bar.scrollLeft = sl;
    setTimeout(() => { ignoreScrollRef.current = false; }, 50);
  }, [offset.x, scale, containerWidth]);

  const clampScale = (s: number) => Math.min(3, Math.max(0.1, s));
  const setZoom = (s: number) => setScale(clampScale(s));
  const zoomIn = () => setZoom(scale * 1.2);
  const zoomOut = () => setZoom(scale / 1.2);
  const fullView = () => { setScale(fitScale()); setOffset({ x: 0, y: 0 }); };
  const reset = () => { setZoom(1); setOffset({ x: 0, y: 0 }); };

  const handleCustomZoom = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customZoom, 10);
    if (!isNaN(val)) setZoom(val / 100);
  };

  return (
    <div dir="rtl" className="flex min-h-screen flex-col bg-stone-100">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-300 bg-stone-50 px-4 py-3 shadow-sm">
        <h1 className="text-xl font-bold text-stone-800">ציר זמן — מלכי יהודה וישראל</h1>

        {/* שליטת גודל / זום */}
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-stone-300 bg-white px-2 py-1.5 shadow-sm">
          <span className="px-1 text-xs font-semibold text-stone-500">גודל</span>
          <button onClick={fullView} className="rounded-md border border-stone-400 bg-white px-3 py-1.5 text-sm hover:bg-stone-100">מבט מלא</button>
          <button onClick={() => setZoom(1)} className="rounded-md border border-stone-400 bg-white px-3 py-1.5 text-sm hover:bg-stone-100">100%</button>
          <button onClick={() => setZoom(1.5)} className="rounded-md border border-stone-400 bg-white px-3 py-1.5 text-sm hover:bg-stone-100">150%</button>
          <button onClick={() => setZoom(2)} className="rounded-md border border-stone-400 bg-white px-3 py-1.5 text-sm hover:bg-stone-100">200%</button>
          <button onClick={() => setZoom(3)} className="rounded-md border border-stone-400 bg-white px-3 py-1.5 text-sm hover:bg-stone-100">300%</button>
          <button onClick={zoomOut} className="rounded-md border border-stone-400 bg-white px-3 py-1.5 text-sm hover:bg-stone-100">−</button>
          <form onSubmit={handleCustomZoom} className="flex items-center gap-1">
            <input
              type="number"
              value={customZoom}
              onChange={(e) => setCustomZoom(e.target.value)}
              className="w-16 rounded-md border border-stone-400 px-2 py-1.5 text-sm text-center"
              min="10"
              max="300"
            />
            <span className="text-sm text-stone-600">%</span>
          </form>
          <button onClick={zoomIn} className="rounded-md border border-stone-400 bg-white px-3 py-1.5 text-sm hover:bg-stone-100">+</button>
          <button onClick={reset} className="rounded-md border border-stone-400 bg-white px-3 py-1.5 text-sm hover:bg-stone-100">איפוס</button>
        </div>
      </header>

      <div className="flex items-center justify-center gap-4 border-b border-stone-300 bg-stone-50 px-4 py-2 shadow-sm">
        <span className="text-sm font-semibold text-stone-500">שכבות</span>
        <div className="flex items-center gap-2">
          {LAYERS.map((l) => (
            <button
              key={l.key}
              onClick={() => toggle(l.key)}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium transition ${
                active[l.key]
                  ? "border-amber-700 bg-amber-700 text-white shadow"
                  : "border-stone-400 bg-white text-stone-700 hover:bg-stone-100"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div

        ref={containerRef}
        className="relative flex-1 cursor-grab overflow-hidden active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className="absolute left-1/2 top-1/2 select-none"
          style={{
            transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${scale * MAGNIFICATION})`,
            transformOrigin: "center center",
          }}
        >
          <div className="relative" style={{ width: BASE_WIDTH }}>
            <img
              src={baseImg.url}
              alt="ציר זמן מלכי יהודה וישראל"
              className="block max-w-none"
              draggable={false}
              style={{ width: BASE_WIDTH, height: "auto" }}
            />
            {LAYERS.map((l) =>
              active[l.key] ? (
                <img
                  key={l.key}
                  src={l.src}
                  alt={l.label}
                  draggable={false}
                  className="pointer-events-none absolute left-0 top-0 block max-w-none"
                  style={{ width: BASE_WIDTH, height: "auto" }}
                />
              ) : null
            )}
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 rounded-full bg-stone-800/70 px-3 py-1 text-xs text-white">
          גרור להזזה · גלגלת לגלילה · Ctrl לזום
        </div>

        <div
          ref={hScrollRef}
          onScroll={onHScroll}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute bottom-0 left-0 right-0 h-5 overflow-x-auto overflow-y-hidden bg-stone-200/80"
          style={{ direction: "ltr" }}
        >
          <div style={{ width: Math.max(containerWidth, BASE_WIDTH * scale * MAGNIFICATION), height: 1 }} />
        </div>
      </div>
    </div>
  );
}
