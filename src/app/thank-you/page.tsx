
'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { CheckCircle, Loader2, Share2, Sparkles, Ghost, Target, HelpCircle, Menu, HomeIcon, BookOpen, UserPlus } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { incrementCounter, getAveragePredictions, getAggregatedPredictions, type AggregatedPrediction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

type Prediction = {
  x: number; // -50 to 50
  y: number; // -50 to 50
};

function ThankYouContent() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [aggregatedPredictions, setAggregatedPredictions] = useState<AggregatedPrediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const userAveragePrediction = useMemo(() => {
    const avgX = searchParams.get('avgX');
    const avgY = searchParams.get('avgY');
    if (avgX !== null && avgY !== null) {
      const x = parseInt(avgX, 10);
      const y = parseInt(avgY, 10);
      if (!isNaN(x) && !isNaN(y)) {
        return { x, y };
      }
    }
    return null;
  }, [searchParams]);

  useEffect(() => {
    async function fetchAllPredictions() {
      setIsLoading(true);
      try {
        const [avgPreds, aggPreds] = await Promise.all([
            getAveragePredictions(),
            getAggregatedPredictions()
        ]);
        setPredictions(avgPreds);
        setAggregatedPredictions(Object.values(aggPreds));
      } catch (error) {
        console.error("Failed to fetch predictions:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAllPredictions();
  }, []);
  
  const topRankedItems = useMemo(() => {
    if (aggregatedPredictions.length === 0) {
      return { hopeful: null, fearful: null, likely: null, unlikely: null };
    }
    const sortedByHope = [...aggregatedPredictions].sort((a, b) => b.avgY - a.avgY);
    const sortedByLikely = [...aggregatedPredictions].sort((a, b) => b.avgX - a.avgX);

    return {
      hopeful: sortedByHope[0],
      fearful: sortedByHope[sortedByHope.length - 1],
      likely: sortedByLikely[0],
      unlikely: sortedByLikely[sortedByLikely.length - 1],
    };
  }, [aggregatedPredictions]);

  const handleCTAClick = () => {
    incrementCounter('thankYouCTAclick');
  };

  const handleShare = async () => {
    const shareUrl = window.location.origin;
    const shareData = {
      title: 'My AI Predictions',
      text: "I just made my AI predictions. See how your forecast compares!",
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        throw new Error('Web Share API not supported');
      }
    } catch (err) {
      // Fallback to copying to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link Copied!",
          description: "The link has been copied to your clipboard.",
        });
      } catch (copyErr) {
        toast({
            variant: "destructive",
            title: "Could not copy link",
            description: "Please copy the link from your browser's address bar.",
        });
      }
    }
  };
  
  // Convert from -50 to +50 to 0-100 percentage for CSS positioning
  const convertToPercent = (p: Prediction) => {
      const x = p.x + 50;
      const y = (p.y * -1) + 50; // Invert Y axis back for browser coordinates
      return { x, y };
  };

  const userDotPosition = userAveragePrediction ? convertToPercent(userAveragePrediction) : null;

  return (
    <div className='flex flex-col h-screen'>
      <header className="flex items-center justify-between z-20 p-4 sm:p-6 md:p-8 bg-background">
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
                <h1 className="text-2xl md:text-3xl font-bold font-headline tracking-tight text-white">Your AI Predictions</h1>
              </div>
          </div>
      </header>
      <main className="flex-1 w-full flex-col items-center justify-center bg-background p-4 gap-8 overflow-y-auto">
        <Card className="w-full max-w-md text-center bg-transparent border-none shadow-none mx-auto">
          <CardHeader>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="mt-4 text-2xl font-bold text-foreground">
              Your forecast has been successfully submitted.
            </CardTitle>
            <CardDescription>
              Thank you! We appreciate you taking the time to share your perspective.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4">
            <Button asChild className="flex-1 bg-white text-black hover:bg-white/90">
              <Link 
                href="https://www.computerhistory.org/collections/catalog" 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={handleCTAClick}
              >
                Explore the CHM collection
              </Link>
            </Button>
            <Button onClick={handleShare} variant="outline" className="flex-1 text-white border-white hover:bg-white/20 hover:text-white">
              <Share2 className="mr-2 h-4 w-4 text-white" />
              Share with friends
            </Button>
          </CardContent>
        </Card>

        <Card className="w-full max-w-md bg-transparent border-border mx-auto mt-8">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-center text-foreground">How your forecast compares</CardTitle>
            <CardDescription className="text-center">This chart shows the average forecast from all previous visitors. Your forecast is the green dot.</CardDescription>
          </CardHeader>
          <CardContent>
              {isLoading ? (
                  <div className="flex justify-center items-center h-64">
                      <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
              ) : (
                  <div className="relative w-full h-64 text-foreground/80 font-bold uppercase text-xs tracking-wider flex flex-col p-6">
                      <p className="absolute -top-1 left-1/2 -translate-x-1/2">Hopeful</p>
                      <p className="absolute -bottom-1 left-1/2 -translate-x-1/2">Fearful</p>
                      <p className="absolute top-1/2 -left-3 -translate-y-1/2 -rotate-90 origin-center whitespace-nowrap">Unlikely</p>
                      <p className="absolute top-1/2 -right-3 -translate-y-1/2 rotate-90 origin-center whitespace-nowrap">Likely</p>
                      <div className="relative w-full h-full rounded-lg shadow-inner bg-muted/20">
                          <div className="absolute top-1/2 left-0 w-full h-px bg-foreground/30" />
                          <div className="absolute left-1/2 top-0 w-px h-full bg-foreground/30" />
                          {predictions.map((pred, index) => {
                              const pos = convertToPercent(pred);
                              return (
                                  <div
                                      key={index}
                                      className="absolute w-2 h-2 bg-foreground rounded-full -translate-x-1/2 -translate-y-1/2"
                                      style={{
                                          left: `${pos.x}%`,
                                          top: `${pos.y}%`,
                                          opacity: 0.5,
                                      }}
                                  />
                              );
                          })}

                          {userDotPosition && (
                              <div
                                  title="Your average prediction"
                                  className="absolute w-3 h-3 bg-destructive rounded-full -translate-x-1/2 -translate-y-1/2 border-2 border-white"
                                  style={{
                                      left: `${userDotPosition.x}%`,
                                      top: `${userDotPosition.y}%`,
                                      zIndex: 1,
                                  }}
                              />
                          )}
                      </div>
                  </div>
              )}
          </CardContent>
        </Card>

        <Card className="w-full max-w-md bg-transparent border-border mx-auto mt-8">
          <CardHeader>
              <CardTitle className="text-xl font-bold text-center text-foreground">Community Insights</CardTitle>
              <CardDescription className="text-center">The top ranked items based on all predictions.</CardDescription>
          </CardHeader>
          <CardContent>
              {isLoading ? (
                  <div className="flex justify-center items-center h-48">
                      <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
              ) : (
                  <div className="grid gap-4 text-sm">
                      <div className="flex items-center justify-between gap-2 p-3 bg-muted/50 rounded-lg">
                          <div className='flex items-center gap-2'>
                             <Sparkles className="h-5 w-5 text-foreground" />
                             <span className="font-semibold">Most Hopeful:</span>
                          </div>
                          <span className="font-bold text-base">{topRankedItems.hopeful?.name}</span>
                      </div>
                       <div className="flex items-center justify-between gap-2 p-3 bg-muted/50 rounded-lg">
                          <div className='flex items-center gap-2'>
                             <Ghost className="h-5 w-5 text-foreground" />
                             <span className="font-semibold">Most Fearful:</span>
                          </div>
                          <span className="font-bold text-base">{topRankedItems.fearful?.name}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 p-3 bg-muted/50 rounded-lg">
                          <div className='flex items-center gap-2'>
                              <Target className="h-5 w-5 text-foreground" />
                              <span className="font-semibold">Most Likely:</span>
                          </div>
                          <span className="font-bold text-base">{topRankedItems.likely?.name}</span>
                      </div>
                       <div className="flex items-center justify-between gap-2 p-3 bg-muted/50 rounded-lg">
                          <div className='flex items-center gap-2'>
                              <HelpCircle className="h-5 w-5 text-foreground" />
                              <span className="font-semibold">Most Unlikely:</span>
                          </div>
                          <span className="font-bold text-base">{topRankedItems.unlikely?.name}</span>
                      </div>
                  </div>
              )}
          </CardContent>
           { !isLoading && aggregatedPredictions.length > 0 && 
              <CardFooter>
                  <p className="text-xs text-muted-foreground text-center w-full">Based on {predictions.length} predictions.</p>
              </CardFooter>
          }
        </Card>
      </main>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen w-full items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <ThankYouContent />
    </Suspense>
  );
}
