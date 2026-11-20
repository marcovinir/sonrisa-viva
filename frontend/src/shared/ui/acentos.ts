export type Acento =
  "lupa" | "brillo" | "escudo" | "capa" | "brackets" | "relleno" | "raices" | "flecha";

const ACENTO_POR_SLUG: Record<string, Acento> = {
  "valoracion-general": "lupa",
  "valoracion-ortodoncia": "lupa",
  "limpieza-dental": "brillo",
  blanqueamiento: "brillo",
  sellantes: "escudo",
  "carillas-de-resina": "capa",
  "control-brackets": "brackets",
  resina: "relleno",
  endodoncia: "raices",
  "extraccion-simple": "flecha",
};

export const acentoDe = (slug: string): Acento => ACENTO_POR_SLUG[slug] ?? "brillo";
