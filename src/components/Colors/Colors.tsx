import { Stack, Divider, ColorInput, Text } from "@mantine/core";
import s from "./Colors.module.css";
import type { Updater } from "use-immer";
import { initialColors } from "../static";

export default function colors({
  colors,
  updateColors,
}: {
  colors: typeof initialColors;
  updateColors: Updater<typeof initialColors>;
}) {
  return (
    <Stack className={s.width}>
      <Text size="xl" className={s.title}>
        Colors
      </Text>
      <Divider />
      {colors.map((color, index) => (
        <ColorInput
          key={index}
          value={color}
          withEyeDropper={false}
          swatches={initialColors}
          onChangeEnd={(value) => {
            updateColors((draft) => {
              draft[index] = value;
            });
          }}
        />
      ))}
    </Stack>
  );
}
