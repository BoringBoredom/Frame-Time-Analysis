import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execSync } from "node:child_process";

async function main() {
  try {
    const version = readFileSync("./presentmon/version", {
      encoding: "utf-8",
    });
    const [major, minor, patch] = version.split(".");
    const localVersion = { version, major, minor, patch };

    const response = await fetch(
      "https://api.github.com/repos/GameTechDev/PresentMon/releases"
    );

    if (!response.ok) {
      throw new Error();
    }

    const releases = await response.json();

    for (const release of releases) {
      for (const asset of release.assets) {
        const match = asset.browser_download_url.match(
          /\/PresentMon-((\d+)\.(\d+)\.(\d+))-x64\.exe/
        );

        if (match) {
          const [, version, major, minor, patch] = match;

          if (
            major === localVersion.major &&
            (minor !== localVersion.minor || patch !== localVersion.patch)
          ) {
            console.log(
              `New PresentMon version found: ${localVersion.version} -> ${version}`
            );

            mkdirSync("./temp/captures", { recursive: true });
            execSync(
              `wget ${asset.browser_download_url} -O ./temp/presentmon.exe`
            );
            execSync(
              "7z a ./presentmon/presentmon.zip ./temp/presentmon.exe ./presentmon/Run.bat ./temp/captures"
            );

            writeFileSync("./presentmon/version", version, {
              encoding: "utf-8",
            });
          } else {
            console.log("No new minor/patch version found.");
          }

          return 0;
        }
      }
    }

    return 1;
  } catch {
    return 1;
  }
}

process.exit(await main());
