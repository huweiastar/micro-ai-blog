import fs from "fs";
import path from "path";

export function atomicWriteFile(filePath: string, data: string | Buffer): void {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const tempPath = path.join(
    dir,
    "." + path.basename(filePath) + "." + process.pid + "." + Date.now() + ".tmp"
  );

  try {
    fs.writeFileSync(tempPath, data);
    fs.renameSync(tempPath, filePath);
  } catch (error) {
    try {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    } catch {
      /* ignore cleanup errors */
    }
    throw error;
  }
}
