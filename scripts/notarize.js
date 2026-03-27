/**
 * electron-builder afterSign hook — notarize the signed .app with Apple notarytool,
 * then staple the ticket (handled inside @electron/notarize).
 *
 * Required env (App Store Connect / Apple ID):
 *   APPLE_ID                      — Apple ID email
 *   APPLE_APP_SPECIFIC_PASSWORD   — app-specific password (not your Apple ID password)
 *   APPLE_TEAM_ID                 — 10-char Team ID (Membership page)
 *
 * Optional:
 *   SKIP_NOTARIZE=1               — skip notarization (local unsigned test builds)
 */
const path = require("path");

exports.default = async function notarizeOrSkip(context) {
  if (process.env.SKIP_NOTARIZE === "1") {
    console.log("[afterSign] SKIP_NOTARIZE=1 — skipping notarization.");
    return;
  }

  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== "darwin") {
    return;
  }

  const appleId = process.env.APPLE_ID;
  const appleIdPassword = process.env.APPLE_APP_SPECIFIC_PASSWORD;
  const teamId = process.env.APPLE_TEAM_ID;

  if (!appleId || !appleIdPassword || !teamId) {
    console.warn(
      "[afterSign] Notarization skipped: set APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, and APPLE_TEAM_ID (this is why electron-builder logs skipped notarization)."
    );
    return;
  }

  const { notarize } = require("@electron/notarize");

  const appName = `${context.packager.appInfo.productFilename}.app`;
  const appPath = path.join(appOutDir, appName);

  console.log(`[afterSign] Notarizing ${appPath}…`);

  await notarize({
    tool: "notarytool",
    appPath,
    appleId,
    appleIdPassword,
    teamId,
  });

  console.log("[afterSign] Notarization and stapling finished.");
};
