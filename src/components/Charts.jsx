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

import { useMemo } from "react";

import { Line, Scatter, Bar } from "react-chartjs-2";
//import 'chart.js/auto';
import {
   Chart as ChartJS,
   defaults,
   CategoryScale,
   LinearScale,
   PointElement,
   LineElement,
   BarElement,
   Legend,
   Tooltip
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(
   CategoryScale,
   LinearScale,
   PointElement,
   LineElement,
   BarElement,
   Legend,
   Tooltip
);

const mainMetrics = [
   "Max",
   "Avg",
   "Min",
   "1 %ile",
   "0.1 %ile",
   "0.01 %ile",
   "0.005 %ile",
   "1 % low",
   "0.1 % low",
   "0.01 % low",
   "0.005 % low",
   "STDEV"
];

const metricColors = {
   Max: "rgb(0,80,0)",
   Avg: "rgb(0,130,0)",
   Min: "rgb(0,180,0)",
   "1 %ile": "rgb(0,0,80)",
   "0.1 %ile": "rgb(0,0,130)",
   "0.01 %ile": "rgb(0,0,180)",
   "0.005 %ile": "rgb(0,0,230)",
   "1 % low": "rgb(80,0,0)",
   "0.1 % low": "rgb(130,0,0)",
   "0.01 % low": "rgb(180,0,0)",
   "0.005 % low": "rgb(230,0,0)",
   STDEV: "rgb(130,130,130)"
};

defaults.animation = false;
defaults.events = [];
defaults.font.size = 18;
defaults.borderColor = "rgb(70,70,70)";
defaults.color = "rgb(255,255,255)";
defaults.spanGaps = true;
defaults.normalized = true;

let values;
let labelValues;

function Info(props) {
   const { benches, setBenches, colors } = props;

   return (
      <TableContainer component={Paper}>
         <Table>
            <TableHead>
               <TableRow>
                  <TableCell>File Name and Comment</TableCell>
                  <TableCell>Application</TableCell>
                  <TableCell>API</TableCell>
                  <TableCell>Present Mode</TableCell>
                  <TableCell>Duration (ms)</TableCell>
                  <TableCell>Sync Interval</TableCell>
                  <TableCell>Total Frames</TableCell>
                  <TableCell>Dropped Frames</TableCell>
                  <TableCell>Allows Tearing</TableCell>
                  <TableCell>DWM Notified</TableCell>
                  <TableCell>Was Batched</TableCell>
               </TableRow>
            </TableHead>
            <TableBody>
               {benches.benches.map((bench, index) => (
                  <TableRow
                     key={index}
                     sx={{
                        "&:last-child td, &:last-child th": { border: 0 },
                        ".MuiTableCell-root": {
                           backgroundColor: `rgba(${colors[index].r}, ${colors[index].g}, ${colors[index].b}, ${colors[index].a})`,
                           color: "black",
                           fontSize: "18px",
                           fontWeight: 700
                        }
                     }}
                  >
                     <TableCell>
                        <div style={{ marginBottom: "6px" }}>
                           {bench.file_name}
                        </div>
                        <div style={{ display: "flex" }}>
                           <IconButton
                              className="hide-for-export"
                              onClick={() =>
                                 document
                                    .getElementById(`comment-${index}`)
                                    .focus()
                              }
                              style={{ paddingLeft: 0 }}
                           >
                              <EditIcon style={{ color: "black" }} />
                           </IconButton>
                           <input
                              type="text"
                              id={`comment-${index}`}
                              defaultValue={bench.comment || ""}
                              onBlur={(ev) =>
                                 setBenches((previousBenches) => {
                                    previousBenches.benches[index].comment =
                                       ev.target.value;
                                    return { ...previousBenches };
                                 })
                              }
                              style={{
                                 outline: "none",
                                 border: "none",
                                 margin: "0",
                                 padding: "0",
                                 background: "transparent",
                                 fontSize: "18px",
                                 fontWeight: 700
                              }}
                           />
                        </div>
                     </TableCell>
                     <TableCell>{bench.applications}</TableCell>
                     <TableCell>{bench.runtimes}</TableCell>
                     <TableCell>{bench.present_modes}</TableCell>
                     <TableCell>{bench.benchmark_time.toFixed(2)}</TableCell>
                     <TableCell>{bench.sync_intervals}</TableCell>
                     <TableCell>{bench.frame_count}</TableCell>
                     <TableCell>{bench.dropped}</TableCell>
                     <TableCell>{bench.allows_tearing}</TableCell>
                     <TableCell>{bench.dwm_notified}</TableCell>
                     <TableCell>{bench.was_batched}</TableCell>
                  </TableRow>
               ))}
            </TableBody>
         </Table>
      </TableContainer>
   );
}

function ScatterFps(props) {
   const { benches, colors } = props;

   const options = {
      parsing: false,
      events: ["click"],
      scales: {
         x: {
            grid: {
               display: false
            },
            title: {
               display: true,
               text: "Benchmark Time (ms)"
            },
            min: 0,
            max: benches.extremes.max_benchmark_time
         },
         y: {
            title: {
               display: true,
               text: "FPS"
            },
            min: benches.extremes.min_fps,
            max: benches.extremes.max_fps
         }
      },
      elements: {
         point: {
            radius: 2
         }
      }
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
                  borderColor: `rgba(${colors[index].r}, ${colors[index].g}, ${colors[index].b}, ${colors[index].a})`
               }))
            }}
         />
      </div>
   );
}

function ScatterMs(props) {
   const { benches, colors } = props;

   const options = {
      parsing: false,
      events: ["click"],
      scales: {
         x: {
            grid: {
               display: false
            },
            title: {
               display: true,
               text: "Benchmark Time (ms)"
            },
            min: 0,
            max: benches.extremes.max_benchmark_time
         },
         y: {
            title: {
               display: true,
               text: "ms"
            },
            min: benches.extremes.min_ms,
            max: benches.extremes.max_ms
         }
      },
      elements: {
         point: {
            radius: 2
         }
      }
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
                  borderColor: `rgba(${colors[index].r}, ${colors[index].g}, ${colors[index].b}, ${colors[index].a})`
               }))
            }}
         />
      </div>
   );
}

function LineFps(props) {
   const { benches, colors } = props;

   const options = {
      parsing: false,
      showLine: true,
      events: ["click"],
      scales: {
         x: {
            grid: {
               display: false
            },
            title: {
               display: true,
               text: "Benchmark Time (ms)"
            },
            min: 0,
            max: benches.extremes.max_benchmark_time
         },
         y: {
            title: {
               display: true,
               text: "FPS"
            },
            min: benches.extremes.min_fps,
            max: benches.extremes.max_fps
         }
      },
      elements: {
         point: {
            radius: 0
         },
         line: {
            borderWidth: 2
         }
      }
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
                  borderColor: `rgba(${colors[index].r}, ${colors[index].g}, ${colors[index].b}, ${colors[index].a})`
               }))
            }}
         />
      </div>
   );
}

function LineMs(props) {
   const { benches, colors } = props;

   const options = {
      parsing: false,
      showLine: true,
      events: ["click"],
      scales: {
         x: {
            grid: {
               display: false
            },
            title: {
               display: true,
               text: "Benchmark Time (ms)"
            },
            min: 0,
            max: benches.extremes.max_benchmark_time
         },
         y: {
            title: {
               display: true,
               text: "ms"
            },
            min: benches.extremes.min_ms,
            max: benches.extremes.max_ms
         }
      },
      elements: {
         point: {
            radius: 0
         },
         line: {
            borderWidth: 2
         }
      }
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
                  borderColor: `rgba(${colors[index].r}, ${colors[index].g}, ${colors[index].b}, ${colors[index].a})`
               }))
            }}
         />
      </div>
   );
}

function Percentiles(props) {
   const { benches, colors } = props;

   const options = {
      events: ["click", "mousemove"],
      scales: {
         x: {
            title: {
               display: true,
               text: "Percentiles"
            }
         },
         y: {
            title: {
               display: true,
               text: "FPS"
            },
            min: benches.extremes.min_percentile,
            max: benches.extremes.max_percentile
         }
      },
      elements: {
         point: {
            radius: 0
         },
         line: {
            borderWidth: 2
         }
      }
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
                  borderColor: `rgba(${colors[index].r}, ${colors[index].g}, ${colors[index].b}, ${colors[index].a})`
               }))
            }}
         />
      </div>
   );
}

function Lows(props) {
   const { benches, colors } = props;

   const options = {
      events: ["click", "mousemove"],
      scales: {
         x: {
            title: {
               display: true,
               text: "% lows"
            }
         },
         y: {
            title: {
               display: true,
               text: "FPS"
            },
            min: benches.extremes.min_low,
            max: benches.extremes.max_low
         }
      },
      elements: {
         point: {
            radius: 0
         },
         line: {
            borderWidth: 2
         }
      }
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
                  borderColor: `rgba(${colors[index].r}, ${colors[index].g}, ${colors[index].b}, ${colors[index].a})`
               }))
            }}
         />
      </div>
   );
}

function BarFps(props) {
   const { benches } = props;

   const options = {
      indexAxis: "y",
      maintainAspectRatio: false,
      events: ["click", "mousemove"],
      scales: {
         x: {
            min: 0,
            title: {
               display: true,
               text: "FPS"
            }
         },
         y: {
            grid: {
               display: false
            }
         }
      },
      plugins: {
         datalabels: {
            anchor: "start",
            clamp: true,
            align: "end",
            font: {
               weight: 700
            },
            color: "rgb(255,255,255)"
         }
      }
   };

   return (
      <div style={{ minHeight: 15 + benches.benches.length * 35 + "vh" }}>
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
                  label: metric,
                  data: benches.benches.map((bench) => {
                     if (metric.includes("%ile")) {
                        return bench.data.percentiles[
                           metric.split(" ")[0]
                        ].toFixed(2);
                     } else if (metric.includes("% low")) {
                        return bench.data.lows[metric.split(" ")[0]].toFixed(2);
                     } else {
                        return bench.data[metric].toFixed(2);
                     }
                  }),
                  backgroundColor: metricColors[metric]
               }))
            }}
         />
      </div>
   );
}

export default function Charts(props) {
   values = props.values;
   labelValues = useMemo(() => values.map((value) => value.toFixed(3)), []);

   const { benches, setBenches, colors, chartTypes, chartsPerRow, Item } =
      props;

   return (
      <Stack spacing={1}>
         {chartTypes[0].show && (
            <Item>
               <Info
                  benches={benches}
                  setBenches={setBenches}
                  colors={colors}
               />
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
                        <Percentiles benches={benches} colors={colors} />
                     </Item>
                  </Grid>
               )}
               {chartTypes[6].show && (
                  <Grid item xs={1}>
                     <Item>
                        <Lows benches={benches} colors={colors} />
                     </Item>
                  </Grid>
               )}
               {chartTypes[7].show && (
                  <Grid item xs={1}>
                     <Item>
                        <BarFps benches={benches} />
                     </Item>
                  </Grid>
               )}
            </Grid>
         </Box>
      </Stack>
   );
}