"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Crosshair, Lock, MousePointer2, Unlock, ZoomIn, ZoomOut } from "lucide-react";
import { CANVAS_SIZE, DEFAULT_PIXEL_COLOR, getPriceForPixel, getZoneName } from "@/lib/config";
import { createClient } from "@/lib/supabase/client";
import type { Pixel, Profile } from "@/types/database";
import { formatCoins } from "@/lib/utils";

type PixelMap = Map<string, Pixel>;
const keyFor = (x: number, y: number) => `${x}:${y}`;

export function PixelWall({ initialPixels, profile, testMode }: { initialPixels: Pixel[]; profile: Profile; testMode: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pixels, setPixels] = useState<PixelMap>(() => new Map(initialPixels.map((pixel) => [keyFor(pixel.x, pixel.y), pixel])));
  const [selected, setSelected] = useState({ x: 500, y: 500 });
  const [color, setColor] = useState("#35f7ff");
  const [zoom, setZoom] = useState(12);
  const [offset, setOffset] = useState({ x: 500, y: 500 });
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState("");
  const [reportReason, setReportReason] = useState("");

  const selectedPixel = pixels.get(keyFor(selected.x, selected.y));
  const price = getPriceForPixel(selected.x, selected.y);
  const canEdit = !selectedPixel?.locked || selectedPixel.owner_id === profile.id;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    ctx.scale(ratio, ratio);
    ctx.fillStyle = DEFAULT_PIXEL_COLOR;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(zoom, zoom);
    ctx.translate(-selected.x, -selected.y);

    pixels.forEach((pixel) => {
      ctx.fillStyle = pixel.color;
      ctx.fillRect(pixel.x, pixel.y, 1, 1);
      if (pixel.locked) {
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.fillRect(pixel.x, pixel.y, 1, 1);
      }
    });

    ctx.strokeStyle = "rgba(0,0,0,0.08)";
    ctx.lineWidth = 1 / zoom;
    const minX = Math.max(0, Math.floor(selected.x - offset.x / zoom) - 2);
    const maxX = Math.min(CANVAS_SIZE, Math.ceil(selected.x + (width - offset.x) / zoom) + 2);
    const minY = Math.max(0, Math.floor(selected.y - offset.y / zoom) - 2);
    const maxY = Math.min(CANVAS_SIZE, Math.ceil(selected.y + (height - offset.y) / zoom) + 2);
    if (zoom >= 8) {
      for (let x = minX; x <= maxX; x++) {
        ctx.beginPath();
        ctx.moveTo(x, minY);
        ctx.lineTo(x, maxY);
        ctx.stroke();
      }
      for (let y = minY; y <= maxY; y++) {
        ctx.beginPath();
        ctx.moveTo(minX, y);
        ctx.lineTo(maxX, y);
        ctx.stroke();
      }
    }

    ctx.strokeStyle = "#ff4fd8";
    ctx.lineWidth = 2 / zoom;
    ctx.strokeRect(selected.x, selected.y, 1, 1);
    ctx.restore();
  }, [offset, pixels, selected.x, selected.y, zoom]);

  useEffect(() => {
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [draw]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("pixels-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "pixels" }, (payload) => {
        const nextPixel = payload.new as Pixel;
        setPixels((current) => new Map(current).set(keyFor(nextPixel.x, nextPixel.y), nextPixel));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  function canvasToPixel(clientX: number, clientY: number) {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return selected;
    const x = Math.floor((clientX - rect.left - offset.x) / zoom + selected.x);
    const y = Math.floor((clientY - rect.top - offset.y) / zoom + selected.y);
    return { x: Math.max(0, Math.min(999, x)), y: Math.max(0, Math.min(999, y)) };
  }

  async function paint(lock = false) {
    setMessage("");
    const response = await fetch("/api/pixels/paint", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...selected, color, lock })
    });
    const payload = await response.json();
    setMessage(response.ok ? `Pixel aktualisiert. Kosten: ${payload.cost ?? price} Coins${lock ? " + 1 Diamond" : ""}.` : payload.error ?? "Aktion fehlgeschlagen");
  }

  async function grant(coins: number, diamonds: number) {
    const response = await fetch("/api/wallet/test-currency", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ coins, diamonds })
    });
    setMessage(response.ok ? "Testguthaben gebucht. Seite neu laden, um Wallet zu aktualisieren." : "Testguthaben fehlgeschlagen.");
  }

  async function claimAd() {
    const response = await fetch("/api/wallet/rewarded-ad", { method: "POST" });
    const payload = await response.json();
    setMessage(response.ok ? "Demo-Werbung belohnt: +10 Coins." : payload.error ?? "Cooldown aktiv.");
  }

  async function report() {
    if (!reportReason) return;
    const response = await fetch("/api/reports", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...selected, reason: reportReason })
    });
    setMessage(response.ok ? "Report gesendet. Danke!" : "Report konnte nicht gesendet werden.");
    if (response.ok) setReportReason("");
  }

  const ownedLabel = useMemo(() => {
    if (!selectedPixel?.owner_id) return "frei";
    return selectedPixel.owner_id === profile.id ? "du" : selectedPixel.owner_id.slice(0, 8);
  }, [profile.id, selectedPixel?.owner_id]);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="glass-card overflow-hidden rounded-3xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyanNeon">1’000’000 Pixel Canvas</p>
            <h1 className="text-2xl font-black">Live Pixel-Wall</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setZoom((value) => Math.max(2, value - 2))} className="rounded-xl bg-white/10 p-3"><ZoomOut size={18} /></button>
            <button onClick={() => setZoom((value) => Math.min(40, value + 2))} className="rounded-xl bg-white/10 p-3"><ZoomIn size={18} /></button>
            <button onClick={() => { setSelected({ x: 500, y: 500 }); setOffset({ x: 500, y: 320 }); }} className="rounded-xl bg-white/10 p-3"><Crosshair size={18} /></button>
          </div>
        </div>
        <canvas
          ref={canvasRef}
          className="pixelated h-[68vh] min-h-[520px] w-full cursor-crosshair bg-white"
          onMouseDown={() => setDragging(true)}
          onMouseUp={(event) => { setDragging(false); setSelected(canvasToPixel(event.clientX, event.clientY)); }}
          onMouseLeave={() => setDragging(false)}
          onMouseMove={(event) => {
            if (!dragging) return;
            setOffset((value) => ({ x: value.x + event.movementX, y: value.y + event.movementY }));
          }}
          onWheel={(event) => { event.preventDefault(); setZoom((value) => Math.max(2, Math.min(40, value + (event.deltaY < 0 ? 2 : -2)))); }}
        />
      </div>

      <aside className="space-y-4">
        <div className="glass-card rounded-3xl p-5">
          <div className="mb-4 flex items-center gap-2 text-cyanNeon"><MousePointer2 size={18} /> Ausgewählter Pixel</div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <dt className="text-slate-400">Koordinaten</dt><dd className="font-mono">{selected.x}, {selected.y}</dd>
            <dt className="text-slate-400">Besitzer</dt><dd>{ownedLabel}</dd>
            <dt className="text-slate-400">Farbe</dt><dd className="flex items-center gap-2"><span className="h-4 w-4 rounded" style={{ background: selectedPixel?.color ?? DEFAULT_PIXEL_COLOR }} />{selectedPixel?.color ?? DEFAULT_PIXEL_COLOR}</dd>
            <dt className="text-slate-400">Preiszone</dt><dd>{getZoneName(selected.x, selected.y)} · {price} Coin</dd>
            <dt className="text-slate-400">Status</dt><dd className="flex items-center gap-1">{selectedPixel?.locked ? <Lock size={14} /> : <Unlock size={14} />}{selectedPixel?.locked ? "locked" : "unlocked"}</dd>
          </dl>
        </div>

        <div className="glass-card rounded-3xl p-5">
          <label className="mb-2 block text-sm text-slate-400">Farbe wählen</label>
          <div className="flex gap-3">
            <input className="h-12 w-20 p-1" type="color" value={color} onChange={(event) => setColor(event.target.value)} />
            <input className="min-w-0 flex-1" value={color} onChange={(event) => setColor(event.target.value)} />
          </div>
          <div className="mt-4 grid gap-3">
            <button disabled={!canEdit} onClick={() => paint(false)} className="rounded-xl bg-cyanNeon px-4 py-3 font-bold text-void disabled:opacity-40">Pixel färben · {formatCoins(price)} Coin</button>
            <button disabled={!canEdit} onClick={() => paint(true)} className="rounded-xl bg-pinkNeon px-4 py-3 font-bold text-void disabled:opacity-40">Färben & locken · {formatCoins(price)} Coin + 1 Diamond</button>
          </div>
          {!canEdit && <p className="mt-3 rounded-xl bg-red-500/10 p-3 text-sm text-red-200">Locked Pixel können nur vom Besitzer geändert werden.</p>}
          {message && <p className="mt-3 rounded-xl bg-white/10 p-3 text-sm text-slate-200">{message}</p>}
        </div>

        <div className="glass-card rounded-3xl p-5">
          <h2 className="mb-3 font-bold">MVP Test & Rewarded Ads Demo</h2>
          <div className="grid gap-2">
            {testMode && (
              <>
                <button onClick={() => grant(100, 0)} className="rounded-xl bg-white/10 px-4 py-3 text-left">+100 Coins <span className="text-slate-500">Dev/Testmodus</span></button>
                <button onClick={() => grant(0, 10)} className="rounded-xl bg-white/10 px-4 py-3 text-left">+10 Diamonds <span className="text-slate-500">Dev/Testmodus</span></button>
              </>
            )}
            <button onClick={claimAd} className="rounded-xl bg-limeNeon px-4 py-3 font-bold text-void">Werbung schauen → 10 Coins <span className="font-normal">(Demo, 10 Min Cooldown)</span></button>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-5">
          <h2 className="mb-3 flex items-center gap-2 font-bold"><AlertTriangle size={18} /> Pixel melden</h2>
          <textarea value={reportReason} onChange={(event) => setReportReason(event.target.value)} placeholder="Warum soll dieser Pixel/Ort geprüft werden?" className="min-h-24 w-full" />
          <button onClick={report} className="mt-3 rounded-xl bg-white/10 px-4 py-3 font-semibold">Report senden</button>
        </div>
      </aside>
    </div>
  );
}
