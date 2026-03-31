/**
 * electron-builder afterSign hook — notarize the signed .app with Apple notarytool.
 *
 * This intentionally mirrors the manual command that works:
 *   xcrun notarytool submit "<zip>" --keychain-profile "persuaid-notary" --wait
 *
 * Optional:
 *   SKIP_NOTARIZE=1 — skip notarization (local unsigned test builds)
 *
 * Notes:
 * - Must export via `module.exports = async function (...) {}` for electron-builder hooks.
 * - Uses a saved Keychain profile for notarytool auth (no APPLE_* env auth).
 *   Create once (interactive): `xcrun notarytool store-credentials "persuaid-notary" --apple-id ... --team-id ...`
 */
const path = require("path");
const { spawn } = require("child_process");

function spawnWithLiveOutput(cmd, args, opts) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { ...opts, stdio: ["ignore", "pipe", "pipe"] });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (d) => {
      const s = d.toString();
      stdout += s;
      process.stdout.write(s);
    });
    child.stderr.on("data", (d) => {
      const s = d.toString();
      stderr += s;
      process.stderr.write(s);
    });
    child.on("error", (err) => {
      reject({ err, stdout, stderr, code: null });
    });
    child.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr, code });
      else reject({ err: new Error(`${cmd} exited with code ${code}`), stdout, stderr, code });
    });
  });
}

module.exports = async function notarizeOrSkip(context) {
  if (process.env.SKIP_NOTARIZE === "1") {
    console.log("[afterSign] SKIP_NOTARIZE=1 — skipping notarization.");
    return;
  }

  const { electronPlatformName, appOutDir, packager } = context;
  if (electronPlatformName !== "darwin") return;

  const appBundleId = "com.persuaid.app";
  const keychainProfile = "persuaid-notary";

  const appName = packager?.appInfo?.productFilename || context?.packager?.appInfo?.productFilename || "Persuaid";
  const appPath = path.join(appOutDir, `${appName}.app`);

  // notarytool is happiest with a zip. Use `ditto` to create the same style as common guides:
  // ditto -c -k --sequesterRsrc --keepParent <appPath> <zipPath>
  const zipPath = path.join(appOutDir, `${appName}-notary.zip`);

  console.log("[afterSign] Notarization start.");
  console.log("[afterSign] appPath:", appPath);
  console.log("[afterSign] zipPath:", zipPath);
  console.log("[afterSign] appBundleId:", appBundleId);
  console.log("[afterSign] using keychainProfile:", keychainProfile, "(yes)");

  const breadcrumbEveryMs = 30_000;
  let breadcrumbTicks = 0;
  const breadcrumb = setInterval(() => {
    breadcrumbTicks += 1;
    console.log(`[afterSign] notarization in progress… (${breadcrumbTicks * (breadcrumbEveryMs / 1000)}s elapsed)`); // keep CI alive
  }, breadcrumbEveryMs);

  try {
    console.log("[afterSign] Creating notarization zip via ditto…");
    console.log("[afterSign] Calling: ditto -c -k --sequesterRsrc --keepParent <app> <zip>");
    await spawnWithLiveOutput(
      "ditto",
      ["-c", "-k", "--sequesterRsrc", "--keepParent", appPath, zipPath],
      { cwd: appOutDir }
    );
    console.log("[afterSign] Zip created.");

    console.log(`[afterSign] About to call notarytool submit --wait (this can take minutes)…`);
    console.log(
      `[afterSign] Calling: xcrun notarytool submit "${zipPath}" --keychain-profile "${keychainProfile}" --wait`
    );

    await spawnWithLiveOutput(
      "xcrun",
      ["notarytool", "submit", zipPath, "--keychain-profile", keychainProfile, "--wait"],
      { cwd: appOutDir }
    );

    console.log("[afterSign] notarytool returned successfully.");
    console.log("[afterSign] Notarization complete.");
  } catch (error) {
    const err = error && error.err ? error.err : error;
    console.error("[afterSign] Notarization failed.");
    console.error("[afterSign] appPath:", appPath);
    console.error("[afterSign] zipPath:", zipPath);
    console.error("[afterSign] appBundleId:", appBundleId);
    console.error("[afterSign] keychainProfile:", keychainProfile);
    console.error("[afterSign] Full error object:", error);
    if (err instanceof Error) {
      console.error("[afterSign] Error message:", err.message);
      if (err.stack) console.error(err.stack);
    } else {
      console.error("[afterSign] Error:", String(err));
    }
    throw err instanceof Error ? err : new Error(String(err));
  } finally {
    clearInterval(breadcrumb);
  }
};
