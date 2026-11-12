import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  ThumbsDown,
  ThumbsUp,
  Video,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCommentDate } from "../lib/dateUtils";
import { getAllComments, getItems } from "../services/itemsApi";

function Activity() {
  const [comments, setComments] = useState([]);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadActivity() {
      try {
        const [commentsData, itemsData] = await Promise.all([
          getAllComments(controller.signal),
          getItems(controller.signal),
        ]);
        setComments(commentsData);
        setItems(itemsData);
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setError("The activity could not be loaded.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadActivity();

    return () => controller.abort();
  }, []);

  const itemsByVideoId = new Map(items.map((item) => [item.videoId, item]));

  return (
    <div className="space-y-10">
      <section aria-labelledby="activity-title" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1
              id="activity-title"
              className="text-sm font-semibold uppercase tracking-[0.16em]"
            >
              Activity
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              The latest comments from the archive.
            </p>
          </div>
          {!isLoading && !error && (
            <Badge variant="secondary" className="w-fit rounded-none">
              {comments.length} comments
            </Badge>
          )}
        </div>

        {isLoading && (
          <div className="space-y-2" aria-label="Loading activity">
            {Array.from({ length: 4 }, (_, index) => (
              <Card key={index}>
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-5 w-28" />
                  </div>
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-4 w-48" />
                </CardContent>
              </Card>
            ))}
          </div>
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

        {!isLoading && !error && comments.length === 0 && (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              No comments yet.
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && comments.length > 0 && (
          <ul className="space-y-2" aria-label="All comments">
            {comments.map((comment, index) => {
              const item = itemsByVideoId.get(comment.videoId);
              const isRecommended =
                comment.recommended === "yes" || comment.recommended === true;
              const commentKey = comment.id ?? `${comment.videoId}-${index}`;

              return (
                <li key={commentKey}>
                  <Card>
                    <CardContent className="space-y-4 p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <p className="text-sm font-semibold">
                            {comment.nickname}
                          </p>
                          <time
                            className="text-xs text-muted-foreground"
                            dateTime={comment.createdAt}
                          >
                            {formatCommentDate(comment.createdAt)}
                          </time>
                        </div>
                        <Badge
                          variant={isRecommended ? "secondary" : "outline"}
                          className="w-fit shrink-0 rounded-none"
                        >
                          {isRecommended ? (
                            <ThumbsUp aria-hidden="true" />
                          ) : (
                            <ThumbsDown aria-hidden="true" />
                          )}
                          {isRecommended ? "Recommended" : "Not recommended"}
                        </Badge>
                      </div>

                      <p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">
                        {comment.comment}
                      </p>

                      <div className="border-t pt-3">
                        <Link
                          className="group flex min-w-0 items-center gap-2 text-sm font-medium transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          to={`/${comment.videoId}`}
                        >
                          <Video
                            className="size-4 shrink-0 text-muted-foreground"
                            aria-hidden="true"
                          />
                          <span className="min-w-0 truncate">
                            {item?.title ?? "Video unavailable"}
                          </span>
                          <ArrowUpRight
                            className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                            aria-hidden="true"
                          />
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

export default Activity;
