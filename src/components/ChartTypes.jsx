import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import FormGroup from "@mui/material/FormGroup";

export default function ChartTypes({ chartTypes, setChartTypes }) {
  return (
    <Stack spacing={1} divider={<Divider />}>
      <div className="title">Chart Types</div>
      <FormGroup>
        {chartTypes.map((chartType, index) => (
          <FormControlLabel
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            control={
              <Switch
                checked={chartType.show}
                onChange={() =>
                  setChartTypes((previousChartTypes) => {
                    const newChartTypes = structuredClone(previousChartTypes);
                    newChartTypes[index].show = !newChartTypes[index].show;
                    return newChartTypes;
                  })
                }
              />
            }
            label={chartType.type}
          />
        ))}
      </FormGroup>
    </Stack>
  );
}
