/** Archivo .ics (iCalendar) para agregar una cita al calendario del teléfono o la computadora. */

type CitaParaCalendario = { id: number; servicio: { nombre: string }; inicio: string; fin: string };

const utc = (iso: string) =>
  new Date(iso)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

export function generarIcs(cita: CitaParaCalendario): string {
  const lineas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Sonrisa Viva//Citas//ES",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:cita-${cita.id}@sonrisaviva`,
    `DTSTAMP:${utc(new Date().toISOString())}`,
    `DTSTART:${utc(cita.inicio)}`,
    `DTEND:${utc(cita.fin)}`,
    `SUMMARY:Cita: ${cita.servicio.nombre} · Sonrisa Viva`,
    "LOCATION:Clínica Dental Sonrisa Viva",
    "DESCRIPTION:Puedes cambiar o cancelar hasta 24 horas antes con el enlace de tu correo.",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lineas.join("\r\n") + "\r\n";
}

export function descargarIcs(cita: CitaParaCalendario): void {
  const blob = new Blob([generarIcs(cita)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = "cita-sonrisa-viva.ics";
  enlace.click();
  URL.revokeObjectURL(url);
}
