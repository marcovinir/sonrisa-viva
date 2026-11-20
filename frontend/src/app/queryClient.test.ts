import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../shared/api/cliente";
import { crearQueryClient } from "./queryClient";

describe("QueryClient global", () => {
  it("un 403 en una consulta del panel invalida la sesión", async () => {
    const qc = crearQueryClient({ pruebas: true });
    const invalidar = vi.spyOn(qc, "invalidateQueries");
    await qc
      .fetchQuery({
        queryKey: ["panel", "citas"],
        queryFn: () => Promise.reject(new ApiError(403, "Sin sesión.")),
      })
      .catch(() => undefined);
    expect(invalidar).toHaveBeenCalledWith({ queryKey: ["yo"] });
  });

  it("un 403 fuera del panel no toca la sesión", async () => {
    const qc = crearQueryClient({ pruebas: true });
    const invalidar = vi.spyOn(qc, "invalidateQueries");
    await qc
      .fetchQuery({
        queryKey: ["servicios"],
        queryFn: () => Promise.reject(new ApiError(403, "No.")),
      })
      .catch(() => undefined);
    expect(invalidar).not.toHaveBeenCalled();
  });
});
