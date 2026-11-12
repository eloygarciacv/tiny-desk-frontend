import { useEffect, useState } from "react";
import { AlertCircle, ArrowUpRight, Search, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getItems } from "../services/itemsApi";

function HomePage() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredItems = items.filter((item) =>
    item.title.toLowerCase().includes(normalizedSearchQuery),
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadItems() {
      try {
        const data = await getItems(controller.signal);
        setItems(data);
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setError("The collection could not be loaded.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadItems();

    return () => controller.abort();
  }, []);

  return (
    <div className="space-y-10">
      <section aria-labelledby="archive-title" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id="archive-title"
              className="text-sm font-semibold uppercase tracking-[0.16em]"
            >
              Concert archive
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Select a title to watch the full performance.
            </p>
          </div>
          <div className="flex w-full flex-col items-start gap-2 sm:w-auto sm:items-end">
            <div
              className="relative w-full sm:w-72"
              role="search"
              aria-label="Search concert archive"
            >
              <label htmlFor="concert-search" className="sr-only">
                Search concerts
              </label>
              <Search
                className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="concert-search"
                type="text"
                inputMode="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search concerts"
                autoComplete="off"
                disabled={isLoading || Boolean(error)}
                aria-controls="concert-list"
                className="h-9 pl-8 pr-9"
              />
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {!isLoading && !error && (
          <div>
            <Badge
              variant="secondary"
              className="w-fit rounded-none"
              aria-live="polite"
            >
              {filteredItems.length}{" "}
              {filteredItems.length === 1 ? "concert" : "concerts"}
            </Badge>
          </div>
        )}
        {isLoading && (
          <ul className="grid gap-2" aria-label="Loading concerts">
            {Array.from({ length: 8 }, (_, index) => (
              <li key={index}>
                <Card>
                  <CardContent className="p-0">
                    <Skeleton className="h-14 w-full" />
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}

        {error && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent
              className="flex items-start gap-3 p-4 text-sm"
              role="alert"
            >
              <AlertCircle
                className="mt-0.5 size-4 shrink-0 text-destructive"
                aria-hidden="true"
              />
              <p>{error} Check that json-server is running on port 3000.</p>
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && items.length === 0 && (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              No concerts available.
            </CardContent>
          </Card>
        )}

        {!isLoading &&
          !error &&
          items.length > 0 &&
          filteredItems.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-start gap-3 p-6 text-sm">
                <p role="status">
                  No concerts found for &quot;{searchQuery.trim()}&quot;.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                >
                  Clear search
                </Button>
              </CardContent>
            </Card>
          )}

        {!isLoading && !error && filteredItems.length > 0 && (
          <ul
            id="concert-list"
            className="grid gap-2"
            aria-label="Concert list"
          >
            {filteredItems.map((item) => (
              <li key={item.videoId}>
                <Card className="group transition-colors hover:bg-muted/50">
                  <CardContent className="p-0">
                    <Link
                      className="flex min-h-14 items-center justify-between gap-4 px-4 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                      to={`/${item.videoId}`}
                    >
                      <span>{item.title}</span>
                      <ArrowUpRight
                        className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </Link>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default HomePage;
