
'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Loader2 } from 'lucide-react';
import { incrementCounter, getAveragePredictions } from '@/app/actions';

type Prediction = {
  x: number; // -50 to 50
  y: number; // -50 to 50
};

function ThankYouContent() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();

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
    async function fetchPredictions() {
      try {
        const preds = await getAveragePredictions();
        setPredictions(preds);
      } catch (error) {
        console.error("Failed to fetch predictions:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPredictions();
  }, []);

  const handleCTAClick = () => {
    incrementCounter('thankYouCTAclick');
  };
  
  // Convert from -50 to +50 to 0-100 percentage for CSS positioning
  const convertToPercent = (p: Prediction) => {
      const x = p.x + 50;
      const y = (p.y * -1) + 50; // Invert Y axis back for browser coordinates
      return { x, y };
  };

  const userDotPosition = userAveragePrediction ? convertToPercent(userAveragePrediction) : null;

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 gap-8">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
            <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="mt-4 text-2xl font-bold">
            Your forecast has been successfully submitted.
          </CardTitle>
          <CardDescription>
            Thank you! We appreciate you taking the time to share your perspective.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button asChild>
            <Link 
              href="https://www.computerhistory.org/collections/catalog" 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={handleCTAClick}
            >
              Explore the CHM collection
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-center">How your forecast compares</CardTitle>
          <CardDescription className="text-center">This chart shows the average forecast from all previous visitors. Your forecast is the blue dot.</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
                <div className="relative w-full h-64 text-foreground/80 font-bold uppercase text-xs tracking-wider flex flex-col p-6">
                    <p className="absolute -top-1 left-1/2 -translate-x-1/2">Hope</p>
                    <p className="absolute -bottom-1 left-1/2 -translate-x-1/2">Fear</p>
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
                                className="absolute w-3 h-3 bg-blue-500 rounded-full -translate-x-1/2 -translate-y-1/2 border-2 border-white"
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
    </main>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ThankYouContent />
    </Suspense>
  );
}
