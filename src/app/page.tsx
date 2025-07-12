"use client";

import { useState, useRef, useEffect, useCallback, type MouseEvent, type TouchEvent as ReactTouchEvent } from "react";
import { Button } from "@/components/ui/button";
import { saveTestTimestamp } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type DraggableItem = {
  id: number;
  color: string;
  x: number; // percentage
  y: number; // percentage
};

const initialItems: DraggableItem[] = [
  { id: 1, color: "bg-blue-500", x: 50, y: 50 },
  { id: 2, color: "bg-green-500", x: 50, y: 50 },
  { id: 3, color: "bg-yellow-400", x: 50, y: 50 },
  { id: 4, color: "bg-purple-500", x: 50, y: 50 },
  { id: 5, color: "bg-pink-500", x: 50, y: 50 },
  { id: 6, color: "bg-cyan-400", x: 50, y: 50 },
];

export default function Home() {
  const [items, setItems] = useState<DraggableItem[]>(initialItems);
  const [activeId, setActiveId] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const itemRef = useRef<Map<number, HTMLDivElement | null>>(new Map());
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleDragStart = useCallback((id: number, e: MouseEvent<HTMLDivElement> | ReactTouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    document.body.style.cursor = 'grabbing';
    setActiveId(id);
    const itemElement = itemRef.current.get(id);
    if (itemElement) {
      itemElement.style.zIndex = '100';
      itemElement.style.cursor = 'grabbing';
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    if (activeId === null) return;
    document.body.style.cursor = 'default';
    const itemElement = itemRef.current.get(activeId);
    if (itemElement) {
      itemElement.style.zIndex = '10';
      itemElement.style.cursor = 'grab';
    }
    setActiveId(null);
  }, [activeId]);

  const handleDragMove = useCallback((e: globalThis.MouseEvent | globalThis.TouchEvent) => {
    if (activeId === null || !gridRef.current) return;

    const gridRect = gridRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - gridRect.left;
    const y = clientY - gridRect.top;

    const xPercent = Math.max(0, Math.min(100, (x / gridRect.width) * 100));
    const yPercent = Math.max(0, Math.min(100, (y / gridRect.height) * 100));

    setItems(prevItems =>
      prevItems.map(item =>
        item.id === activeId ? { ...item, x: xPercent, y: yPercent } : item
      )
    );
  }, [activeId]);


  useEffect(() => {
    if(activeId !== null) {
      window.addEventListener("mousemove", handleDragMove);
      window.addEventListener("touchmove", handleDragMove);
      window.addEventListener("mouseup", handleDragEnd);
      window.addEventListener("touchend", handleDragEnd);
    }

    return () => {
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("touchmove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchend", handleDragEnd);
    };
  }, [activeId, handleDragMove, handleDragEnd]);
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      await saveTestTimestamp();
      toast({
        title: "Success!",
        description: "Your test submission has been recorded.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem submitting your test data.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isClient) {
    return null;
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center p-4 sm:p-8 md:p-12 font-sans overflow-hidden">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight">Hope & Fear Forecast</h1>
        <p className="text-muted-foreground mt-2">Drag the blocks to map your predictions.</p>
      </div>

      <div className="w-full max-w-2xl flex flex-col items-center gap-8">
        <div className="relative w-full text-foreground/80 font-bold uppercase text-sm tracking-wider">
          <p className="absolute -top-6 left-1/2 -translate-x-1/2">Hope</p>
          <p className="absolute -bottom-6 left-1/2 -translate-x-1/2">Fear</p>
          <p className="absolute top-1/2 -left-8 -translate-y-1/2 -rotate-90 origin-center whitespace-nowrap">Unlikely</p>
          <p className="absolute top-1/2 -right-8 -translate-y-1/2 rotate-90 origin-center whitespace-nowrap">Likely</p>
          
          <div ref={gridRef} className="relative w-full aspect-square bg-background/20 rounded-lg shadow-inner overflow-hidden">
            <div className="absolute top-1/2 left-0 w-full h-px bg-foreground/30" />
            <div className="absolute left-1/2 top-0 w-px h-full bg-foreground/30" />

            {items.map(item => (
              <div
                key={item.id}
                ref={el => itemRef.current.set(item.id, el)}
                className={cn(
                  "absolute w-10 h-10 rounded-full -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-white font-bold shadow-lg border-2 border-white/50 cursor-grab transition-all duration-100 ease-in-out",
                  item.color,
                  { 'scale-110 shadow-2xl': activeId === item.id }
                )}
                style={{
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  zIndex: activeId === item.id ? 100 : 10,
                }}
                onMouseDown={(e) => handleDragStart(item.id, e)}
                onTouchStart={(e) => handleDragStart(item.id, e)}
              />
            ))}
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={isSubmitting} size="lg" className="px-12 py-6 text-lg">
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isSubmitting ? 'Submitting...' : 'Submit Predictions'}
        </Button>
      </div>
    </main>
  );
}
