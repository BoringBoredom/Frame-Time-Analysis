import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import { styled } from "@mui/material/styles";
import MuiTooltip, { tooltipClasses } from "@mui/material/Tooltip";
import WarningIcon from "@mui/icons-material/Warning";
import Link from "@mui/material/Link";

import { useMemo } from "react";

import { Line, Scatter, Bar } from "react-chartjs-2";
// import 'chart.js/auto';
import {
  Chart as ChartJS,
  defaults,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Legend,
  Tooltip,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import zoomPlugin from "chartjs-plugin-zoom";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Legend,
  Tooltip,
  zoomPlugin
);

const mainMetrics = [
  { name: "Max", color: "rgb(0,80,0)" },
  { name: "Avg", color: "rgb(0,130,0)" },
  { name: "Min", color: "rgb(0,180,0)" },
  { name: "1 %ile", color: "rgb(0,0,80)" },
  { name: "0.1 %ile", color: "rgb(0,0,130)" },
  { name: "0.01 %ile", color: "rgb(0,0,180)" },
  { name: "0.005 %ile", color: "rgb(0,0,230)" },
  { name: "1 % low", color: "rgb(80,0,0)" },
  { name: "0.1 % low", color: "rgb(130,0,0)" },
  { name: "0.01 % low", color: "rgb(180,0,0)" },
  { name: "0.005 % low", color: "rgb(230,0,0)" },
  { name: "STDEV", color: "rgb(130,130,130)" },
];

const segmentationUnits = [
  { name: "<0.5ms", color: "rgb(0,100,0)" },
  { name: "<1ms", color: "rgb(0,128,0)" },
  { name: "<2ms", color: "rgb(50,205,50)" },
  { name: "<4ms", color: "rgb(154,205,50)" },
  { name: "<8ms", color: "rgb(255,255,0)" },
  { name: "<16ms", color: "rgb(255,165,0)" },
  { name: ">16ms", color: "rgb(255,0,0)" },
];

defaults.animation = false;
defaults.events = [];
defaults.font.size = 18;
defaults.borderColor = "rgb(70,70,70)";
defaults.color = "rgb(255,255,255)";
defaults.spanGaps = true;
defaults.normalized = true;

const CustomWidthTooltip = styled(({ className, ...props }) => (
  // eslint-disable-next-line react/jsx-props-no-spreading
  <MuiTooltip {...props} classes={{ popper: className }} />
))({ [`& .${tooltipClasses.tooltip}`]: { minWidth: "90vw" } });

function VSyncedFrames({ allowsTearing, frameCount }) {
  if (allowsTearing === undefined) {
    return "";
  }

  const vSyncedFrames = frameCount - allowsTearing;

  return vSyncedFrames !== 0 ? (
    <MuiTooltip
      title={<div className="tooltip">VSync heavily increases latency</div>}
    >
      <div>
        {vSyncedFrames}{" "}
        <span>
          <WarningIcon />
        </span>
      </div>
    </MuiTooltip>
  ) : (
    vSyncedFrames
  );
}

function Info({ benches, setBenches, colors }) {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <MuiTooltip
              title={
                <div className="tooltip">
                  Add //Comment=comment to the top of CSV files to add
                  persistent comments or press the Pen button to add temporary
                  comments
                </div>
              }
            >
              <TableCell>File Name and Comment</TableCell>
            </MuiTooltip>
            <TableCell>Application</TableCell>
            <TableCell>API</TableCell>
            <CustomWidthTooltip
              title={
                <div className="tooltip">
                  <table id="present-mode-table">
                    <tbody>
                      <tr>
                        <td>Hardware: Legacy Flip</td>
                        <td>
                          Indicates the app took ownership of the screen, and is
                          swapping the displayed surface every frame.
                        </td>
                      </tr>
                      <tr>
                        <td>Hardware: Legacy Copy to front buffer</td>
                        <td>
                          Indicates the app took ownership of the screen, and is
                          copying new contents to an already-on-screen surface
                          every frame.
                        </td>
                      </tr>
                      <tr>
                        <td>Hardware: Independent Flip</td>
                        <td>
                          Indicates the app does not have ownership of the
                          screen, but is still swapping the displayed surface
                          every frame.
                        </td>
                      </tr>
                      <tr>
                        <td>Composed: Flip</td>
                        <td>
                          Indicates the app is windowed, is using &quot;flip
                          model&quot; swapchains, and is sharing its surfaces
                          with DWM to be composed.
                        </td>
                      </tr>
                      <tr>
                        <td>Hardware Composed: Independent Flip</td>
                        <td>
                          Indicates the app is using &quot;flip model&quot;
                          swapchains, and has been granted a hardware overlay
                          plane.
                        </td>
                      </tr>
                      <tr>
                        <td>Composed: Copy with GPU GDI</td>
                        <td>
                          Indicates the app is windowed, and is copying contents
                          into a surface that&apos;s shared with GDI.
                        </td>
                      </tr>
                      <tr>
                        <td>Composed: Copy with CPU GDI</td>
                        <td>
                          Indicates the app is windowed, and is copying contents
                          into a dedicated DirectX window surface. GDI contents
                          are stored separately, and are composed together with
                          DX contents by the DWM.
                        </td>
                      </tr>
                      <tr>
                        <td>Composed: Composition Atlas</td>
                        <td>Indicates use of DirectComposition.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              }
            >
              <TableCell>Presentation Mode</TableCell>
            </CustomWidthTooltip>
            <TableCell>Duration (ms)</TableCell>
            <TableCell>Sync Interval</TableCell>
            <TableCell>Total Frames</TableCell>
            <TableCell>VSynced Frames</TableCell>
            <TableCell>Dropped Frames</TableCell>
            <MuiTooltip
              title={
                <div className="tooltip">
                  Frames submitted by the driver on a different thread than the
                  app
                </div>
              }
            >
              <TableCell>Batched Frames</TableCell>
            </MuiTooltip>
            <MuiTooltip
              title={
                <div className="tooltip">
                  Frames the desktop compositor was notified about
                </div>
              }
            >
              <TableCell>DWM Notified</TableCell>
            </MuiTooltip>
          </TableRow>
        </TableHead>
        <TableBody>
          {benches.benches.map((bench, index) => (
            <TableRow
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              sx={{
                "&:last-child td, &:last-child th": { border: 0 },
                ".MuiTableCell-root": {
                  backgroundColor: `rgba(${colors[index].r}, ${colors[index].g}, ${colors[index].b}, ${colors[index].a})`,
                  color: "black",
                  fontSize: "18px",
                  fontWeight: 700,
                },
              }}
            >
              <TableCell>
                <div style={{ marginBottom: "6px" }}>{bench.file_name}</div>
                <div style={{ display: "flex" }}>
                  <MuiTooltip
                    title={
                      <div className="tooltip">
                        Edit temporary comment (click anywhere else to confirm)
                      </div>
                    }
                  >
                    <IconButton
                      className="hide-for-export"
                      onClick={() =>
                        document.getElementById(`comment-${index}`).focus()
                      }
                      style={{ paddingLeft: 0 }}
                    >
                      <EditIcon style={{ color: "black" }} />
                    </IconButton>
                  </MuiTooltip>
                  <input
                    type="text"
                    id={`comment-${index}`}
                    defaultValue={bench.comment || ""}
                    onBlur={(ev) =>
                      setBenches((previousBenches) => {
                        const newBenches = structuredClone(previousBenches);
                        newBenches.benches[index].comment = ev.target.value;
                        return newBenches;
                      })
                    }
                    style={{
                      outline: "none",
                      border: "none",
                      margin: "0",
                      padding: "0",
                      background: "transparent",
                      fontSize: "18px",
                      fontWeight: 700,
                    }}
                  />
                </div>
              </TableCell>
              <TableCell>{bench.applications}</TableCell>
              <TableCell>{bench.runtimes}</TableCell>
              <TableCell>
                {bench.present_modes.includes("Composed: Composition Atlas") ? (
                  <MuiTooltip
                    title={
                      <div className="tooltip">
                        <Link
                          href="https://github.com/GameTechDev/PresentMon/commit/65904264e57b8c635f1adb2d9dadfca9815400cc"
                          target="_blank"
                        >
                          Invalid results: Composition Atlas is composing
                          various windows together and is not processed
                          correctly.
                        </Link>
                      </div>
                    }
                  >
                    <div>
                      {bench.present_modes}{" "}
                      <span>
                        <WarningIcon />
                      </span>
                    </div>
                  </MuiTooltip>
                ) : (
                  bench.present_modes
                )}
              </TableCell>
              <TableCell>{bench.benchmark_time.toFixed(2)}</TableCell>
              <TableCell>{bench.sync_intervals}</TableCell>
              <TableCell>{bench.frame_count}</TableCell>
              <TableCell>
                <VSyncedFrames
                  allowsTearing={bench.allows_tearing}
                  frameCount={bench.frame_count}
                />
              </TableCell>
              <TableCell>{bench.dropped}</TableCell>
              <TableCell>{bench.was_batched}</TableCell>
              <TableCell>{bench.dwm_notified}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function ScatterFps({ benches, colors }) {
  const options = {
    parsing: false,
    events: ["click"],
    scales: {
      x: {
        grid: {
          display: false,
        },
        title: {
          display: true,
          text: "Benchmark Time (ms)",
        },
        min: 0,
        max: benches.extremes.max_benchmark_time,
      },
      y: {
        title: {
          display: true,
          text: "FPS",
        },
        min: benches.extremes.min_fps,
        max: benches.extremes.max_fps,
      },
    },
    elements: {
      point: {
        radius: 2,
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
  };

  return (
    <div>
      <Scatter
        datasetIdKey="id"
        options={options}
        data={{
          datasets: benches.benches.map((bench, index) => ({
            id: index,
            label: bench.comment || bench.file_name,
            data: bench.fps,
            backgroundColor: `rgba(${colors[index].r}, ${colors[index].g}, ${colors[index].b}, ${colors[index].a})`,
            borderColor: `rgba(${colors[index].r}, ${colors[index].g}, ${colors[index].b}, ${colors[index].a})`,
          })),
        }}
      />
    </div>
  );
}

function ScatterMs({ benches, colors }) {
  const options = {
    parsing: false,
    events: ["click"],
    scales: {
      x: {
        grid: {
          display: false,
        },
        title: {
          display: true,
          text: "Benchmark Time (ms)",
        },
        min: 0,
        max: benches.extremes.max_benchmark_time,
      },
      y: {
        title: {
          display: true,
          text: "ms",
        },
        min: benches.extremes.min_ms,
        max: benches.extremes.max_ms,
      },
    },
    elements: {
      point: {
        radius: 2,
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
  };

  return (
    <div>
      <Scatter
        datasetIdKey="id"
        options={options}
        data={{
          datasets: benches.benches.map((bench, index) => ({
            id: index,
            label: bench.comment || bench.file_name,
            data: bench.frame_times,
            backgroundColor: `rgba(${colors[index].r}, ${colors[index].g}, ${colors[index].b}, ${colors[index].a})`,
            borderColor: `rgba(${colors[index].r}, ${colors[index].g}, ${colors[index].b}, ${colors[index].a})`,
          })),
        }}
      />
    </div>
  );
}

function LineFps({ benches, colors }) {
  const options = {
    parsing: false,
    showLine: true,
    events: ["click"],
    scales: {
      x: {
        grid: {
          display: false,
        },
        title: {
          display: true,
          text: "Benchmark Time (ms)",
        },
        min: 0,
        max: benches.extremes.max_benchmark_time,
      },
      y: {
        title: {
          display: true,
          text: "FPS",
        },
        min: benches.extremes.min_fps,
        max: benches.extremes.max_fps,
      },
    },
    elements: {
      point: {
        radius: 0,
      },
      line: {
        borderWidth: 2,
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
  };

  return (
    <div>
      <Scatter
        datasetIdKey="id"
        options={options}
        data={{
          datasets: benches.benches.map((bench, index) => ({
            id: index,
            label: bench.comment || bench.file_name,
            data: bench.fps,
            backgroundColor: `rgba(${colors[index].r}, ${colors[index].g}, ${colors[index].b}, ${colors[index].a})`,
            borderColor: `rgba(${colors[index].r}, ${colors[index].g}, ${colors[index].b}, ${colors[index].a})`,
          })),
        }}
      />
    </div>
  );
}

function LineMs({ benches, colors }) {
  const options = {
    parsing: false,
    showLine: true,
    events: ["click"],
    scales: {
      x: {
        grid: {
          display: false,
        },
        title: {
          display: true,
          text: "Benchmark Time (ms)",
        },
        min: 0,
        max: benches.extremes.max_benchmark_time,
      },
      y: {
        title: {
          display: true,
          text: "ms",
        },
        min: benches.extremes.min_ms,
        max: benches.extremes.max_ms,
      },
    },
    elements: {
      point: {
        radius: 0,
      },
      line: {
        borderWidth: 2,
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
  };

  return (
    <div>
      <Scatter
        datasetIdKey="id"
        options={options}
        data={{
          datasets: benches.benches.map((bench, index) => ({
            id: index,
            label: bench.comment || bench.file_name,
            data: bench.frame_times,
            backgroundColor: `rgba(${colors[index].r}, ${colors[index].g}, ${colors[index].b}, ${colors[index].a})`,
            borderColor: `rgba(${colors[index].r}, ${colors[index].g}, ${colors[index].b}, ${colors[index].a})`,
          })),
        }}
      />
    </div>
  );
}

function Percentiles({ benches, colors, values, labelValues }) {
  const options = {
    events: ["click", "mousemove"],
    scales: {
      x: {
        min: values.indexOf(1),
        title: {
          display: true,
          text: "Percentile",
        },
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
      line: {
        borderWidth: 2,
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
            min: 0,
            max: "original",
          },
        },
      },
    },
  };

  return (
    <div>
      <Line
        datasetIdKey="id"
        options={options}
        data={{
          labels: labelValues,
          datasets: benches.benches.map((bench, index) => ({
            id: index,
            label: bench.comment || bench.file_name,
            data: values.map((value) => bench.data.percentiles[value]),
            backgroundColor: `rgba(${colors[index].r}, ${colors[index].g}, ${colors[index].b}, ${colors[index].a})`,
            borderColor: `rgba(${colors[index].r}, ${colors[index].g}, ${colors[index].b}, ${colors[index].a})`,
          })),
        }}
      />
    </div>
  );
}

function Lows({ benches, colors, values, labelValues }) {
  const options = {
    events: ["click", "mousemove"],
    scales: {
      x: {
        min: values.indexOf(1),
        title: {
          display: true,
          text: "% Low",
        },
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
      line: {
        borderWidth: 2,
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
            min: 0,
            max: "original",
          },
        },
      },
    },
  };

  return (
    <div>
      <Line
        datasetIdKey="id"
        options={options}
        data={{
          labels: labelValues,
          datasets: benches.benches.map((bench, index) => ({
            id: index,
            label: bench.comment || bench.file_name,
            data: values.map((value) => bench.data.lows[value]),
            backgroundColor: `rgba(${colors[index].r}, ${colors[index].g}, ${colors[index].b}, ${colors[index].a})`,
            borderColor: `rgba(${colors[index].r}, ${colors[index].g}, ${colors[index].b}, ${colors[index].a})`,
          })),
        }}
      />
    </div>
  );
}

function BarVariation({ benches }) {
  const options = {
    indexAxis: "y",
    events: ["mousemove"],
    scales: {
      x: {
        min: 99,
        max: 100,
        stacked: true,
        grid: {
          display: false,
        },
        title: {
          display: true,
          text: "%",
        },
      },
      y: {
        stacked: true,
        grid: {
          display: false,
        },
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
            min: 0,
            max: "original",
          },
        },
      },
    },
  };

  return (
    <div>
      <Bar
        datasetIdKey="id"
        options={options}
        data={{
          labels: benches.benches.map(
            (bench) => bench.comment || bench.file_name
          ),
          datasets: segmentationUnits.map((segmentationUnit, index) => ({
            id: index,
            label: segmentationUnit.name,
            data: benches.benches.map(
              (bench) =>
                (bench.segmentation[segmentationUnit.name] /
                  bench.frame_count) *
                100
            ),
            backgroundColor: segmentationUnit.color,
          })),
        }}
      />
    </div>
  );
}

function BarDefault({ benches }) {
  const options = {
    indexAxis: "y",
    maintainAspectRatio: false,
    events: ["click", "mousemove"],
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
  };

  return (
    <div style={{ minHeight: `${15 + benches.benches.length * 35}vh` }}>
      <Bar
        datasetIdKey="id"
        options={options}
        plugins={[ChartDataLabels]}
        data={{
          labels: benches.benches.map(
            (bench) => bench.comment || bench.file_name
          ),
          datasets: mainMetrics.map((metric, index) => ({
            id: index,
            label: metric.name,
            data: benches.benches.map((bench) => {
              if (metric.name.includes("%ile")) {
                return bench.data.percentiles[
                  metric.name.split(" ")[0]
                ].toFixed(2);
              }

              if (metric.name.includes("% low")) {
                return bench.data.lows[metric.name.split(" ")[0]].toFixed(2);
              }

              return bench.data[metric.name].toFixed(2);
            }),
            backgroundColor: metric.color,
          })),
        }}
      />
    </div>
  );
}

export default function Charts({
  values,
  benches,
  setBenches,
  colors,
  chartTypes,
  chartsPerRow,
  Item,
}) {
  const labelValues = useMemo(
    () => values.map((value) => value.toFixed(3)),
    [values]
  );

  return (
    <Stack spacing={1}>
      {chartTypes[0].show && (
        <Item>
          <Info benches={benches} setBenches={setBenches} colors={colors} />
        </Item>
      )}
      <Box sx={{ flexGrow: 1 }}>
        <Grid container spacing={1} columns={chartsPerRow}>
          {chartTypes[1].show && (
            <Grid item xs={1}>
              <Item>
                <ScatterFps benches={benches} colors={colors} />
              </Item>
            </Grid>
          )}
          {chartTypes[2].show && (
            <Grid item xs={1}>
              <Item>
                <ScatterMs benches={benches} colors={colors} />
              </Item>
            </Grid>
          )}
          {chartTypes[3].show && (
            <Grid item xs={1}>
              <Item>
                <LineFps benches={benches} colors={colors} />
              </Item>
            </Grid>
          )}
          {chartTypes[4].show && (
            <Grid item xs={1}>
              <Item>
                <LineMs benches={benches} colors={colors} />
              </Item>
            </Grid>
          )}
          {chartTypes[5].show && (
            <Grid item xs={1}>
              <Item>
                <Percentiles
                  benches={benches}
                  colors={colors}
                  values={values}
                  labelValues={labelValues}
                />
              </Item>
            </Grid>
          )}
          {chartTypes[6].show && (
            <Grid item xs={1}>
              <Item>
                <Lows
                  benches={benches}
                  colors={colors}
                  values={values}
                  labelValues={labelValues}
                />
              </Item>
            </Grid>
          )}
          {chartTypes[7].show && (
            <Grid item xs={1}>
              <Item>
                <BarVariation benches={benches} />
              </Item>
            </Grid>
          )}
          {chartTypes[8].show && (
            <Grid item xs={1}>
              <Item>
                <BarDefault benches={benches} />
              </Item>
            </Grid>
          )}
        </Grid>
      </Box>
    </Stack>
  );
}
