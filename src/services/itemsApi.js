const ITEMS_API_URL = "https://tiny-desk-backend.vercel.app/items";
const COMMENTS_API_URL = "https://tiny-desk-backend.vercel.app/comments";

function getCommentTimestamp(createdAt) {
  if (!createdAt) {
    return null;
  }

  const timestamp = new Date(createdAt).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

export function sortCommentsByDate(comments) {
  return [...comments].sort((firstComment, secondComment) => {
    const firstTimestamp = getCommentTimestamp(firstComment.createdAt);
    const secondTimestamp = getCommentTimestamp(secondComment.createdAt);

    if (firstTimestamp === null && secondTimestamp === null) {
      return 0;
    }

    if (firstTimestamp === null) {
      return 1;
    }

    if (secondTimestamp === null) {
      return -1;
    }

    return secondTimestamp - firstTimestamp;
  });
}

async function requestItems(url, signal) {
  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error("The request was not completed.");
  }

  const items = await response.json();
  return Array.isArray(items) ? items : [];
}

export function getItems(signal) {
  return requestItems(ITEMS_API_URL, signal);
}

export async function getItem(videoId, signal) {
  const items = await requestItems(
    `${ITEMS_API_URL}?videoId=${encodeURIComponent(videoId)}`,
    signal,
  );

  return items[0] ?? null;
}

export async function getComments(videoId, signal) {
  const response = await fetch(
    `${COMMENTS_API_URL}?videoId=${encodeURIComponent(videoId)}`,
    { signal },
  );

  if (!response.ok) {
    throw new Error("The comments request was not completed.");
  }

  const comments = await response.json();
  return sortCommentsByDate(Array.isArray(comments) ? comments : []);
}

export async function getAllComments(signal) {
  const response = await fetch(COMMENTS_API_URL, { signal });

  if (!response.ok) {
    throw new Error("The comments request was not completed.");
  }

  const comments = await response.json();
  return sortCommentsByDate(Array.isArray(comments) ? comments : []);
}

export async function createComment(comment, signal) {
  const commentWithTimestamp = {
    ...comment,
    createdAt: comment.createdAt ?? new Date().toISOString(),
  };
  const response = await fetch(COMMENTS_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commentWithTimestamp),
    signal,
  });

  if (!response.ok) {
    throw new Error("The comment could not be created.");
  }

  return response.json();
}

export async function updateComment(commentId, comment, signal) {
  const response = await fetch(
    `${COMMENTS_API_URL}/${encodeURIComponent(commentId)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(comment),
      signal,
    },
  );

  if (!response.ok) {
    throw new Error("The comment could not be updated.");
  }

  return response.json();
}

export async function deleteComment(commentId, signal) {
  const response = await fetch(
    `${COMMENTS_API_URL}/${encodeURIComponent(commentId)}`,
    {
      method: "DELETE",
      signal,
    },
  );

  if (!response.ok) {
    throw new Error("The comment could not be deleted.");
  }
}
