import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import DeleteIcon from "@mui/icons-material/Delete";

export default function Misc({ chartsPerRow, setChartsPerRow }) {
  return (
    <Stack spacing={1} divider={<Divider />}>
      <div className="title">Miscellaneous</div>
      <Stack spacing={2}>
        <FormControl fullWidth size="small" style={{ marginTop: "16px" }}>
          <InputLabel id="charts-per-row">Charts Per Row</InputLabel>
          <Select
            labelId="charts-per-row"
            value={chartsPerRow}
            label="Charts Per Row"
            onChange={(ev) => setChartsPerRow(ev.target.value)}
          >
            <MenuItem value={1}>1</MenuItem>
            <MenuItem value={2}>2</MenuItem>
            <MenuItem value={3}>3</MenuItem>
          </Select>
        </FormControl>
        <Button
          variant="contained"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={() => {
            localStorage.clear();
            window.location.reload();
          }}
        >
          Reset All Settings
        </Button>
      </Stack>
    </Stack>
  );
}
