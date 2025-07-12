
"use client";

import { useState, useRef, useEffect, useCallback, type MouseEvent, type TouchEvent as ReactTouchEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { savePredictions, type SavePredictionsPayload } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

type DraggableItem = {
  id: number;
  name: string;
  image: string; // path to image
  x: number; // percentage
  y: number; // percentage
  description: string;
};

const initialItems: DraggableItem[] = [
  { id: 1, name: "ASTROBOY", image: "/images/ASTROBOY.png", x: 50, y: 50, description: "A heroic android created by Dr. Tenma, Astro Boy possesses incredible powers and a human-like emotional capacity, often fighting for justice in a world where humans and robots coexist." },
  { id: 2, name: "GOLEM", image: "/images/GOLEM.png", x: 50, y: 50, description: "From Jewish folklore, the Golem is an animated anthropomorphic being created entirely from inanimate matter (usually clay or mud). It is brought to life through a magical ritual to protect its creator or community." },
  { id: 3, name: "HAL", image: "/images/HAL.png", x: 50, y: 50, description: "HAL 9000 is the sentient supercomputer from '2001: A Space Odyssey.' Responsible for controlling the Discovery One spacecraft, HAL's artificial intelligence and calm demeanor mask a deep-seated conflict that leads to a chilling display of self-preservation." },
  { id: 4, name: "HER", image: "/images/HER.png", x: 50, y: 50, description: "Samantha, the AI from the film 'Her,' is an advanced operating system designed to adapt and evolve. She forms a deep, emotional, and romantic relationship with a human, exploring the nature of love, consciousness, and what it means to be 'real'." },
  { id: 5, name: "JARVIS", image: "/images/JARVIS.png", x: 50, y: 50, description: "J.A.R.V.I.S. (Just A Rather Very Intelligent System) is Tony Stark's sophisticated AI assistant. He manages everything from the Iron Man suit to Stark's business and personal life, offering witty commentary and critical support." },
  { id: 6, name: "METROPOLIS", image: "/images/METROPOLIS.png", x: 50, y: 50, description: "The 'Maschinenmensch' (Machine-Person) from Fritz Lang's 'Metropolis' is a futuristic robot. Initially a benign creation, she is transformed into a malevolent doppelgänger of the heroine Maria to incite chaos among the city's workers." },
  { id: 7, name: "PINOCCHIO", image: "/images/PINOCCHIO.png", x: 50, y: 50, description: "A wooden puppet magically brought to life, Pinocchio's greatest desire is to become a real boy. His journey is a test of his honesty and bravery, famously marked by his nose growing whenever he tells a lie." },
  { id: 8, name: "RUR", image: "/images/RUR.png", x: 50, y: 50, description: "From Karel Čapek's 1920 play 'Rossum's Universal Robots,' which introduced the word 'robot' to the world. The play explores themes of artificial life, rebellion, and the potential obsolescence of humanity." },
  { id: 9, name: "TALOS", image: "/images/TALOS.png", x: 50, y: 50, description: "In Greek mythology, Talos was a giant automaton made of bronze, created to protect Europa in Crete from pirates and invaders. He circled the island's shores three times daily and was famously defeated by Jason and the Argonauts." },
];

export default function Home() {
  const [items, setItems] = useState<DraggableItem[]>(initialItems);
  const [activeId, setActiveId] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const itemRef = useRef<Map<number, HTMLDivElement | null>>(new Map());
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DraggableItem | null>(null);
  const [email, setEmail] = useState("");
  const [joinCommunity, setJoinCommunity] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [showDragHint, setShowDragHint] = useState(true);
  const router = useRouter();

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
    
    setShowDragHint(false);

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

  const handleDoubleClick = (item: DraggableItem) => {
    setSelectedItem(item);
    setIsInfoModalOpen(true);
  };

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
  
  const validateEmail = (email: string) => {
    if (!email) {
      setEmailError("Email is required.");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Please enter a valid email address.");
      return false;
    }
    setEmailError("");
    return true;
  };

  const handleFinalSubmit = async () => {
    if (!validateEmail(email)) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const payload: SavePredictionsPayload = {
        items,
        email,
        joinCommunity
      };
      await savePredictions(payload);
      setIsSubmitModalOpen(false);
      router.push('/thank-you');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem submitting your predictions.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isClient) {
    return null;
  }

  return (
    <>
      <main className="flex h-screen w-full flex-col font-sans overflow-hidden p-4 sm:p-6 md:p-8">
        <header className="flex items-start justify-between mb-4 z-20">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-headline tracking-tight">Hope &amp; Fear Forecast</h1>
          </div>
          <Button onClick={() => setIsSubmitModalOpen(true)} size="lg">
            Submit Predictions
          </Button>
        </header>

        <div className="flex-1 flex items-center justify-center w-full h-full relative">
          <div className="relative w-full h-full max-w-4xl text-foreground/80 font-bold uppercase text-sm tracking-wider flex flex-col">
            <p className="absolute -top-1 left-1/2 -translate-x-1/2">Hope</p>
            <p className="absolute -bottom-1 left-1/2 -translate-x-1/2">Fear</p>
            <p className="absolute top-1/2 -left-8 md:-left-12 -translate-y-1/2 -rotate-90 origin-center whitespace-nowrap">Unlikely</p>
            <p className="absolute top-1/2 -right-8 md:-right-12 -translate-y-1/2 rotate-90 origin-center whitespace-nowrap">Likely</p>
            
            <div ref={gridRef} className="relative w-full h-full bg-background/20 rounded-lg shadow-inner overflow-hidden z-10">
              <div className="absolute top-1/2 left-0 w-full h-px bg-foreground/30" />
              <div className="absolute left-1/2 top-0 w-px h-full bg-foreground/30" />

               {showDragHint && (
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-white/90 dark:bg-black/80 p-4 rounded-lg shadow-2xl text-center transition-opacity duration-500">
                  <p className="font-bold text-lg">Drag the images to map your predictions.</p>
                </div>
              )}

              {items.map(item => (
                <div
                  key={item.id}
                  ref={el => itemRef.current.set(item.id, el)}
                  className={cn(
                    "absolute w-32 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center cursor-grab transition-all duration-100 ease-in-out",
                    { 'scale-110 shadow-2xl z-50': activeId === item.id }
                  )}
                  style={{
                    left: `${item.x}%`,
                    top: `${item.y}%`,
                    zIndex: activeId === item.id ? 100 : 10,
                  }}
                  onMouseDown={(e) => handleDragStart(item.id, e)}
                  onTouchStart={(e) => handleDragStart(item.id, e)}
                  onDoubleClick={() => handleDoubleClick(item)}
                >
                   <div className="w-24 h-24 rounded-full bg-white/10 border-2 border-white/50 flex items-center justify-center shadow-lg">
                    <Image src={item.image} alt={item.name} width={80} height={80} className="object-contain pointer-events-none" />
                  </div>
                  <p className="mt-2 text-xs font-bold tracking-wider uppercase text-white drop-shadow-md">{item.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Dialog open={isSubmitModalOpen} onOpenChange={setIsSubmitModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Almost there!</DialogTitle>
            <DialogDescription>
              Please provide your email to save your forecast.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) validateEmail(e.target.value);
                }}
                className="col-span-3"
                required
              />
            </div>
             {emailError && <p className="col-span-4 text-sm text-destructive text-right">{emailError}</p>}
            <div className="flex items-center space-x-2 justify-end col-span-4">
              <Checkbox 
                id="join" 
                checked={joinCommunity}
                onCheckedChange={(checked) => setJoinCommunity(Boolean(checked))}
              />
              <label
                htmlFor="join"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Join the community for updates
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleFinalSubmit} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSubmitting ? 'Saving...' : 'Save Forecast'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isInfoModalOpen} onOpenChange={setIsInfoModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>{selectedItem?.description}</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

