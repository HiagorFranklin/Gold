"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";

/** Imagem que se oculta se falhar ao carregar, revelando a composição gráfica por baixo. */
export function FallbackImg(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return <img {...props} alt={props.alt ?? ""} onError={() => setFailed(true)} />;
}
