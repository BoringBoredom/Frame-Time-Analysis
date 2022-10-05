import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import FormGroup from "@mui/material/FormGroup";
import IconButton from "@mui/material/IconButton";
import SettingsIcon from "@mui/icons-material/Settings";
// import Popper from "@mui/material/Popper";
import Popover from "@mui/material/Popover";
import TextField from "@mui/material/TextField";
import { useState } from "react";

function Wrapper({
  type,
  children,
  variationThresholds,
  setVariationThresholds,
}) {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  if (type === "Bar: Variation") {
    return (
      <div style={{ display: "flex", alignItems: "center" }}>
        {children}
        <IconButton color="primary" onClick={handleClick}>
          <SettingsIcon fontSize="small" />
        </IconButton>
        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          transitionDuration={1}
        >
          <Stack spacing={1} divider={<Divider />} style={{ padding: "8px" }}>
            {variationThresholds.map((entry, index) => (
              <TextField
                // eslint-disable-next-line react/no-array-index-key
                key={index}
                label={entry.type}
                variant="outlined"
                type="number"
                value={entry.threshold}
                disabled={index === variationThresholds.length - 1}
                onChange={(ev) => {
                  const value = parseInt(ev.target.value, 10);

                  if (
                    (index === 0 &&
                      value > 0 &&
                      value < variationThresholds[index + 1].threshold) ||
                    (index > 0 &&
                      index < variationThresholds.length - 2 &&
                      value > variationThresholds[index - 1].threshold &&
                      value < variationThresholds[index + 1].threshold) ||
                    (index === variationThresholds.length - 2 &&
                      value > variationThresholds[index - 1].threshold)
                  ) {
                    setVariationThresholds((previousState) => {
                      const newState = JSON.parse(
                        JSON.stringify(previousState)
                      );
                      newState[index].threshold = value;
                      newState[variationThresholds.length - 1].threshold =
                        newState[variationThresholds.length - 2].threshold;
                      return newState;
                    });
                  }
                }}
              />
            ))}
          </Stack>
        </Popover>
      </div>
    );
  }

  return children;
}

export default function ChartTypes({
  chartTypes,
  setChartTypes,
  variationThresholds,
  setVariationThresholds,
}) {
  return (
    <Stack spacing={1} divider={<Divider />}>
      <div className="title">Chart Types</div>
      <FormGroup>
        {chartTypes.map((chartType, index) => (
          <Wrapper
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            type={chartType.type}
            variationThresholds={variationThresholds}
            setVariationThresholds={setVariationThresholds}
          >
            <FormControlLabel
              control={
                <Switch
                  checked={chartType.show}
                  onChange={() =>
                    setChartTypes((previousState) => {
                      const newState = JSON.parse(
                        JSON.stringify(previousState)
                      );
                      newState[index].show = !newState[index].show;
                      return newState;
                    })
                  }
                />
              }
              label={chartType.type}
            />
          </Wrapper>
        ))}
      </FormGroup>
    </Stack>
  );
}
