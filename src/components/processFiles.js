let values;

function calculateMetrics(bench) {
   const benchmarkTime = bench.benchmark_time;
   const frameCount = bench.frame_count;

   const sortedFrameTimes = [...bench.vanilla_frame_times].sort(
      (a, b) => b - a
   );

   const avg = 1000 / (benchmarkTime / frameCount);

   const data = {
      Max: 1000 / sortedFrameTimes[frameCount - 1],
      Avg: avg,
      Min: 1000 / sortedFrameTimes[0],
      STDEV: Math.sqrt(
         bench.vanilla_fps.reduce(
            (previous, current) => previous + (current - avg) ** 2,
            0
         ) /
            (frameCount - 1)
      ),
      percentiles: {},
      lows: {}
   };

   for (const percentile of values) {
      data.percentiles[percentile] =
         1000 /
         sortedFrameTimes[Math.ceil((percentile / 100) * frameCount) - 1];
   }

   for (const low of values) {
      const wall = (low / 100) * benchmarkTime;
      let currentTotal = 0;

      for (const present of sortedFrameTimes) {
         currentTotal += present;
         if (currentTotal >= wall) {
            data.lows[low] = 1000 / present;
            break;
         }
      }
   }

   const segmentation = {
      "<0.5ms": 0,
      "<1ms": 0,
      "<2ms": 0,
      "<4ms": 0,
      "<8ms": 0,
      "<16ms": 0,
      ">16ms": 0
   };

   for (const present of sortedFrameTimes) {
      if (present < 0.5) {
         segmentation["<0.5ms"]++;
      } else if (present < 1) {
         segmentation["<1ms"]++;
      } else if (present < 2) {
         segmentation["<2ms"]++;
      } else if (present < 4) {
         segmentation["<4ms"]++;
      } else if (present < 8) {
         segmentation["<8ms"]++;
      } else if (present < 16) {
         segmentation["<16ms"]++;
      } else if (present > 16) {
         segmentation[">16ms"]++;
      }
   }

   bench.sorted_frame_times = sortedFrameTimes;
   bench.segmentation = segmentation;
   bench.data = data;
   return bench;
}

const cfxPresentModes = {
   1: "Hardware: Legacy Flip",
   2: "Hardware: Legacy Copy to front buffer",
   3: "Hardware: Independent Flip",
   4: "Composed: Flip",
   5: "Hardware Composed: Independent Flip",
   6: "Composed: Copy with GPU GDI",
   7: "Composed: Copy with CPU GDI",
   8: "Composed: Composition Atlas"
};

function processCfxJson(fileName, data) {
   let vanillaFrameTimes = [];
   const vanillaFps = [];
   const frameTimes = [];
   const fps = [];

   const runtimes = new Set();
   let presentModes = [];
   let syncIntervals = [];

   let dropped = [];
   let allowsTearing = [];
   let dwmNotified = [];
   let wasBatched = [];

   for (const run of data["Runs"]) {
      vanillaFrameTimes = vanillaFrameTimes.concat(
         run["CaptureData"]["MsBetweenPresents"]
      );

      runtimes.add(run["PresentMonRuntime"]);

      if (run["CaptureData"]["Dropped"]) {
         dropped = dropped.concat(run["CaptureData"]["Dropped"]);
      }
      if (run["CaptureData"]["AllowsTearing"]) {
         allowsTearing = allowsTearing.concat(
            run["CaptureData"]["AllowsTearing"]
         );
      }
      if (run["CaptureData"]["DwmNotified"]) {
         dwmNotified = dwmNotified.concat(run["CaptureData"]["DwmNotified"]);
      }
      if (run["CaptureData"]["WasBatched"]) {
         wasBatched = wasBatched.concat(run["CaptureData"]["WasBatched"]);
      }
      if (run["CaptureData"]["PresentMode"]) {
         presentModes = presentModes.concat(run["CaptureData"]["PresentMode"]);
      }
      if (run["CaptureData"]["SyncInterval"]) {
         syncIntervals = syncIntervals.concat(
            run["CaptureData"]["SyncInterval"]
         );
      }
   }

   let benchmarkTime = 0;

   for (const present of vanillaFrameTimes) {
      const fpsUnit = 1000 / present;
      benchmarkTime += present;

      vanillaFps.push(fpsUnit);
      frameTimes.push({ x: benchmarkTime, y: present });
      fps.push({ x: benchmarkTime, y: fpsUnit });
   }

   const returnObject = {
      file_name: fileName,
      comment: data["Info"]["Comment"],
      vanilla_frame_times: vanillaFrameTimes,
      vanilla_fps: vanillaFps,
      frame_times: frameTimes,
      fps: fps,
      benchmark_time: benchmarkTime,
      frame_count: frameTimes.length,
      applications: data["Info"]["ProcessName"],
      runtimes: [...runtimes].join(", "),
      present_modes: [...new Set(presentModes)]
         .map((pMode) => cfxPresentModes[pMode])
         .join(", "),
      sync_intervals: [...new Set(syncIntervals)].join(", ")
   };

   if (dropped.length !== 0) {
      returnObject.dropped = dropped.filter((frame) => frame === true).length;
   }
   if (allowsTearing.length !== 0) {
      returnObject.allows_tearing = allowsTearing.filter(
         (frame) => frame === 1
      ).length;
   }
   if (dwmNotified.length !== 0) {
      returnObject.dwm_notified = dwmNotified.filter(
         (frame) => frame === 1
      ).length;
   }
   if (wasBatched.length !== 0) {
      returnObject.was_batched = wasBatched.filter(
         (frame) => frame === 1
      ).length;
   }

   return returnObject;
}

function processCsv(
   fileName,
   data,
   infoRow,
   comment,
   presentIndicator,
   transformFunction
) {
   const vanillaFrameTimes = [];
   const vanillaFps = [];
   const frameTimes = [];
   const fps = [];

   const applications = new Set();
   const runtimes = new Set();
   const presentModes = new Set();
   const syncIntervals = new Set();

   const presentIndex = infoRow.indexOf(presentIndicator);
   const droppedIndex = infoRow.indexOf("dropped");
   const allowsTearingIndex = infoRow.indexOf("allowstearing");
   const dwmNotifiedIndex = infoRow.indexOf("dwmnotified");
   const wasBatchedIndex = infoRow.indexOf("wasbatched");
   const applicationIndex = infoRow.indexOf("application");
   const runtimeIndex = infoRow.indexOf("runtime");
   const presentModeIndex = infoRow.indexOf("presentmode");
   const syncIntervalIndex = infoRow.indexOf("syncinterval");

   let dropped, allowsTearing, dwmNotified, wasBatched;

   if (droppedIndex !== -1) {
      dropped = 0;
   }
   if (allowsTearingIndex !== -1) {
      allowsTearing = 0;
   }
   if (dwmNotifiedIndex !== -1) {
      dwmNotified = 0;
   }
   if (wasBatchedIndex !== -1) {
      wasBatched = 0;
   }

   let benchmarkTime = 0;

   for (const row of data) {
      const splitRow = row.split(",");
      const present = transformFunction(parseFloat(splitRow[presentIndex]));

      if (!isNaN(present)) {
         const fpsUnit = 1000 / present;
         benchmarkTime += present;

         vanillaFrameTimes.push(present);
         vanillaFps.push(fpsUnit);
         frameTimes.push({ x: benchmarkTime, y: present });
         fps.push({ x: benchmarkTime, y: fpsUnit });

         applications.add(splitRow[applicationIndex]);
         runtimes.add(splitRow[runtimeIndex]);
         presentModes.add(splitRow[presentModeIndex]);
         syncIntervals.add(splitRow[syncIntervalIndex]);

         if (parseInt(splitRow[droppedIndex]) === 1) {
            dropped++;
         }
         if (parseInt(splitRow[allowsTearingIndex]) === 1) {
            allowsTearing++;
         }
         if (parseInt(splitRow[dwmNotifiedIndex]) === 1) {
            dwmNotified++;
         }
         if (parseInt(splitRow[wasBatchedIndex]) === 1) {
            wasBatched++;
         }
      }
   }

   return {
      file_name: fileName,
      comment: comment,
      vanilla_frame_times: vanillaFrameTimes,
      vanilla_fps: vanillaFps,
      frame_times: frameTimes,
      fps: fps,
      benchmark_time: benchmarkTime,
      frame_count: frameTimes.length,
      dropped: dropped,
      allows_tearing: allowsTearing,
      dwm_notified: dwmNotified,
      was_batched: wasBatched,
      applications: [...applications].join(", "),
      runtimes: [...runtimes].join(", "),
      present_modes: [...presentModes].join(", "),
      sync_intervals: [...syncIntervals].join(", ")
   };
}

export default async function processFiles(
   ev,
   benches,
   setBenches,
   passedValues
) {
   values = passedValues;
   const newBenches = [];

   for (const file of ev.target.files) {
      if (benches.benches.length >= 12) {
         break;
      }

      const fileName = file.name;

      if (fileName.endsWith(".csv")) {
         const splitFile = (await file.text()).replaceAll("\r", "").split("\n");
         let comment;

         for (const [index, row] of splitFile.entries()) {
            if (row.includes("//Comment=")) {
               comment = row.replace("//Comment=", "");
            }

            const splitRow = row.toLowerCase().split(",");
            if (splitRow.includes("msbetweenpresents")) {
               newBenches.push(
                  calculateMetrics(
                     processCsv(
                        fileName,
                        splitFile.slice(index + 1),
                        splitRow,
                        comment,
                        "msbetweenpresents",
                        (value) => value
                     )
                  )
               );
               break;
            } else if (splitRow.includes("cpuscheduler")) {
               newBenches.push(
                  calculateMetrics(
                     processCsv(
                        fileName,
                        splitFile.slice(index + 3),
                        splitFile[index + 2].toLowerCase().split(","),
                        comment,
                        "frametime",
                        (value) => value / 1000
                     )
                  )
               );
               break;
            } else if (splitRow.includes("99(%) fps")) {
               newBenches.push(
                  calculateMetrics(
                     processCsv(
                        fileName,
                        splitFile.slice(index + 1),
                        splitRow,
                        comment,
                        "fps",
                        (value) => 1000 / value
                     )
                  )
               );
               break;
            }
         }
      } else if (fileName.endsWith(".json")) {
         newBenches.push(
            calculateMetrics(
               processCfxJson(fileName, JSON.parse(await file.text()))
            )
         );
      }
   }

   ev.target.value = "";

   const extremes = {
      max_benchmark_time:
         benches.extremes.max_benchmark_time ?? newBenches[0].benchmark_time,
      min_fps: benches.extremes.min_fps ?? newBenches[0].data.Min,
      max_fps: benches.extremes.max_fps ?? newBenches[0].data.Max,
      min_ms:
         benches.extremes.min_ms ??
         newBenches[0].sorted_frame_times[newBenches[0].frame_count - 1],
      max_ms: benches.extremes.max_ms ?? newBenches[0].sorted_frame_times[0],
      min_percentile:
         benches.extremes.min_percentile ??
         newBenches[0].data.percentiles[values[values.length - 1]],
      max_percentile:
         benches.extremes.max_percentile ??
         newBenches[0].data.percentiles[values[0]],
      min_low:
         benches.extremes.min_low ??
         newBenches[0].data.lows[values[values.length - 1]],
      max_low: benches.extremes.max_low ?? newBenches[0].data.lows[values[0]]
   };

   for (const bench of newBenches) {
      if (bench.benchmark_time > extremes.max_benchmark_time) {
         extremes.max_benchmark_time = bench.benchmark_time;
      }

      if (bench.data.Min < extremes.min_fps) {
         extremes.min_fps = bench.data.Min;
      }

      if (bench.data.Max > extremes.max_fps) {
         extremes.max_fps = bench.data.Max;
      }

      if (bench.sorted_frame_times[bench.frame_count - 1] < extremes.min_ms) {
         extremes.min_ms = bench.sorted_frame_times[bench.frame_count - 1];
      }

      if (bench.sorted_frame_times[0] > extremes.max_ms) {
         extremes.max_ms = bench.sorted_frame_times[0];
      }

      if (
         bench.data.percentiles[values[values.length - 1]] <
         extremes.min_percentile
      ) {
         extremes.min_percentile =
            bench.data.percentiles[values[values.length - 1]];
      }

      if (bench.data.percentiles[values[0]] > extremes.max_percentile) {
         extremes.max_percentile = bench.data.percentiles[values[0]];
      }

      if (bench.data.lows[values[values.length - 1]] < extremes.min_low) {
         extremes.min_low = bench.data.lows[values[values.length - 1]];
      }

      if (bench.data.lows[values[0]] > extremes.max_low) {
         extremes.max_low = bench.data.lows[values[0]];
      }
   }

   extremes.max_benchmark_time = Math.ceil(extremes.max_benchmark_time);
   extremes.min_fps = Math.floor(extremes.min_fps);
   extremes.max_fps = Math.ceil(extremes.max_fps);
   extremes.min_ms = Math.floor(extremes.min_ms * 10) / 10;
   extremes.max_ms = Math.ceil(extremes.max_ms * 10) / 10;
   extremes.min_percentile = Math.floor(extremes.min_percentile);
   extremes.max_percentile = Math.ceil(extremes.max_percentile);
   extremes.min_low = Math.floor(extremes.min_low);
   extremes.max_low = Math.ceil(extremes.max_low);

   setBenches((previousBenches) => {
      previousBenches.extremes = extremes;
      previousBenches.benches = [...previousBenches.benches, ...newBenches];
      return { ...previousBenches };
   });
}
