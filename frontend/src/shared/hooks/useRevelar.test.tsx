import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useRevelar } from "./useRevelar";

function Caja() {
  const ref = useRevelar<HTMLDivElement>();
  return <div ref={ref}>caja</div>;
}

describe("useRevelar", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("marca visible al intersectar", () => {
    let disparar: (entradas: Partial<IntersectionObserverEntry>[]) => void = () => {};
    const observe = vi.fn();
    const disconnect = vi.fn();
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(cb: (e: Partial<IntersectionObserverEntry>[]) => void) {
          disparar = cb;
        }
        observe = observe;
        disconnect = disconnect;
        unobserve = vi.fn();
      },
    );
    render(<Caja />);
    const caja = screen.getByText("caja");
    expect(caja).not.toHaveAttribute("data-visible");
    act(() => disparar([{ isIntersecting: true, target: caja }]));
    expect(caja).toHaveAttribute("data-visible", "true");
    expect(disconnect).toHaveBeenCalled();
  });

  it("sin IntersectionObserver marca visible enseguida", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    render(<Caja />);
    expect(screen.getByText("caja")).toHaveAttribute("data-visible", "true");
  });
});
