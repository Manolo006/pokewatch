"use client";

import { useEffect, useState } from "react";
import {
  normalizeUILanguage,
  type UILanguage,
  UI_LANGUAGE_CHANGE_EVENT,
  UI_LANGUAGE_STORAGE_KEY,
} from "@/app/lib/uiLanguage";

export function useUILanguage() {
  const [language, setLanguage] = useState<UILanguage>("it");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const applyLanguage = () => {
      setLanguage(normalizeUILanguage(window.localStorage.getItem(UI_LANGUAGE_STORAGE_KEY)));
    };

    applyLanguage();
    window.addEventListener("storage", applyLanguage);
    window.addEventListener(UI_LANGUAGE_CHANGE_EVENT, applyLanguage);

    return () => {
      window.removeEventListener("storage", applyLanguage);
      window.removeEventListener(UI_LANGUAGE_CHANGE_EVENT, applyLanguage);
    };
  }, []);

  return language;
}
