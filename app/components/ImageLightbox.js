"use client";

import { useEffect, useState } from "react";

export default function ImageLightbox() {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    const images = document.querySelectorAll(".post-content img");
    const handleClick = (e) => setSrc(e.currentTarget.src);

    images.forEach((img) => {
      img.style.cursor = "zoom-in";
      img.addEventListener("click", handleClick);
    });

    return () => {
      images.forEach((img) => img.removeEventListener("click", handleClick));
    };
  }, []);

  useEffect(() => {
    if (!src) return;
    const onKey = (e) => e.key === "Escape" && setSrc(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [src]);

  if (!src) return null;

  return (
    <div className="lightbox-overlay" onClick={() => setSrc(null)}>
      <img src={src} alt="" className="lightbox-image" />
      <button className="lightbox-close" onClick={() => setSrc(null)} aria-label="Close">
        ×
      </button>
    </div>
  );
}
