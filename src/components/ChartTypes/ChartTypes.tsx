import { Stack, Divider, Switch, Text } from "@mantine/core";
import s from "./ChartTypes.module.css";
import type { Updater } from "use-immer";
import type { initialChartTypes } from "../static";

export default function ChartTypes({
  chartTypes,
  updateChartTypes,
}: {
  chartTypes: typeof initialChartTypes;
  updateChartTypes: Updater<typeof initialChartTypes>;
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
            updateChartTypes((draft) => {
              draft[index].show = ev.target.checked;
            });
          }}
        />
      ))}
    </Stack>
  );
}
