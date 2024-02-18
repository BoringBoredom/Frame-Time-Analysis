import React from "react";
import { Group } from "@mantine/core";
import s from "./App.module.css";
import type { Data } from "./components/types";
import {
  initialChartTypes,
  initialColors,
  type sortOptions,
} from "./components/static";
import ReadMe from "./components/ReadMe/ReadMe";
import Misc from "./components/Misc/Misc";
import ChartTypes from "./components/ChartTypes/ChartTypes";
import Buttons from "./components/Buttons/Buttons";
import Colors from "./components/Colors/Colors";
import DataDisplay from "./components/DataDisplay/DataDisplay";

export default function App() {
  const [data, setData] = React.useState<Data>({
    benches: [],
    extremes: {
      duration: { min: 0, max: 0 },
      fps: { min: Infinity, max: 0 },
      ms: { min: Infinity, max: 0 },
    },
  });

  const [colors, setColors] = React.useState<typeof initialColors>(() => {
    const storedColorsValue = localStorage.getItem("colors");

    let storedColors: typeof initialColors = [];
    if (storedColorsValue) {
      storedColors = JSON.parse(storedColorsValue) as typeof initialColors;
    }

    return storedColors.length === initialColors.length
      ? storedColors
      : initialColors;
  });

  React.useEffect(() => {
    localStorage.setItem("colors", JSON.stringify(colors));
  }, [colors]);

  const [chartTypes, setChartTypes] = React.useState<typeof initialChartTypes>(
    () => {
      const storedChartTypesValue = localStorage.getItem("chartTypes");

      let storedChartTypes: typeof initialChartTypes = [];
      if (storedChartTypesValue) {
        storedChartTypes = JSON.parse(
          storedChartTypesValue
        ) as typeof initialChartTypes;
      }

      if (
        JSON.stringify(storedChartTypes.map((entry) => entry.name)) !==
        JSON.stringify(initialChartTypes.map((entry) => entry.name))
      ) {
        return initialChartTypes;
      }

      return storedChartTypes;
    }
  );

  React.useEffect(() => {
    localStorage.setItem("chartTypes", JSON.stringify(chartTypes));
  }, [chartTypes]);

  const [chartsPerRow, setChartsPerRow] = React.useState<number>(() => {
    const chartsPerRowValue = localStorage.getItem("chartsPerRow");

    let chartsPerRow = 1;
    if (chartsPerRowValue) {
      chartsPerRow = parseInt(chartsPerRowValue, 10);
    }

    return chartsPerRow;
  });

  React.useEffect(() => {
    localStorage.setItem("chartsPerRow", chartsPerRow.toString());
  }, [chartsPerRow]);

  const [sortBy, setSortBy] = React.useState<(typeof sortOptions)[number]>(
    () => {
      const sortByValue = localStorage.getItem("sortBy");

      let sortBy: (typeof sortOptions)[number] = "-";
      if (sortByValue) {
        sortBy = sortByValue as (typeof sortOptions)[number];
      }

      return sortBy;
    }
  );

  React.useEffect(() => {
    localStorage.setItem("sortBy", sortBy);
  }, [sortBy]);

  return (
    <>
      <Buttons data={data} setData={setData} sortBy={sortBy} />
      {data.benches.length < 1 ? (
        <Group
          align="start"
          grow
          preventGrowOverflow={false}
          className={s.padding}
        >
          <Colors colors={colors} setColors={setColors} />
          <ChartTypes chartTypes={chartTypes} setChartTypes={setChartTypes} />
          <Misc
            chartsPerRow={chartsPerRow}
            setChartsPerRow={setChartsPerRow}
            sortBy={sortBy}
            setSortBy={setSortBy}
          />
          <ReadMe />
        </Group>
      ) : (
        <>
          <DataDisplay
            data={data}
            colors={colors}
            chartTypes={chartTypes}
            chartsPerRow={chartsPerRow}
          />
          <div id="watermark" className={s.watermark}>
            created with https://boringboredom.github.io/Frame-Time-Analysis/
          </div>
        </>
      )}
    </>
  );
}
