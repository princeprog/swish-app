import assert from "node:assert/strict";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

import { resetNextDevDirectory } from "./reset-next-dev-cache.mjs";

async function createTempProject() {
  const projectRoot = join(
    tmpdir(),
    `swish-next-reset-${process.pid}-${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}`,
  );

  await mkdir(projectRoot, { recursive: true });

  return projectRoot;
}

test("removes only the Next development directory", async () => {
  const projectRoot = await createTempProject();

  try {
    await mkdir(join(projectRoot, ".next", "dev", "cache", "turbopack"), {
      recursive: true,
    });
    await mkdir(join(projectRoot, ".next", "server"), { recursive: true });
    await writeFile(
      join(projectRoot, ".next", "dev", "cache", "turbopack", "bundle.bin"),
      "stale development bundle",
    );
    await writeFile(
      join(projectRoot, ".next", "server", "app.js"),
      "production build artifact",
    );

    const result = await resetNextDevDirectory(projectRoot);

    assert.deepEqual(result, { ok: true, removed: true });
    await assert.rejects(readFile(join(projectRoot, ".next", "dev")));
    assert.equal(
      await readFile(join(projectRoot, ".next", "server", "app.js"), "utf8"),
      "production build artifact",
    );
  } finally {
    await rm(projectRoot, { recursive: true, force: true });
  }
});

test("succeeds when the Next development directory does not exist", async () => {
  const projectRoot = await createTempProject();

  try {
    const result = await resetNextDevDirectory(projectRoot);

    assert.deepEqual(result, { ok: true, removed: false });
  } finally {
    await rm(projectRoot, { recursive: true, force: true });
  }
});

test("returns a clear message when the development directory cannot be removed", async () => {
  const projectRoot = await createTempProject();

  try {
    await mkdir(join(projectRoot, ".next", "dev"), { recursive: true });

    const result = await resetNextDevDirectory(projectRoot, {
      removeDevDirectory: async () => {
        const error = new Error("EPERM: operation not permitted");
        error.code = "EPERM";
        throw error;
      },
    });

    assert.deepEqual(result, {
      ok: false,
      message: "Stop the development server, then run this command again.",
    });
  } finally {
    await rm(projectRoot, { recursive: true, force: true });
  }
});
