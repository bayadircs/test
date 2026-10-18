// Paste this file into a new Scriptable script named IW-Update-From-GitHub.
// Downloads source text only. It never evaluates or runs downloaded code.
const owner = "bayadircs";
const repository = "test";
const branch = "main";
const remoteFolder = "iphone-widgets";
const names = ["widget-01.js", "widget-02.js", "widget-03.js", "widget-04.js", "widget-05.js"];

async function confirm(title, message, action) {
  const alert = new Alert();
  alert.title = title;
  alert.message = message;
  alert.addAction(action);
  alert.addCancelAction("Cancel");
  return (await alert.presentAlert()) === 0;
}

async function showMessage(title, message) {
  const alert = new Alert();
  alert.title = title;
  alert.message = message;
  alert.addAction("OK");
  await alert.presentAlert();
}

async function main() {
  if (config.runsInWidget) {
    throw new Error("Run this updater inside the Scriptable app, not as a widget.");
  }

  const local = FileManager.local();
  const downloadFolder = local.joinPath(local.documentsDirectory(), "iphone-widgets-downloads");
  if (!local.fileExists(downloadFolder)) local.createDirectory(downloadFolder, true);

  const cloud = FileManager.iCloud();
  const scriptFolder = cloud.documentsDirectory();
  let downloaded = 0;
  let installed = 0;
  const errors = [];

  for (const name of names) {
    const url = `https://raw.githubusercontent.com/${owner}/${repository}/${branch}/${remoteFolder}/${name}`;
    try {
      const request = new Request(url);
      request.timeoutInterval = 20;
      const source = await request.loadString();
      if (!request.response || request.response.statusCode !== 200 || !source.trim()) {
        throw new Error(`Download failed (HTTP ${request.response ? request.response.statusCode : "unknown"}).`);
      }

      // Keep an on-device copy even if the user decides not to install it.
      local.writeString(local.joinPath(downloadFolder, name), source);
      downloaded++;

      const scriptName = `IW-${name}`;
      const destination = cloud.joinPath(scriptFolder, scriptName);
      const verb = cloud.fileExists(destination) ? "Replace managed copy" : "Install managed copy";
      const review = await confirm(
        name,
        `Downloaded to on-device storage. Preview the source before installing it in Scriptable as ${scriptName}. Existing unrelated scripts are untouched.`,
        "Preview code"
      );
      if (!review) continue;
      await QuickLook.present(source, true);
      if (await confirm(scriptName, "Did you review the source? This saves it in Scriptable's iCloud scripts folder. It will not run now.", verb)) {
        cloud.writeString(destination, source);
        installed++;
      }
    } catch (error) {
      errors.push(`${name}: ${error.message || error}`);
    }
  }

  await showMessage(
    "Update finished",
    `${downloaded} downloaded on this iPhone; ${installed} installed for Scriptable. Open an IW-widget script to inspect and run it manually.\n${errors.length ? "Errors:\n" + errors.join("\n") : "No download errors."}`
  );
}

await main();
Script.complete();
