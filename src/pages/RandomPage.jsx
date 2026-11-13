import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { getItems } from "../services/itemsApi";

function RandomPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadRandomItem() {
      try {
        const items = await getItems(controller.signal);
        const itemsWithVideoId = items.filter((item) => item.videoId);

        if (itemsWithVideoId.length === 0) {
          setError("No concerts are available.");
          return;
        }

        const randomItem =
          itemsWithVideoId[Math.floor(Math.random() * itemsWithVideoId.length)];
        navigate(`/${randomItem.videoId}`, { replace: true });
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setError("The random concert could not be loaded.");
        }
      }
    }

    loadRandomItem();

    return () => controller.abort();
  }, [navigate]);

  if (!error) {
    return null;
  }

  return (
    <Card className="border-destructive/40 bg-destructive/5">
      <CardContent className="flex items-start gap-3 p-4 text-sm" role="alert">
        <AlertCircle
          className="mt-0.5 size-4 shrink-0 text-destructive"
          aria-hidden="true"
        />
        <p>{error} Check that json-server is running on port 3000.</p>
      </CardContent>
    </Card>
  );
}

export default RandomPage;
