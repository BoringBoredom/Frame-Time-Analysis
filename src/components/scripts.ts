/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Bench, Data, Ms, Fps, Cfx } from "./types";
import { percentileList, type sortOptions, type initialColors } from "./static";

let benchIndex = 0;

function calculateMetrics(
  ms: Pick<Ms, "unsorted" | "chartFormat">,
  fps: Pick<Fps, "unsorted" | "chartFormat">,
  duration: number,
  frames: number
) {
  const sortedMs = [...ms.unsorted].sort((a, b) => b - a);
  const avg = 1000 / (duration / frames);

  const percentiles: Record<number, number> = {};
  for (const percentile of percentileList) {
    percentiles[percentile] =
      1000 / sortedMs[Math.ceil((percentile / 100) * frames) - 1];
  }
  percentiles[99] = 1000 / sortedMs[Math.ceil((99 / 100) * frames) - 1];
  percentiles[99.9] = 1000 / sortedMs[Math.ceil((99.9 / 100) * frames) - 1];

  const lows: Record<number, number> = {};
  for (const low of percentileList) {
    const wall = (low / 100) * duration;
    let currentTotal = 0;

    for (const frameTime of sortedMs) {
      currentTotal += frameTime;
      if (currentTotal >= wall) {
        lows[low] = 1000 / frameTime;
        break;
      }
    }
  }

  const metrics = {
    min: 1000 / sortedMs[0],
    avg,
    max: 1000 / sortedMs[frames - 1],
    stdev: Math.sqrt(
      fps.unsorted.reduce(
        (previous, current) => previous + (current - avg) ** 2,
        0
      ) /
        (frames - 1)
    ),
    percentiles,
    lows,
  };

  return {
    ms: {
      unsorted: ms.unsorted,
      sorted: sortedMs,
      chartFormat: ms.chartFormat,
    },
    fps: {
      metrics,
      unsorted: fps.unsorted,
      chartFormat: fps.chartFormat,
    },
  };
}

function processCfxJson(
  name: string,
  bench: Cfx,
  colors: typeof initialColors,
  colorRepeat: number
): Bench {
  let unsortedMs: number[] = [];
  const chartFormatMs: { x: number; y: number }[] = [];
  const unsortedFps: number[] = [];
  const chartFormatFps: { x: number; y: number }[] = [];

  const runtimes = new Set<string>();
  let presentModes: number[] = [];
  let syncIntervals: number[] = [];
  let dropped: boolean[] = [];
  let allowsTearing: number[] = [];

  for (const run of bench.Runs) {
    unsortedMs = unsortedMs.concat(run.CaptureData.MsBetweenPresents);

    runtimes.add(run.PresentMonRuntime);

    if (run.CaptureData.Dropped) {
      dropped = dropped.concat(run.CaptureData.Dropped);
    }
    if (run.CaptureData.AllowsTearing) {
      allowsTearing = allowsTearing.concat(run.CaptureData.AllowsTearing);
    }
    if (run.CaptureData.PresentMode) {
      presentModes = presentModes.concat(run.CaptureData.PresentMode);
    }
    if (run.CaptureData.SyncInterval) {
      syncIntervals = syncIntervals.concat(run.CaptureData.SyncInterval);
    }
  }

  let duration = 0;

  for (const frameTime of unsortedMs) {
    const fpsUnit = 1000 / frameTime;
    duration += frameTime;

    chartFormatMs.push({ x: duration, y: frameTime });
    unsortedFps.push(fpsUnit);
    chartFormatFps.push({ x: duration, y: fpsUnit });
  }

  return {
    name,
    uploaded: Date.now().toString(),
    color: colors[Math.floor(benchIndex++ / (colorRepeat + 1))],
    duration,
    frames: unsortedMs.length,
    ...(dropped.length !== 0 && {
      dropped: dropped.filter((frame) => frame).length,
    }),
    ...(allowsTearing.length !== 0 && {
      allowsTearing: allowsTearing.filter((frame) => frame).length,
    }),
    applications: bench.Info.ProcessName,
    runtimes: [...runtimes].join(", "),
    presentModes: [...new Set(presentModes)]
      .map(
        (presentMode) =>
          ({
            0: "Unknown",
            1: "Hardware: Legacy Flip",
            2: "Hardware: Legacy Copy to front buffer",
            3: "Hardware: Independent Flip",
            4: "Composed: Flip",
            5: "Composed: Copy with GPU GDI",
            6: "Composed: Copy with CPU GDI",
            7: "Composed: Composition Atlas",
            8: "Hardware Composed: Independent Flip",
            9: "Other",
          }[presentMode])
      )
      .join(", "),
    syncIntervals: [...new Set(syncIntervals)].join(", "),
    ...calculateMetrics(
      { unsorted: unsortedMs, chartFormat: chartFormatMs },
      { unsorted: unsortedFps, chartFormat: chartFormatFps },
      duration,
      unsortedMs.length
    ),
  };
}

function processCsv(
  name: string,
  lines: string[],
  lowerCaseSplitRow: string[],
  indicator: "msbetweenpresents" | "frametime" | "fps" | "cpubusy",
  transformFunc: (arg0: number) => number,
  colors: typeof initialColors,
  colorRepeat: number
): Bench {
  const unsortedMs: number[] = [];
  const chartFormatMs: { x: number; y: number }[] = [];
  const unsortedFps: number[] = [];
  const chartFormatFps: { x: number; y: number }[] = [];

  const frameTimeIndex = lowerCaseSplitRow.indexOf(indicator);
  const cpuBusyIndex = lowerCaseSplitRow.indexOf("cpubusy");
  const cpuWaitIndex = lowerCaseSplitRow.indexOf("cpuwait");
  const displayedTimeIndex = lowerCaseSplitRow.indexOf("displayedtime");
  const droppedIndex = lowerCaseSplitRow.indexOf("dropped");
  const allowsTearingIndex = lowerCaseSplitRow.indexOf("allowstearing");
  const dwmNotifiedIndex = lowerCaseSplitRow.indexOf("dwmnotified");
  const wasBatchedIndex = lowerCaseSplitRow.indexOf("wasbatched");
  const applicationIndex = lowerCaseSplitRow.indexOf("application");
  const runtimeIndex = lowerCaseSplitRow.indexOf("runtime");
  const presentModeIndex = lowerCaseSplitRow.indexOf("presentmode");
  const syncIntervalIndex = lowerCaseSplitRow.indexOf("syncinterval");

  const applications = new Set<string>();
  const runtimes = new Set<string>();
  const presentModes = new Set<string>();
  const syncIntervals = new Set<string>();

  let dropped = 0;
  let allowsTearing = 0;
  let dwmNotified = 0;
  let wasBatched = 0;

  let duration = 0;

  for (const line of lines) {
    const splitLine = line.trim().split(",");

    let frameTime;

    if (indicator === "cpubusy") {
      frameTime =
        parseFloat(splitLine[cpuBusyIndex]) +
        parseFloat(splitLine[cpuWaitIndex]);
    } else {
      frameTime = transformFunc(parseFloat(splitLine[frameTimeIndex]));
    }

    if (!Number.isNaN(frameTime)) {
      const fpsUnit = 1000 / frameTime;
      duration += frameTime;

      unsortedMs.push(frameTime);
      chartFormatMs.push({ x: duration, y: frameTime });
      unsortedFps.push(fpsUnit);
      chartFormatFps.push({ x: duration, y: fpsUnit });

      applications.add(splitLine[applicationIndex]);
      runtimes.add(splitLine[runtimeIndex]);
      presentModes.add(splitLine[presentModeIndex]);
      syncIntervals.add(splitLine[syncIntervalIndex]);

      if (
        parseInt(splitLine[droppedIndex], 10) === 1 ||
        splitLine[displayedTimeIndex] === "0.000000"
      ) {
        dropped += 1;
      }
      if (parseInt(splitLine[allowsTearingIndex], 10) === 1) {
        allowsTearing += 1;
      }
      if (parseInt(splitLine[dwmNotifiedIndex], 10) === 1) {
        dwmNotified += 1;
      }
      if (parseInt(splitLine[wasBatchedIndex], 10) === 1) {
        wasBatched += 1;
      }
    }
  }

  return {
    name,
    uploaded: Date.now().toString(),
    color: colors[Math.floor(benchIndex++ / (colorRepeat + 1))],
    duration,
    frames: unsortedMs.length,
    ...((droppedIndex !== -1 || displayedTimeIndex !== -1) && { dropped }),
    ...(allowsTearingIndex !== -1 && { allowsTearing }),
    ...(dwmNotified !== -1 && { dwmNotified }),
    ...(wasBatched !== -1 && { wasBatched }),
    applications: [...applications].join(", "),
    runtimes: [...runtimes].join(", "),
    presentModes: [...presentModes].join(", "),
    syncIntervals: [...syncIntervals].join(", "),
    ...calculateMetrics(
      { unsorted: unsortedMs, chartFormat: chartFormatMs },
      { unsorted: unsortedFps, chartFormat: chartFormatFps },
      duration,
      unsortedMs.length
    ),
  };
}

export async function handleUpload(
  files: File[],
  data: Data,
  setData: React.Dispatch<React.SetStateAction<Data>>,
  sortBy: (typeof sortOptions)[number],
  resetRef: React.RefObject<() => void>,
  colors: typeof initialColors,
  colorRepeat: number
) {
  const newBenches: Bench[] = [];

  for (const file of files) {
    if (data.benches.length + newBenches.length >= 14 * (colorRepeat + 1)) {
      break;
    }

    const { name } = file;

    if (name.endsWith(".csv")) {
      const benchName = name.slice(0, -4);
      const lines = (await file.text()).split("\n");

      for (const [index, row] of lines.entries()) {
        const lowerCaseSplitRow = row.toLowerCase().trim().split(",");

        if (lowerCaseSplitRow.includes("msbetweenpresents")) {
          newBenches.push(
            processCsv(
              benchName,
              lines.slice(index + 1),
              lowerCaseSplitRow,
              "msbetweenpresents",
              (value) => value,
              colors,
              colorRepeat
            )
          );

          break;
        }

        if (lowerCaseSplitRow.includes("cpubusy")) {
          newBenches.push(
            processCsv(
              benchName,
              lines.slice(index + 1),
              lowerCaseSplitRow,
              "cpubusy",
              (value) => value,
              colors,
              colorRepeat
            )
          );

          break;
        }

        if (lowerCaseSplitRow.includes("cpuscheduler")) {
          newBenches.push(
            processCsv(
              benchName,
              lines.slice(index + 3),
              lines[index + 2].toLowerCase().trim().split(","),
              "frametime",
              (value) => value,
              colors,
              colorRepeat
            )
          );

          break;
        }

        if (lowerCaseSplitRow.includes("99(%) fps")) {
          newBenches.push(
            processCsv(
              benchName,
              lines.slice(index + 1),
              lowerCaseSplitRow,
              "fps",
              (value) => 1000 / value,
              colors,
              colorRepeat
            )
          );

          break;
        }
      }
    } else if (name.endsWith(".json")) {
      newBenches.push(
        processCfxJson(
          name.slice(0, -5),
          JSON.parse(await file.text()) as Cfx,
          colors,
          colorRepeat
        )
      );
    }
  }

  const extremes = {
    duration: {
      min: data.extremes.duration.min,
      max: data.extremes.duration.max,
    },
    fps: { min: data.extremes.fps.min, max: data.extremes.fps.max },
    ms: { min: data.extremes.ms.min, max: data.extremes.ms.max },
  };

  for (const bench of newBenches) {
    extremes.duration.max = Math.max(extremes.duration.max, bench.duration);
    extremes.fps.min = Math.min(extremes.fps.min, bench.fps.metrics.min);
    extremes.fps.max = Math.max(extremes.fps.max, bench.fps.metrics.max);
    extremes.ms.min = Math.min(
      extremes.ms.min,
      bench.ms.sorted[bench.frames - 1]
    );
    extremes.ms.max = Math.max(extremes.ms.max, bench.ms.sorted[0]);
  }

  extremes.duration.max = Math.ceil(extremes.duration.max);
  extremes.fps.min = Math.floor(extremes.fps.min);
  extremes.fps.max = Math.ceil(extremes.fps.max);
  extremes.ms.min = Math.floor(extremes.ms.min * 10) / 10;
  extremes.ms.max = Math.ceil(extremes.ms.max * 10) / 10;

  setData((previousData) => {
    const newData = structuredClone(previousData);
    newData.extremes = extremes;

    const sortedBenches = newData.benches.concat(newBenches);

    if (sortBy === "Maximum FPS") {
      sortedBenches.sort((a, b) => b.fps.metrics.max - a.fps.metrics.max);
    } else if (sortBy === "Average FPS") {
      sortedBenches.sort((a, b) => b.fps.metrics.avg - a.fps.metrics.avg);
    } else if (sortBy.includes("%ile")) {
      const percentile = parseFloat(sortBy.split(" ")[0]);

      sortedBenches.sort(
        (a, b) =>
          b.fps.metrics.percentiles[percentile] -
          a.fps.metrics.percentiles[percentile]
      );
    } else if (sortBy.includes("% Low")) {
      const low = parseFloat(sortBy.split(" ")[0]);

      sortedBenches.sort(
        (a, b) => b.fps.metrics.lows[low] - a.fps.metrics.lows[low]
      );
    } else if (sortBy === "Minimum FPS") {
      sortedBenches.sort((a, b) => b.fps.metrics.min - a.fps.metrics.min);
    }

    newData.benches = sortedBenches;

    return newData;
  });

  resetRef.current?.();
}
