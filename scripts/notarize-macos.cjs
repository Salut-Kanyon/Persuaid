/**
 * electron-builder afterSign hook: notarize the signed .app with Apple (notarytool).
 * Skips unless APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, and APPLE_TEAM_ID are set.
 *
 * @see https://github.com/electron/notarize
 */
const path = require("path");

module.exports = async function notarizeMacOS(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== "darwin") return;

  try {
    const dotenv = require("dotenv");
    const projectDir = context?.packager?.projectDir || process.cwd();
    dotenv.config({ path: path.join(projectDir, ".env.local") });
  } catch (_) {}

  const { APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID } = process.env;
  if (!APPLE_ID || !APPLE_APP_SPECIFIC_PASSWORD || !APPLE_TEAM_ID) {
    console.warn(
      "\n[notarize-macos] WARNING: Notarization skipped. Without it, Gatekeeper often reports the app as \"damaged\" on other Macs.\n" +
        "  Set APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD (app-specific password from appleid.apple.com), and APPLE_TEAM_ID, then rebuild.\n"
    );
    return;
  }

  const { notarize } = require("@electron/notarize");
  const appName = context.packager.appInfo.productFilename;
  const appPath = path.join(appOutDir, `${appName}.app`);
  const appBundleId = context?.packager?.appInfo?.id || context?.packager?.appInfo?.appId || "com.persuaid.app";

  console.log(`[notarize-macos] Submitting ${appPath}… (bundleId=${appBundleId})`);
  await notarize({
    tool: "notarytool",
    appBundleId,
    appPath,
    appleId: APPLE_ID,
    appleIdPassword: APPLE_APP_SPECIFIC_PASSWORD,
    teamId: APPLE_TEAM_ID,
  });
  console.log("[notarize-macos] Notarization finished.");
};
