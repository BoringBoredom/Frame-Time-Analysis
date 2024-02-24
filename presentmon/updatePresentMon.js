import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

async function main() {
  try {
    const localVersion = readFileSync("./presentmon/version", {
      encoding: "utf-8",
    });

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
          /\/PresentMon-(\d+\.\d+\.\d+)-x64\.exe/
        );

        if (match) {
          const remoteVersion = match[1];

          if (localVersion !== remoteVersion) {
            console.log(
              `New PresentMon version found: ${localVersion} -> ${remoteVersion}`
            );

            execSync("mkdir -p ./temp/captures");
            execSync(
              `wget ${asset.browser_download_url} -O ./temp/presentmon.exe`
            );
            execSync(
              "7z a ./presentmon/presentmon.zip ./temp/presentmon.exe ./presentmon/Run.bat ./temp/captures"
            );

            writeFileSync("./presentmon/version", remoteVersion, {
              encoding: "utf-8",
            });
          } else {
            console.log("PresentMon is up-to-date.");
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
