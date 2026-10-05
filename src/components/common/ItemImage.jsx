import { useState, useEffect } from "react";
import { getSignedImageUrl } from "../../lib/itemService";

export default function ItemImage({ image, imagePath, alt = "", className = "" }) {
  const [signedUrl, setSignedUrl] = useState(() => image || null);
  const [loading, setLoading] = useState(() => !image && !!imagePath);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (image) {
      return;
    }

    if (imagePath) {
      getSignedImageUrl(imagePath)
        .then((url) => {
          if (isMounted) {
            if (url) {
              setSignedUrl(url);
            } else {
              setError(true);
            }
            setLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) {
            setError(true);
            setLoading(false);
          }
        });
    }

    return () => {
      isMounted = false;
    };
  }, [image, imagePath]);

  if (loading) {
    return (
      <div className={`w-full h-full bg-surface-container flex items-center justify-center ${className}`}>
        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (signedUrl && !error) {
    return (
      <img
        src={signedUrl}
        alt={alt}
        className={className}
        onError={() => setError(true)}
      />
    );
  }

  return (
    <div className={`w-full h-full bg-surface-container-low flex items-center justify-center text-outline ${className}`}>
      <span className="material-symbols-outlined text-[20px]">image</span>
    </div>
  );
}
