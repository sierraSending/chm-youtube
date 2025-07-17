
"use client";

import { useState, useRef, useEffect, useCallback, useMemo, type MouseEvent, type TouchEvent as ReactTouchEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { savePredictions, type SavePredictionsPayload, incrementCounter } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Loader2, PlayCircle, Menu, HomeIcon, BookOpen, UserPlus } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
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
    { id: 1, name: "ASTROBOY", image: "/images/ASTROBOY.png", x: 50, y: 50, description: "Introduced in 1952, Astro Boy, known in Japan as Mighty Atom (鉄腕アトム), is one of the most successful manga and anime characters. Created by a man who had lost his son, Astro Boy is a human-like robot boy that can think, talk, and experience emotions." },
    { id: 8, name: "PINOCCHIO", image: "/images/PINOCCHIO.png", x: 50, y: 50, description: "Carlo Collodi published his children's novel Pinocchio in 1883. A toymaker's wish is granted for his wooden puppet to become a real boy. Pinocchio gains the power of speech but, like today's chatbots, has trouble with truthfulness." },
    { id: 7, name: "METROPOLIS", image: "/images/METROPOLIS.png", x: 50, y: 50, description: "The 'Maschinenmensch' (Machine-Human) from Fritz Lang’s 1927 silent film 'Metropolis' is one of cinema's earliest and most iconic robots. Taking the form of a human woman, this robot explores the fear of AI inciting chaos and replacing humanity, a theme still relevant today." },
    { id: 5, name: "JARVIS", image: "/images/JARVIS.png", x: 50, y: 50, description: "In the 'Iron Man' films, J.A.R.V.I.S. (Just A Rather Very Intelligent System) is Tony Stark's AI assistant, helping him design and control his suits. J.A.R.V.I.S. represents the dream of a helpful, witty AI companion and has inspired real-world entrepreneurs like Mark Zuckerberg." },
    { id: 2, name: "GOLEM", image: "/images/GOLEM.png", x: 50, y: 50, description: "The golem is a protective figure from Jewish folklore. Over the centuries, this human-like creature has taken different forms and meanings. Fashioned from mud or clay, the golem can't speak but is animated by special Hebrew words written on paper and placed in or on it. Popular games like Minecraft and Pokémon include characters inspired by the golem." },
    { id: 10, name: "TALOS", image: "/images/TALOS.png", x: 50, y: 50, description: "We have imagined human-like metal beings for millennia. Talos, an animate bronze man created by the god Hephaestus, appeared in Greek mythology. Hollywood special effects expert Ray Harryhausen created an iconic interpretation of Talos for the 1963 film Jason and the Argonauts." },
    { id: 6, name: "RUR", image: "/images/RUR.png", x: 50, y: 50, description: "Czech playwright Karel Čapek's 1920 play R.U.R.—Rossum's Universal Robots—became an instant international sensation and introduced the word \"robot.\" The play imagines chemically manufactured factory workers called \"roboti\" (from the Czech for \"forced labor\"). When they revolt against humanity, their makers wish they'd made them speak different languages so that they might have been turned against one another." },
    { id: 4, name: "HER", image: "/images/HER.png", x: 50, y: 50, description: "In the 2013 film 'Her,' a lonely writer develops a relationship with Samantha, an advanced AI operating system. The film explores themes of love, connection, and what it means to be human in an increasingly digital world, inspired by early web-based chatbots like A.L.I.C.E." },
    { id: 3, name: "HAL", image: "/images/HAL.png", x: 50, y: 50, description: "The sentient computer HAL 9000 is the star of Stanley Kubrick's 1968 film '2001: A Space Odyssey.' HAL controls the systems of a spaceship and can communicate with the human crew. As the film progresses, HAL's calm, conversational voice becomes a source of terror, famously saying, 'I'm sorry, Dave. I'm afraid I've an issue.'" },
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
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DraggableItem | null>(null);
  const [email, setEmail] = useState("");
  const [joinCommunity, setJoinCommunity] = useState(false);
  const [anonymizeData, setAnonymizeData] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [termsError, setTermsError] = useState("");
  const [movedItems, setMovedItems] = useState<Set<number>>(new Set());
  const [doubleClickHintId, setDoubleClickHintId] = useState<number | null>(null);
  const hintTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const allItemsMoved = movedItems.size === initialItems.length;

  const averagePosition = useMemo(() => {
    if (items.length === 0) return { x: 50, y: 50 };
    const totalX = items.reduce((sum, item) => sum + item.x, 0);
    const totalY = items.reduce((sum, item) => sum + item.y, 0);
    return {
      x: totalX / items.length,
      y: totalY / items.length,
    };
  }, [items]);

  useEffect(() => {
    setIsClient(true);
    incrementCounter('pageLoad');
    
    return () => {
      if (hintTimeoutRef.current) {
        clearTimeout(hintTimeoutRef.current);
      }
    };
  }, []);

  const handleDragStart = useCallback((id: number, e: MouseEvent<HTMLDivElement> | ReactTouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    document.body.style.cursor = 'grabbing';
    setActiveId(id);
    const itemElement = itemRef.current.get(id);
    if (itemElement) {
      itemElement.style.zIndex = '100';
    }
    const circularElement = itemElement?.querySelector('[data-drag-handle]');
    if (circularElement) {
        (circularElement as HTMLElement).style.cursor = 'grabbing';
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    if (activeId === null) return;
    
    if (movedItems.size === 0) {
      setDoubleClickHintId(activeId);
      hintTimeoutRef.current = setTimeout(() => {
        setDoubleClickHintId(null);
      }, 5000);
    }
    
    if (!movedItems.has(activeId)) {
      incrementCounter('itemMove');
    }
    setMovedItems(prev => new Set(prev).add(activeId!));

    document.body.style.cursor = 'default';
    const itemElement = itemRef.current.get(activeId);
    if (itemElement) {
      itemElement.style.zIndex = '10';
      const circularElement = itemElement?.querySelector('[data-drag-handle]');
      if (circularElement) {
          (circularElement as HTMLElement).style.cursor = 'grab';
      }
    }
    setActiveId(null);
  }, [activeId, movedItems]);
  
  const handleDragMove = useCallback((e: globalThis.MouseEvent | globalThis.TouchEvent) => {
    if (activeId === null || !gridRef.current) return;

    if ('touches' in e) {
        e.preventDefault();
    }

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
    incrementCounter('itemDetailsClick');
    setSelectedItem(item);
    setIsInfoModalOpen(true);
    if (doubleClickHintId === item.id) {
       if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
       setDoubleClickHintId(null);
    }
  };

  useEffect(() => {
    if(activeId !== null) {
      window.addEventListener("mousemove", handleDragMove);
      window.addEventListener("touchmove", handleDragMove, { passive: false });
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
  
  const handleSubmitClick = () => {
    incrementCounter('submitButtonClick');
    setIsSubmitModalOpen(true);
  }

  const handleFinalSubmit = async () => {
    const isEmailValid = validateEmail(email);
    const isTermsValid = agreedToTerms;
    if (!isTermsValid) {
      setTermsError("You must agree to the terms and privacy policy.");
    } else {
      setTermsError("");
    }

    if (!isEmailValid || !isTermsValid) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const payload: SavePredictionsPayload = {
        items,
        email,
        joinCommunity,
        anonymizeData,
        averagePrediction: averagePosition
      };
      await savePredictions(payload);

      const avgX = Math.round(averagePosition.x - 50);
      const avgY = Math.round(averagePosition.y - 50) * -1;

      setIsSubmitModalOpen(false);
      router.push(`/thank-you?avgX=${avgX}&avgY=${avgY}`);
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

  const VideoButton = () => (
     <Button 
        onClick={() => setIsVideoModalOpen(true)} 
        variant="ghost"
        className="text-white hover:text-white hover:bg-white/20"
        aria-label="Play video"
      >
        <PlayCircle className="h-6 w-6" />
        <span className="ml-2 font-semibold sm:hidden lg:inline">Watch</span>
    </Button>
  )

  return (
    <>
      <main className="flex h-svh w-full flex-col font-sans overflow-hidden bg-[radial-gradient(ellipse_at_center,_#ea032b_0%,_#1a1a1a_100%)]">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between z-20 p-4 sm:p-6 md:p-8 gap-4">
           <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-4">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 hover:text-white sm:h-8 sm:w-8 h-10 w-10">
                        <Menu className="h-8 w-8" />
                        <span className="sr-only">Open Menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="bg-[#1a1a1a] text-white p-0 border-r-0">
                      <div className="flex flex-col h-full">
                          <div className="p-6">
                              <Image
                                  src="https://placehold.co/600x400.png"
                                  alt="CHM"
                                  width={600}
                                  height={400}
                                  data-ai-hint="abstract museum"
                                  className="rounded-lg"
                              />
                          </div>
                          <nav className="flex-1 px-6 space-y-2">
                            <Link href="#" className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors">
                                <HomeIcon className="h-5 w-5" />
                                <span className="font-semibold">Home</span>
                            </Link>
                            <Link href="https://www.computerhistory.org/collections/catalog" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors">
                                <BookOpen className="h-5 w-5" />
                                <span className="font-semibold">CHM Collection</span>
                            </Link>
                          </nav>
                          <Separator className="bg-white/20 my-4" />
                          <div className="p-6">
                              <Button asChild className="w-full bg-white text-black hover:bg-white/90">
                                  <Link href="https://computerhistory.org/membership/" target="_blank" rel="noopener noreferrer">
                                      <UserPlus className="mr-2 h-5 w-5"/>
                                      Become a Member
                                  </Link>
                              </Button>
                          </div>
                      </div>
                  </SheetContent>
                </Sheet>
                <div>
                  <p className="text-xs text-white/80 tracking-wider">CHM | Games</p>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-headline tracking-tight text-white">Your AI Predictions</h1>
                </div>
              </div>
              <div className="sm:hidden">
                 <VideoButton />
              </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="hidden sm:block">
              <VideoButton />
            </div>
            <Button 
              onClick={handleSubmitClick} 
              size="lg"
              className={cn('w-full sm:w-auto bg-white text-black hover:bg-white/90', {
                'animate-pulse-glow': allItemsMoved,
              })}
            >
              Make Predictions
            </Button>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center w-full h-full relative p-4 sm:p-6 md:p-8 pt-0 md:pt-0">
          <div className="relative w-full h-full max-w-4xl text-foreground/80 font-bold uppercase text-sm tracking-wider flex flex-col">
            <p className="absolute -top-1 left-1/2 -translate-x-1/2">Hopeful</p>
            <p className="absolute -bottom-1 left-1/2 -translate-x-1/2">Fearful</p>
            <p className="absolute top-1/2 -left-8 md:-left-12 -translate-y-1/2 -rotate-90 origin-center whitespace-nowrap">Unlikely</p>
            <p className="absolute top-1/2 -right-8 md:-right-12 -translate-y-1/2 rotate-90 origin-center whitespace-nowrap">Likely</p>
            
            <div ref={gridRef} className="relative w-full h-full rounded-lg shadow-inner overflow-hidden z-10 bg-transparent">
              <div className="absolute top-1/2 left-0 w-full h-px bg-foreground/30" />
              <div className="absolute left-1/2 top-0 w-px h-full bg-foreground/30" />

               {movedItems.size < 1 && (
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-white/90 dark:bg-black/80 p-4 rounded-lg shadow-2xl text-center transition-opacity duration-500">
                  <p className="font-bold text-lg">1. Drag the images to map your predictions.</p>
                </div>
              )}

              <div
                className="absolute w-4 h-4 bg-black rounded-full -translate-x-1/2 -translate-y-1/2 z-0"
                style={{
                  left: `${averagePosition.x}%`,
                  top: `${averagePosition.y}%`,
                }}
              />

              {items.map(item => (
                <div
                  key={item.id}
                  ref={el => itemRef.current.set(item.id, el)}
                  className={cn(
                    "absolute w-32 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center transition-all duration-100 ease-in-out select-none",
                    { 'scale-110 shadow-2xl z-50': activeId === item.id }
                  )}
                  style={{
                    left: `${item.x}%`,
                    top: `${item.y}%`,
                    zIndex: activeId === item.id ? 100 : 10,
                  }}
                  onDoubleClick={() => handleDoubleClick(item)}
                >
                   <div 
                    data-drag-handle 
                    className="w-24 h-24 rounded-full bg-white/10 border-2 border-white/50 flex items-center justify-center shadow-lg cursor-grab"
                    onMouseDown={(e) => handleDragStart(item.id, e)}
                    onTouchStart={(e) => handleDragStart(item.id, e)}
                  >
                    <Image src={item.image} alt={item.name} width={80} height={80} className="object-contain pointer-events-none" />
                  </div>
                  <p className="mt-2 text-xs font-bold tracking-wider uppercase text-white drop-shadow-md bg-red-800/80 px-2 py-1 rounded-md">{item.name}</p>
                  
                  {doubleClickHintId === item.id && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20 bg-white/90 dark:bg-black/80 p-2 rounded-lg shadow-2xl text-center transition-opacity duration-500 animate-in fade-in-0">
                      <p className="font-semibold text-sm whitespace-nowrap">double click for details</p>
                    </div>
                  )}

                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Dialog open={isSubmitModalOpen} onOpenChange={setIsSubmitModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-red-950 text-white border-red-800">
          <DialogHeader className="text-left">
            <DialogTitle>Almost there!</DialogTitle>
            <DialogDescription className="text-red-200">
              Please provide your email to make your forecast.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) validateEmail(e.target.value);
                }}
                required
                className="bg-red-900 border-red-700 text-white placeholder:text-red-300 focus:ring-red-500"
              />
              {emailError && <p className="text-sm text-red-300">{emailError}</p>}
            </div>
            
            <div className="flex items-start space-x-2">
              <Checkbox 
                id="terms" 
                checked={agreedToTerms}
                onCheckedChange={(checked) => {
                  setAgreedToTerms(Boolean(checked));
                  if (termsError) setTermsError("");
                }}
                className="border-red-400 data-[state=checked]:bg-white data-[state=checked]:text-red-950"
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I agree to the{" "}
                  <Link href="https://computerhistory.org/terms/" target="_blank" rel="noopener noreferrer" className="underline hover:text-red-200">
                    terms and conditions
                  </Link>{" "}
                  and{" "}
                  <Link href="https://computerhistory.org/privacy/" target="_blank" rel="noopener noreferrer" className="underline hover:text-red-200">
                    privacy policy
                  </Link>.
                </label>
                {termsError && <p className="text-sm text-red-300">{termsError}</p>}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="anonymize" 
                checked={anonymizeData}
                onCheckedChange={(checked) => setAnonymizeData(Boolean(checked))}
                className="border-red-400 data-[state=checked]:bg-white data-[state=checked]:text-red-950"
              />
              <label
                htmlFor="anonymize"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Keep my predictions <span className="font-bold">anonymous</span> and separate from my email.
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="join" 
                checked={joinCommunity}
                onCheckedChange={(checked) => setJoinCommunity(Boolean(checked))}
                className="border-red-400 data-[state=checked]:bg-white data-[state=checked]:text-red-950"
              />
              <label
                htmlFor="join"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Get a full report of emailed after a 1,000 predictions. Also very occasional, really good, other content.
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleFinalSubmit} disabled={isSubmitting} className="w-full text-white bg-[#ea032b] hover:bg-[#ea032b]/90">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSubmitting ? 'Saving...' : 'See how yours compares'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isInfoModalOpen} onOpenChange={setIsInfoModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle>{selectedItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>{selectedItem?.description}</p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
        <DialogContent className="max-w-3xl p-0">
             <DialogHeader>
              <DialogTitle className="sr-only">Video Player</DialogTitle>
            </DialogHeader>
            <div className="aspect-video">
                 <iframe 
                    className="w-full h-full rounded-lg"
                    src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                    title="YouTube video player" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    referrerPolicy="strict-origin-when-cross-origin" 
                    allowFullScreen
                ></iframe>
            </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
