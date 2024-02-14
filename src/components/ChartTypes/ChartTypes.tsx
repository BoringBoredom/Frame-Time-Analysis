import { Stack, Divider, Switch, Text } from "@mantine/core";
import s from "./ChartTypes.module.css";
import type { initialChartTypes } from "../static";

export default function ChartTypes({
  chartTypes,
  setChartTypes,
}: {
  chartTypes: typeof initialChartTypes;
  setChartTypes: React.Dispatch<React.SetStateAction<typeof initialChartTypes>>;
}) {
  return (
    <Stack className={s.width}>
      <Text size="xl" className={s.title}>
        Chart Types
      </Text>
      <Divider />
      {chartTypes.map((chartType, index) => (
        <Switch
          key={chartType.name}
          size="md"
          checked={chartType.show}
          label={chartType.name}
          onChange={(ev) => {
            setChartTypes((previousChartTypes) => {
              const newChartTypes = structuredClone(previousChartTypes);
              newChartTypes[index].show = ev.target.checked;
              return newChartTypes;
            });
          }}
        />
      ))}
    </Stack>
  );
}
