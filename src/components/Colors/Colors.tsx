import { Stack, Divider, ColorInput, Text } from "@mantine/core";
import s from "./Colors.module.css";
import { initialColors } from "../static";

export default function colors({
  colors,
  setColors,
}: {
  colors: typeof initialColors;
  setColors: React.Dispatch<React.SetStateAction<typeof initialColors>>;
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
            setColors((previousColors) => {
              const newColors = structuredClone(previousColors);
              newColors[index] = value;
              return newColors;
            });
          }}
        />
      ))}
    </Stack>
  );
}
