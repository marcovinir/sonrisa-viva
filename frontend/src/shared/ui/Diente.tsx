import type { SVGProps } from "react";

/** Silueta de diente (viewBox 24) usada en el logo, los íconos y las ilustraciones. */
export const PATH_DIENTE =
  "M7 2.5C4.5 2.5 3 4.6 3 7.2c0 2 .7 3.4 1.2 5 .6 2 .8 4.3 1.3 6.3.4 1.6 1 2.9 2 2.9 1.3 0 1.6-1.8 1.9-3.6.3-1.7.8-3.3 2.6-3.3s2.3 1.6 2.6 3.3c.3 1.8.6 3.6 1.9 3.6 1 0 1.6-1.3 2-2.9.5-2 .7-4.3 1.3-6.3.5-1.6 1.2-3 1.2-5 0-2.6-1.5-4.7-4-4.7-1.7 0-2.8.9-5 .9s-3.3-.9-5-.9z";

export function Diente({
  tamano = 24,
  trazo = "currentColor",
  relleno = "none",
  grosor = 1.6,
  sonrisa = false,
  ...resto
}: {
  tamano?: number;
  trazo?: string;
  relleno?: string;
  grosor?: number;
  sonrisa?: boolean;
} & SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill={relleno}
      stroke={trazo}
      strokeWidth={grosor}
      strokeLinejoin="round"
      {...resto}
    >
      <path d={PATH_DIENTE} />
      {sonrisa ? (
        <path d="M8 8.5c1.2.9 2.5 1.3 4 1.3s2.8-.4 4-1.3" strokeLinecap="round" fill="none" />
      ) : null}
    </svg>
  );
}
