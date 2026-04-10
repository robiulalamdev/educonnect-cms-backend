import pinoRoll from "pino-roll";
import path from "path";

export default async function (opts: any) {
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");

  return pinoRoll({
    ...opts,
    // The base path stops at the Month folder
    file: path.join(process.cwd(), "logs", year, month, "app"),
    frequency: "daily",
    mkdir: true,
    // This adds the date to the filename
    dateFormat: "yyyy-MM-dd",
    extension: ".log",
  });
}
