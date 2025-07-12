'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { incrementCounter } from '@/app/actions';

export default function ThankYouPage() {
  
  const handleCTAClick = () => {
    incrementCounter('thankYouCTAclick');
  };

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
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
    </main>
  );
}
