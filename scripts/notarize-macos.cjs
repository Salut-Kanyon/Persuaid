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

  const { APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID } = process.env;
  if (!APPLE_ID || !APPLE_APP_SPECIFIC_PASSWORD || !APPLE_TEAM_ID) {
    console.log(
      "[notarize-macos] Skipping notarization (set APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID)."
    );
    return;
  }

  const { notarize } = require("@electron/notarize");
  const appName = context.packager.appInfo.productFilename;
  const appPath = path.join(appOutDir, `${appName}.app`);

  console.log(`[notarize-macos] Submitting ${appPath}…`);
  await notarize({
    tool: "notarytool",
    appPath,
    appleId: APPLE_ID,
    appleIdPassword: APPLE_APP_SPECIFIC_PASSWORD,
    teamId: APPLE_TEAM_ID,
  });
  console.log("[notarize-macos] Notarization finished.");
};
