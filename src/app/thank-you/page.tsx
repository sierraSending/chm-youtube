import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

export default function ThankYouPage() {
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
            Thank You!
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p>
            We appreciate you taking the time to share your perspective.
          </p>
          <Button asChild>
            <Link href="https://www.computerhistory.org/collections/catalog" target="_blank" rel="noopener noreferrer">
              Explore the Computer History Museum's collection
            </Link>
          </Button>
          <p className="text-left text-xs text-foreground px-4">
            Journey through the Computer History Museum's vast collection of archival materials, objects, and oral histories and learn about the visionaries, innovations, and untold stories that revolutionized our digital world.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
