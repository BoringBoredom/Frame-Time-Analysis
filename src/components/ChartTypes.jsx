import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import FormGroup from "@mui/material/FormGroup";

export default function ChartTypes(props) {
   const { chartTypes, setChartTypes } = props;

   return (
      <Stack spacing={1} divider={<Divider />}>
         <div className="title">Chart Types</div>
         <FormGroup>
            {chartTypes.map((chartType, index) => (
               <FormControlLabel
                  key={index}
                  control={
                     <Switch
                        checked={chartType.show}
                        onChange={() =>
                           setChartTypes((previousChartTypes) => {
                              previousChartTypes[index].show =
                                 !previousChartTypes[index].show;
                              return [...previousChartTypes];
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
