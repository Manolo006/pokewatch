"use client";

import { getUIText, type UITextKey } from "@/app/lib/uiLanguage";
import { useUILanguage } from "@/app/lib/useUILanguage";

type LanguageTextProps = {
  textKey: UITextKey;
};

export default function LanguageText({ textKey }: LanguageTextProps) {
  const language = useUILanguage();

  return <>{getUIText(textKey, language)}</>;
}
