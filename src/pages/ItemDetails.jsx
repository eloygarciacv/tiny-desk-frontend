import { useEffect, useState } from "react";
import { AlertCircle, ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { formatCommentDate } from "../lib/dateUtils";
import {
  createComment,
  getComments,
  getItem,
  sortCommentsByDate,
  updateComment,
  deleteComment,
} from "../services/itemsApi";

const OWNER_STORAGE_KEY = "tiny-desk-randomizer-owner-id";
const EMPTY_COMMENT = {
  nickname: "Annonymous",
  recommended: "",
  comment: "",
};
const EMPTY_EDIT_COMMENT = {
  nickname: "",
  recommended: "",
  comment: "",
};

function createOwnerId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getSessionOwnerId() {
  if (typeof window === "undefined") {
    return null;
  }

  const existingOwnerId = window.sessionStorage.getItem(OWNER_STORAGE_KEY);

  if (existingOwnerId) {
    return existingOwnerId;
  }

  const ownerId = createOwnerId();
  window.sessionStorage.setItem(OWNER_STORAGE_KEY, ownerId);
  return ownerId;
}

function ItemDetails() {
  const { videoId } = useParams();
  const [ownerId] = useState(getSessionOwnerId);
  const [item, setItem] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentsVideoId, setCommentsVideoId] = useState(null);
  const [commentForm, setCommentForm] = useState(EMPTY_COMMENT);
  const [isLoading, setIsLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [commentsError, setCommentsError] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT_COMMENT);
  const [editError, setEditError] = useState("");
  const [commentToDelete, setCommentToDelete] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadItem() {
      try {
        const data = await getItem(videoId, controller.signal);
        setItem(data);
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setError("The concert could not be loaded.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadItem();

    return () => controller.abort();
  }, [videoId]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadComments() {
      try {
        const data = await getComments(videoId, controller.signal);
        setComments(data);
        setCommentsVideoId(videoId);
        setCommentsError("");
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setCommentsVideoId(videoId);
          setCommentsError("The comments could not be loaded.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setCommentsLoading(false);
        }
      }
    }

    loadComments();

    return () => controller.abort();
  }, [videoId]);

  const hasLoadedComments = commentsVideoId === videoId;
  const isCommentsLoading = !hasLoadedComments || commentsLoading;
  const visibleComments = hasLoadedComments ? comments : [];
  const visibleCommentsError = hasLoadedComments ? commentsError : "";

  function handleCommentChange(event) {
    const { name, value } = event.target;
    setCommentForm((currentForm) => ({ ...currentForm, [name]: value }));
    setFormError("");
    setFormSuccess("");
  }

  function handleRecommendedChange(value) {
    setCommentForm((currentForm) => ({
      ...currentForm,
      recommended: value,
    }));
    setFormError("");
    setFormSuccess("");
  }

  async function handleCommentSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError("");
    setFormSuccess("");

    const nickname = commentForm.nickname.trim();
    const commentText = commentForm.comment.trim();

    if (!nickname || !commentForm.recommended || !commentText) {
      setIsSubmitting(false);
      setFormError("All fields are required.");
      return;
    }

    try {
      const newComment = await createComment({
        videoId,
        nickname,
        recommended: commentForm.recommended,
        comment: commentText,
        ownerId,
      });

      setComments((currentComments) =>
        sortCommentsByDate([newComment, ...currentComments]),
      );
      setCommentForm(EMPTY_COMMENT);
      setFormSuccess("Comment added.");
    } catch {
      setFormError("The comment could not be posted. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function startEditingComment(comment) {
    if (comment.ownerId !== ownerId) {
      return;
    }

    setEditingCommentId(comment.id);
    setEditForm({
      nickname: comment.nickname,
      recommended: comment.recommended,
      comment: comment.comment,
    });
    setEditError("");
    setFormSuccess("");
  }

  function cancelEditingComment() {
    setEditingCommentId(null);
    setEditForm(EMPTY_EDIT_COMMENT);
    setEditError("");
  }

  function handleEditChange(event) {
    const { name, value } = event.target;
    setEditForm((currentForm) => ({ ...currentForm, [name]: value }));
    setEditError("");
  }

  function handleEditRecommendedChange(value) {
    setEditForm((currentForm) => ({
      ...currentForm,
      recommended: value,
    }));
    setEditError("");
  }

  async function handleEditSubmit(event) {
    event.preventDefault();

    const nickname = editForm.nickname.trim();
    const commentText = editForm.comment.trim();

    if (
      !editingCommentId ||
      !nickname ||
      !editForm.recommended ||
      !commentText
    ) {
      setEditError("All fields are required.");
      return;
    }

    setIsUpdating(true);
    setEditError("");

    try {
      const updatedComment = await updateComment(editingCommentId, {
        nickname,
        recommended: editForm.recommended,
        comment: commentText,
      });

      setComments((currentComments) =>
        sortCommentsByDate(
          currentComments.map((comment) =>
            comment.id === editingCommentId
              ? { ...comment, ...updatedComment }
              : comment,
          ),
        ),
      );
      cancelEditingComment();
      setFormSuccess("Comment updated.");
    } catch {
      setEditError("The comment could not be updated. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  }

  function requestCommentDeletion(comment) {
    if (comment.ownerId !== ownerId) {
      return;
    }

    setCommentToDelete(comment);
  }

  async function handleDeleteComment() {
    if (!commentToDelete || commentToDelete.ownerId !== ownerId) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteComment(commentToDelete.id);
      setComments((currentComments) =>
        currentComments.filter((comment) => comment.id !== commentToDelete.id),
      );
      if (editingCommentId === commentToDelete.id) {
        cancelEditingComment();
      }
      setCommentToDelete(null);
      setFormSuccess("Comment deleted.");
    } catch {
      setFormError("The comment could not be deleted. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Link
          className={buttonVariants({ variant: "ghost", size: "sm" })}
          to="/"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to archive
        </Link>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)] lg:items-start">
          <Skeleton className="aspect-video w-full" />
          <div className="space-y-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-xl border-destructive/40 bg-destructive/5">
        <CardContent className="space-y-4 p-6" role="alert">
          <div className="flex items-center gap-3">
            <AlertCircle
              className="size-5 text-destructive"
              aria-hidden="true"
            />
            <h1 className="text-lg font-semibold">
              We could not open this concert.
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {error} Check that json-server is running on port 3000.
          </p>
          <Link
            className={buttonVariants({ variant: "outline", size: "sm" })}
            to="/"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to archive
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (!item) {
    return (
      <Card className="max-w-xl">
        <CardContent className="space-y-4 p-6">
          <Badge
            variant="outline"
            className="rounded-none uppercase tracking-[0.16em]"
          >
            404 / concert not found
          </Badge>
          <h1 className="text-2xl font-semibold tracking-tight">
            This performance is not in the archive.
          </h1>
          <Link
            className={buttonVariants({ variant: "outline", size: "sm" })}
            to="/"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to archive
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <article className="space-y-6">
      <Link className={buttonVariants({ variant: "ghost", size: "sm" })} to="/">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to archive
      </Link>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)] lg:items-start">
        <div className="space-y-8">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <iframe
                width="100%"
                height="327"
                src={`https://www.youtube.com/embed/${item.videoId}`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              ></iframe>
            </CardContent>
          </Card>

          <section aria-labelledby="comment-form-title" className="space-y-4">
            <div className="space-y-1">
              <h2
                id="comment-form-title"
                className="text-sm font-semibold uppercase tracking-[0.16em]"
              >
                Leave a comment
              </h2>
              <p className="text-sm text-muted-foreground">
                Share what you think about this performance.
              </p>
            </div>

            <Card>
              <CardContent className="p-5">
                <form className="space-y-5" onSubmit={handleCommentSubmit}>
                  <div className="space-y-2">
                    <Label
                      htmlFor="nickname"
                      className="font-semibold uppercase tracking-[0.14em] text-muted-foreground"
                    >
                      Nickname
                    </Label>
                    <Input
                      id="nickname"
                      name="nickname"
                      type="text"
                      autoComplete="nickname"
                      placeholder="Annonymous"
                      value={commentForm.nickname}
                      onChange={handleCommentChange}
                      required
                    />
                  </div>

                  <fieldset className="space-y-3">
                    <legend
                      id="recommended-label"
                      className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"
                    >
                      Recommended
                    </legend>
                    <RadioGroup
                      name="recommended"
                      value={commentForm.recommended}
                      onValueChange={handleRecommendedChange}
                      aria-labelledby="recommended-label"
                      required
                      className="flex flex-wrap gap-5"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem id="recommended-yes" value="yes" />
                        <Label htmlFor="recommended-yes">Yes</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem id="recommended-no" value="no" />
                        <Label htmlFor="recommended-no">No</Label>
                      </div>
                    </RadioGroup>
                  </fieldset>

                  <div className="space-y-2">
                    <Label
                      htmlFor="comment"
                      className="font-semibold uppercase tracking-[0.14em] text-muted-foreground"
                    >
                      Comment
                    </Label>
                    <Textarea
                      id="comment"
                      name="comment"
                      rows="5"
                      placeholder="Share your thoughts about this performance."
                      value={commentForm.comment}
                      onChange={handleCommentChange}
                      required
                      className="min-h-28 resize-y leading-6"
                    />
                  </div>

                  {formError && (
                    <p className="text-sm text-destructive" role="alert">
                      {formError}
                    </p>
                  )}
                  {formSuccess && (
                    <p className="text-sm text-primary" role="status">
                      {formSuccess}
                    </p>
                  )}

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Posting..." : "Post comment"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </section>

          <section aria-labelledby="comments-title" className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2
                id="comments-title"
                className="text-sm font-semibold uppercase tracking-[0.16em]"
              >
                Comments
              </h2>
              {!isCommentsLoading && !visibleCommentsError && (
                <Badge variant="secondary" className="rounded-none">
                  {visibleComments.length}
                </Badge>
              )}
            </div>

            {isCommentsLoading && (
              <div className="space-y-2" aria-label="Loading comments">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            )}

            {visibleCommentsError && (
              <Card className="border-destructive/40 bg-destructive/5">
                <CardContent className="p-4 text-sm" role="alert">
                  {visibleCommentsError}
                </CardContent>
              </Card>
            )}

            {!isCommentsLoading &&
              !visibleCommentsError &&
              visibleComments.length === 0 && (
                <Card>
                  <CardContent className="p-5 text-sm text-muted-foreground">
                    No comments yet. Be the first to share your thoughts.
                  </CardContent>
                </Card>
              )}

            {!isCommentsLoading &&
              !visibleCommentsError &&
              visibleComments.length > 0 && (
                <ul className="space-y-2" aria-label="Comments">
                  {visibleComments.map((comment, index) => {
                    const isRecommended =
                      comment.recommended === "yes" ||
                      comment.recommended === true;
                    const isOwner = comment.ownerId === ownerId;
                    const isEditing = editingCommentId === comment.id;

                    return (
                      <li key={comment.id ?? `${comment.videoId}-${index}`}>
                        <Card>
                          <CardContent className="space-y-3 p-5">
                            {isEditing ? (
                              <form
                                className="space-y-4"
                                onSubmit={handleEditSubmit}
                              >
                                <div className="space-y-2">
                                  <Label
                                    htmlFor={`edit-nickname-${comment.id}`}
                                    className="font-semibold uppercase tracking-[0.14em] text-muted-foreground"
                                  >
                                    Nickname
                                  </Label>
                                  <Input
                                    id={`edit-nickname-${comment.id}`}
                                    name="nickname"
                                    value={editForm.nickname}
                                    onChange={handleEditChange}
                                    required
                                  />
                                </div>
                                <fieldset className="space-y-3">
                                  <legend className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                    Recommended
                                  </legend>
                                  <RadioGroup
                                    name="recommended"
                                    value={editForm.recommended}
                                    onValueChange={handleEditRecommendedChange}
                                    required
                                    className="flex flex-wrap gap-5"
                                  >
                                    <div className="flex items-center gap-2">
                                      <RadioGroupItem
                                        id={`edit-recommended-yes-${comment.id}`}
                                        value="yes"
                                      />
                                      <Label
                                        htmlFor={`edit-recommended-yes-${comment.id}`}
                                      >
                                        Yes
                                      </Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <RadioGroupItem
                                        id={`edit-recommended-no-${comment.id}`}
                                        value="no"
                                      />
                                      <Label
                                        htmlFor={`edit-recommended-no-${comment.id}`}
                                      >
                                        No
                                      </Label>
                                    </div>
                                  </RadioGroup>
                                </fieldset>
                                <div className="space-y-2">
                                  <Label
                                    htmlFor={`edit-comment-${comment.id}`}
                                    className="font-semibold uppercase tracking-[0.14em] text-muted-foreground"
                                  >
                                    Comment
                                  </Label>
                                  <Textarea
                                    id={`edit-comment-${comment.id}`}
                                    name="comment"
                                    rows="4"
                                    value={editForm.comment}
                                    onChange={handleEditChange}
                                    required
                                    className="min-h-24 resize-y leading-6"
                                  />
                                </div>
                                {editError && (
                                  <p
                                    className="text-sm text-destructive"
                                    role="alert"
                                  >
                                    {editError}
                                  </p>
                                )}
                                <div className="flex justify-end gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={cancelEditingComment}
                                    disabled={isUpdating}
                                  >
                                    Cancel
                                  </Button>
                                  <Button type="submit" disabled={isUpdating}>
                                    {isUpdating ? "Saving..." : "Save changes"}
                                  </Button>
                                </div>
                              </form>
                            ) : (
                              <>
                                <div className="flex items-start justify-between gap-4">
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
                                    variant={
                                      isRecommended ? "secondary" : "outline"
                                    }
                                    className="shrink-0 rounded-none"
                                  >
                                    {isRecommended
                                      ? "Recommended"
                                      : "Not recommended"}
                                  </Badge>
                                </div>
                                <p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">
                                  {comment.comment}
                                </p>
                                {isOwner && (
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        startEditingComment(comment)
                                      }
                                    >
                                      <Pencil aria-hidden="true" />
                                      Edit
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="sm"
                                      onClick={() =>
                                        requestCommentDeletion(comment)
                                      }
                                    >
                                      <Trash2 aria-hidden="true" />
                                      Delete
                                    </Button>
                                  </div>
                                )}
                              </>
                            )}
                          </CardContent>
                        </Card>
                      </li>
                    );
                  })}
                </ul>
              )}
          </section>
        </div>

        <div className="space-y-6">
          <Badge
            variant="secondary"
            className="rounded-none uppercase tracking-[0.16em]"
          >
            Tiny Desk Concert
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
            {item.title}
          </h1>
          <Separator />
          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Description
            </h2>
            <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">
              {item.description}
            </p>
          </div>
        </div>
      </div>

      <AlertDialog
        open={commentToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setCommentToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this comment?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The comment will be permanently
              removed from this performance.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeleteComment}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete comment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
}

export default ItemDetails;
