"use client";

import { useEffect } from "react";

export default function ScrollRestore() {
  useEffect(() => {
    const saved = sessionStorage.getItem("landscaperScrollY");
    if (saved !== null) {
      sessionStorage.removeItem("landscaperScrollY");
      window.scrollTo(0, parseInt(saved, 10));
    }
  }, []);

  return null;
}
