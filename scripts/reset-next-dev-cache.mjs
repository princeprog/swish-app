import { access, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const LOCKED_DIRECTORY_MESSAGE =
  "Stop the development server, then run this command again.";

export async function resetNextDevDirectory(projectRoot, options = {}) {
  const removeDevDirectory =
    options.removeDevDirectory ??
    ((devDirectory) => rm(devDirectory, { recursive: true, force: true }));
  const devDirectory = resolve(projectRoot, ".next", "dev");

  try {
    await access(devDirectory);
  } catch (error) {
    if (error?.code === "ENOENT") {
      return { ok: true, removed: false };
    }

    return { ok: false, message: LOCKED_DIRECTORY_MESSAGE };
  }

  try {
    await removeDevDirectory(devDirectory);
    return { ok: true, removed: true };
  } catch {
    return { ok: false, message: LOCKED_DIRECTORY_MESSAGE };
  }
}

async function main() {
  const result = await resetNextDevDirectory(process.cwd());

  if (!result.ok) {
    console.error(result.message);
    process.exitCode = 1;
    return;
  }

  console.log(
    result.removed
      ? "Cleared the Next.js development cache."
      : "No Next.js development cache was found.",
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
