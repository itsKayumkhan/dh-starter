import Link from "next/link";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { site } from "@/config/site";
import { ROUTES } from "@/lib/constants/routes";

export default function Forbidden() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="bg-muted text-primary mb-3 flex size-11 items-center justify-center rounded-lg">
            <ShieldX aria-hidden="true" className="size-6" />
          </div>
          <p className="text-muted-foreground text-sm font-medium">
            {site.name} / 403
          </p>
          <CardTitle className="text-2xl">Access denied</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Your account does not have permission to view this page.
          </p>
          <Button asChild>
            <Link href={ROUTES.dashboard}>Back to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
