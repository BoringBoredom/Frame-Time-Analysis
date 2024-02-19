async function main() {
  try {
    const response = await fetch(
      "https://api.github.com/repos/GameTechDev/PresentMon/releases"
    );

    if (!response.ok) {
      throw new Error();
    }

    const releases = await response.json();

    for (const release of releases) {
      for (const asset of release.assets) {
        if (
          asset.browser_download_url.match(/\/PresentMon-\d\.\d\.\d-x64\.exe/)
        ) {
          console.log(`PRESENTMON_URL=${asset.browser_download_url}`);
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
