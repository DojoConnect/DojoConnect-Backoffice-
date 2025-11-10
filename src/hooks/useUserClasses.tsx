import { useEffect, useState } from "react";

export function useUserClasses(email: string) {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!email) {
      setLoading(false);
      setClasses([]);
      setError(null);
      return;
    }
    setLoading(true);
    fetch(`https://www.backoffice-api.dojoconnect.app/get_user_classes?email=${encodeURIComponent(email)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setClasses(data.classes || []);
          setError(null); 
        } else {
          setClasses([]); 
          setError(null);
        }
      })
      .catch(() => setError("Failed to fetch classes"))
      .finally(() => setLoading(false));
  }, [email]);

  return { classes, loading, error };
}