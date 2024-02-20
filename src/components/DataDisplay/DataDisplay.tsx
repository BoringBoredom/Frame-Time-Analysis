import { Group, SimpleGrid, Stack, Table, Tooltip } from "@mantine/core";
import {
  percentileList,
  barMetrics,
  type initialChartTypes,
  type initialColors,
} from "../static";
import type { Data } from "../types";
import { IconAlertTriangleFilled } from "@tabler/icons-react";
import s from "./DataDisplay.module.css";
import { Scatter, Bar, Chart } from "react-chartjs-2";
import zoomPlugin from "chartjs-plugin-zoom";
import ChartDataLabels from "chartjs-plugin-datalabels";
import {
  BoxPlotController,
  BoxAndWiskers,
} from "@sgratzl/chartjs-chart-boxplot";
//import "chart.js/auto";
import {
  Chart as ChartJS,
  defaults,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Legend,
  Tooltip as ChartTooltip,
} from "chart.js";
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Legend,
  ChartTooltip,
  zoomPlugin,
  BoxPlotController,
  BoxAndWiskers
);

defaults.animation = false;
defaults.events = ["click"];
defaults.font.size = 18;
defaults.borderColor = "rgb(70,70,70)";
defaults.color = "rgb(255,255,255)";
defaults.normalized = true;

function PresentModes({ presentModes }: { presentModes: string | undefined }) {
  if (
    presentModes &&
    (presentModes.includes(": Flip") ||
      presentModes.includes(": Legacy Copy") ||
      presentModes.includes(": Copy") ||
      presentModes.includes(": Composition"))
  ) {
    return (
      <Tooltip label="inefficient Presentation Mode">
        <Table.Td>
          <Group gap="xs" wrap="nowrap">
            <div>{presentModes}</div>
            <IconAlertTriangleFilled />
          </Group>
        </Table.Td>
      </Tooltip>
    );
  }

  return <Table.Td>{presentModes}</Table.Td>;
}

function Info({ data, colors }: { data: Data; colors: typeof initialColors }) {
  return (
    <Table>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Name</Table.Th>
          <Table.Th>Application</Table.Th>
          <Table.Th>API</Table.Th>
          <Table.Th>Presentation Mode</Table.Th>
          <Table.Th>Duration (ms)</Table.Th>
          <Table.Th>Sync Interval</Table.Th>
          <Table.Th>Total Frames</Table.Th>
          <Table.Th>AllowsTearing=0 Frames</Table.Th>
          <Table.Th>Dropped Frames</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {data.benches.map((bench, index) => (
          <Table.Tr
            key={
              bench.name +
              bench.fps.metrics.avg +
              bench.fps.metrics.stdev +
              bench.fps.metrics.min +
              bench.fps.metrics.max
            }
            className={s.text}
            style={{ backgroundColor: colors[index] }}
          >
            <Table.Td>{bench.name}</Table.Td>
            <Table.Td>{bench.applications}</Table.Td>
            <Table.Td>{bench.runtimes}</Table.Td>
            <PresentModes presentModes={bench.presentModes} />
            <Table.Td>{bench.duration.toFixed(2)}</Table.Td>
            <Table.Td>{bench.syncIntervals}</Table.Td>
            <Table.Td>{bench.frames}</Table.Td>
            <Table.Td>
              {bench.allowsTearing !== undefined
                ? bench.frames - bench.allowsTearing
                : undefined}
            </Table.Td>
            <Table.Td>
              <Group gap="xs" wrap="nowrap">
                <div>{bench.dropped}</div>
                {bench.dropped && <IconAlertTriangleFilled />}
              </Group>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}

function LineMs({
  data,
  colors,
}: {
  data: Data;
  colors: typeof initialColors;
}) {
  return (
    <div>
      <Scatter
        datasetIdKey="datasetIdKey"
        data={{
          datasets: data.benches.map((bench, index) => ({
            datasetIdKey:
              bench.name +
              bench.fps.metrics.avg +
              bench.fps.metrics.stdev +
              bench.fps.metrics.min +
              bench.fps.metrics.max,
            label: bench.name,
            data: bench.ms.chartFormat,
            backgroundColor: colors[index],
            borderColor: colors[index],
          })),
        }}
        options={{
          parsing: false,
          spanGaps: true,
          showLine: true,
          scales: {
            x: {
              grid: {
                display: false,
              },
              title: {
                display: true,
                text: "Duration (ms)",
              },
              min: data.extremes.duration.min,
              max: data.extremes.duration.max,
            },
            y: {
              title: {
                display: true,
                text: "ms",
              },
              min: data.extremes.ms.min,
              max: data.extremes.ms.max,
            },
          },
          elements: {
            point: {
              radius: 0,
            },
          },
          plugins: {
            zoom: {
              pan: {
                enabled: true,
                mode: "x",
              },
              zoom: {
                wheel: {
                  enabled: true,
                  modifierKey: "ctrl",
                },
                mode: "x",
              },
              limits: {
                x: {
                  min: "original",
                  max: "original",
                },
              },
            },
          },
        }}
      />
    </div>
  );
}

function LineFps({
  data,
  colors,
}: {
  data: Data;
  colors: typeof initialColors;
}) {
  return (
    <div>
      <Scatter
        datasetIdKey="datasetIdKey"
        data={{
          datasets: data.benches.map((bench, index) => ({
            datasetIdKey:
              bench.name +
              bench.fps.metrics.avg +
              bench.fps.metrics.stdev +
              bench.fps.metrics.min +
              bench.fps.metrics.max,
            label: bench.name,
            data: bench.fps.chartFormat,
            backgroundColor: colors[index],
            borderColor: colors[index],
          })),
        }}
        options={{
          parsing: false,
          spanGaps: true,
          showLine: true,
          scales: {
            x: {
              grid: {
                display: false,
              },
              title: {
                display: true,
                text: "Duration (ms)",
              },
              min: data.extremes.duration.min,
              max: data.extremes.duration.max,
            },
            y: {
              title: {
                display: true,
                text: "FPS",
              },
              min: data.extremes.fps.min,
              max: data.extremes.fps.max,
            },
          },
          elements: {
            point: {
              radius: 0,
            },
          },
          plugins: {
            zoom: {
              pan: {
                enabled: true,
                mode: "x",
              },
              zoom: {
                wheel: {
                  enabled: true,
                  modifierKey: "ctrl",
                },
                mode: "x",
              },
              limits: {
                x: {
                  min: "original",
                  max: "original",
                },
              },
            },
          },
        }}
      />
    </div>
  );
}

function ScatterMs({
  data,
  colors,
}: {
  data: Data;
  colors: typeof initialColors;
}) {
  return (
    <div>
      <Scatter
        datasetIdKey="datasetIdKey"
        data={{
          datasets: data.benches.map((bench, index) => ({
            datasetIdKey:
              bench.name +
              bench.fps.metrics.avg +
              bench.fps.metrics.stdev +
              bench.fps.metrics.min +
              bench.fps.metrics.max,
            label: bench.name,
            data: bench.ms.chartFormat,
            backgroundColor: colors[index],
            borderColor: colors[index],
          })),
        }}
        options={{
          parsing: false,
          spanGaps: true,
          scales: {
            x: {
              grid: {
                display: false,
              },
              title: {
                display: true,
                text: "Duration (ms)",
              },
              min: data.extremes.duration.min,
              max: data.extremes.duration.max,
            },
            y: {
              title: {
                display: true,
                text: "ms",
              },
              min: data.extremes.ms.min,
              max: data.extremes.ms.max,
            },
          },
          plugins: {
            zoom: {
              pan: {
                enabled: true,
                mode: "x",
              },
              zoom: {
                wheel: {
                  enabled: true,
                  modifierKey: "ctrl",
                },
                mode: "x",
              },
              limits: {
                x: {
                  min: "original",
                  max: "original",
                },
              },
            },
          },
        }}
      />
    </div>
  );
}

function ScatterFps({
  data,
  colors,
}: {
  data: Data;
  colors: typeof initialColors;
}) {
  return (
    <div>
      <Scatter
        datasetIdKey="datasetIdKey"
        data={{
          datasets: data.benches.map((bench, index) => ({
            datasetIdKey:
              bench.name +
              bench.fps.metrics.avg +
              bench.fps.metrics.stdev +
              bench.fps.metrics.min +
              bench.fps.metrics.max,
            label: bench.name,
            data: bench.fps.chartFormat,
            backgroundColor: colors[index],
            borderColor: colors[index],
          })),
        }}
        options={{
          parsing: false,
          spanGaps: true,
          scales: {
            x: {
              grid: {
                display: false,
              },
              title: {
                display: true,
                text: "Duration (ms)",
              },
              min: data.extremes.duration.min,
              max: data.extremes.duration.max,
            },
            y: {
              title: {
                display: true,
                text: "FPS",
              },
              min: data.extremes.fps.min,
              max: data.extremes.fps.max,
            },
          },
          plugins: {
            zoom: {
              pan: {
                enabled: true,
                mode: "x",
              },
              zoom: {
                wheel: {
                  enabled: true,
                  modifierKey: "ctrl",
                },
                mode: "x",
              },
              limits: {
                x: {
                  min: "original",
                  max: "original",
                },
              },
            },
          },
        }}
      />
    </div>
  );
}

function PercentilesFps({
  data,
  colors,
}: {
  data: Data;
  colors: typeof initialColors;
}) {
  return (
    <div>
      <Scatter
        datasetIdKey="datasetIdKey"
        data={{
          datasets: data.benches.map((bench, index) => ({
            datasetIdKey:
              bench.name +
              bench.fps.metrics.avg +
              bench.fps.metrics.stdev +
              bench.fps.metrics.min +
              bench.fps.metrics.max,
            label: bench.name,
            data: percentileList.map((percentile) => ({
              x: percentile,
              y: bench.fps.metrics.percentiles[percentile],
            })),
            backgroundColor: colors[index],
            borderColor: colors[index],
          })),
        }}
        options={{
          parsing: false,
          spanGaps: true,
          showLine: true,
          scales: {
            x: {
              title: {
                display: true,
                text: "Percentile",
              },
              min: percentileList[0],
              max: percentileList[percentileList.length - 1],
            },
            y: {
              title: {
                display: true,
                text: "FPS",
              },
            },
          },
          elements: {
            point: {
              radius: 0,
            },
          },
          plugins: {
            zoom: {
              pan: {
                enabled: true,
                mode: "x",
              },
              zoom: {
                wheel: {
                  enabled: true,
                  modifierKey: "ctrl",
                },
                mode: "x",
              },
              limits: {
                x: {
                  min: "original",
                  max: "original",
                },
              },
            },
          },
        }}
      />
    </div>
  );
}

function LowsFps({
  data,
  colors,
}: {
  data: Data;
  colors: typeof initialColors;
}) {
  return (
    <div>
      <Scatter
        datasetIdKey="datasetIdKey"
        data={{
          datasets: data.benches.map((bench, index) => ({
            datasetIdKey:
              bench.name +
              bench.fps.metrics.avg +
              bench.fps.metrics.stdev +
              bench.fps.metrics.min +
              bench.fps.metrics.max,
            label: bench.name,
            data: percentileList.map((percentile) => ({
              x: percentile,
              y: bench.fps.metrics.lows[percentile],
            })),
            backgroundColor: colors[index],
            borderColor: colors[index],
          })),
        }}
        options={{
          parsing: false,
          spanGaps: true,
          showLine: true,
          scales: {
            x: {
              title: {
                display: true,
                text: "% Low",
              },
              min: percentileList[0],
              max: percentileList[percentileList.length - 1],
            },
            y: {
              title: {
                display: true,
                text: "FPS",
              },
            },
          },
          elements: {
            point: {
              radius: 0,
            },
          },
          plugins: {
            zoom: {
              pan: {
                enabled: true,
                mode: "x",
              },
              zoom: {
                wheel: {
                  enabled: true,
                  modifierKey: "ctrl",
                },
                mode: "x",
              },
              limits: {
                x: {
                  min: "original",
                  max: "original",
                },
              },
            },
          },
        }}
      />
    </div>
  );
}

function BoxFps({
  data,
  colors,
}: {
  data: Data;
  colors: typeof initialColors;
}) {
  return (
    <div>
      <Chart
        type="boxplot"
        datasetIdKey="datasetIdKey"
        data={{
          labels: [
            [
              "Min",
              "0.1 %ile",
              "1 %ile",
              "-STDEV",
              "Avg",
              "+STDEV",
              "99 %ile",
              "99.9 %ile",
              "Max",
            ],
          ],
          datasets: data.benches.map((bench, index) => ({
            datasetIdKey:
              bench.name +
              bench.fps.metrics.avg +
              bench.fps.metrics.stdev +
              bench.fps.metrics.min +
              bench.fps.metrics.max,
            label: bench.name,
            data: [
              {
                min: bench.fps.metrics.min,
                q1: bench.fps.metrics.avg - bench.fps.metrics.stdev,
                median: bench.fps.metrics.avg,
                q3: bench.fps.metrics.avg + bench.fps.metrics.stdev,
                max: bench.fps.metrics.max,
                outliers: [
                  bench.fps.metrics.percentiles[0.1],
                  bench.fps.metrics.percentiles[1],
                  bench.fps.metrics.percentiles[99],
                  bench.fps.metrics.percentiles[99.9],
                ],
              },
            ],
            backgroundColor: colors[index],
            borderColor: colors[index],
            borderWidth: 3,
            medianColor: "rgb(150,150,150)",
            outlierBackgroundColor: colors[index],
            outlierBorderColor: colors[index],
            outlierRadius: 4,
          })),
        }}
        options={{
          indexAxis: "y",
          events: [],
          coef: 0,
          scales: {
            x: {
              title: {
                display: true,
                text: "FPS (Min | 0.1 %ile | 1 %ile | -STDEV | Avg | +STDEV | 99 %ile | 99.9 %ile | Max)",
              },
              min: data.extremes.fps.min,
              max: data.extremes.fps.max,
            },
            y: { ticks: { display: false } },
          },
        }}
      />
    </div>
  );
}

function BarFps({
  data,
  colors,
}: {
  data: Data;
  colors: typeof initialColors;
}) {
  return (
    <div style={{ minHeight: `${16 + data.benches.length * 35}vh` }}>
      <Bar
        datasetIdKey="datasetIdKey"
        plugins={[ChartDataLabels]}
        data={{
          labels: data.benches.map((bench) => bench.name.match(/.{1,8}/g)),
          datasets: barMetrics.map((metric) => ({
            datasetIdKey: metric.name,
            label: metric.name,
            data: data.benches.map((bench) => {
              if (metric.name.includes("%ile")) {
                return bench.fps.metrics.percentiles[
                  parseFloat(metric.name.split(" ")[0])
                ].toFixed(2);
              }

              if (metric.name.includes("% low")) {
                return bench.fps.metrics.lows[
                  parseFloat(metric.name.split(" ")[0])
                ].toFixed(2);
              }

              return bench.fps.metrics[
                metric.name.toLowerCase() as keyof Omit<
                  typeof bench.fps.metrics,
                  "percentiles" | "lows"
                >
              ].toFixed(2);
            }),
            backgroundColor: metric.color,
          })),
        }}
        options={{
          indexAxis: "y",
          maintainAspectRatio: false,
          scales: {
            x: {
              min: 0,
              title: {
                display: true,
                text: "FPS",
              },
            },
            y: {
              grid: {
                display: false,
              },
              ticks: {
                color: colors,
              },
            },
          },
          plugins: {
            datalabels: {
              anchor: "start",
              clamp: true,
              align: "end",
              font: {
                weight: 700,
              },
              color: "rgb(255,255,255)",
            },
          },
        }}
      />
    </div>
  );
}

export default function DataDisplay({
  data,
  colors,
  chartTypes,
  chartsPerRow,
}: {
  data: Data;
  colors: typeof initialColors;
  chartTypes: typeof initialChartTypes;
  chartsPerRow: number;
}) {
  return (
    <Stack>
      {chartTypes[0].show && <Info data={data} colors={colors} />}
      <SimpleGrid cols={chartsPerRow}>
        {chartTypes[1].show && <LineMs data={data} colors={colors} />}
        {chartTypes[2].show && <LineFps data={data} colors={colors} />}
        {chartTypes[3].show && <ScatterMs data={data} colors={colors} />}
        {chartTypes[4].show && <ScatterFps data={data} colors={colors} />}
        {chartTypes[5].show && <PercentilesFps data={data} colors={colors} />}
        {chartTypes[6].show && <LowsFps data={data} colors={colors} />}
        {chartTypes[7].show && <BoxFps data={data} colors={colors} />}
        {chartTypes[8].show && <BarFps data={data} colors={colors} />}
      </SimpleGrid>
    </Stack>
  );
}
