// src/components/ImageModal.tsx
import { useEffect } from "react";

type ImageModalProps = {
  imageUrl: string;
  onClose: () => void;
};

export default function ImageModal({ imageUrl, onClose }: ImageModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
      onClick={onClose}
      style={{ padding: "2rem" }}
    >
      <div className="relative max-w-6xl max-h-[90vh]" style={{ padding: "2rem" }}>
        <button
          className="rounded-full flex items-center justify-center hover:bg-opacity-75"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: "-1rem",
            right: "-1rem",
            width: "3rem",
            height: "3rem",
            fontSize: "1.5rem",
            color: "#fff",
            background: "rgba(0, 0, 0, 0.7)",
            border: "2px solid rgba(255, 255, 255, 0.3)",
            cursor: "pointer",
            zIndex: 10
          }}
        >
          ✕
        </button>
        <img
          src={imageUrl}
          alt="Question attachment"
          className="rounded-lg"
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: "100%",
            maxHeight: "80vh",
            objectFit: "contain",
            display: "block",
            margin: "0 auto",
            boxShadow: "0 0 30px rgba(0,0,0,0.5)"
          }}
        />
      </div>
    </div>
  );
}
