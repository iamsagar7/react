import React, { useState, useEffect } from "react";
import Avatar from "@material-ui/core/Avatar";
import Button from "@material-ui/core/Button";
import CssBaseline from "@material-ui/core/CssBaseline";
import TextField from "@material-ui/core/TextField";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import Link from "@material-ui/core/Link";
import Paper from "@material-ui/core/Paper";
import Box from "@material-ui/core/Box";
import Grid from "@material-ui/core/Grid";
import LockOutlinedIcon from "@material-ui/icons/LockOutlined";
import GavelIcon from "@material-ui/icons/Gavel";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";
import { rule, getRuleData } from "../services/attendanceService";
function Copyright() {
  return (
    <Typography variant="body2" color="textSecondary" align="center">
      {"Copyright © "}
      <Link color="inherit" href="https://material-ui.com/">
        Your Website
      </Link>{" "}
      {new Date().getFullYear()}
      {"."}
    </Typography>
  );
}

const useStyles = makeStyles(theme => ({
  root: {
    height: "90vh"
  },
  image: {
    backgroundImage:
      "url(https://www.nepaltour.info/wp-content/uploads/2018/09/visit-nepal-2020-1140x530.jpg)",
    backgroundRepeat: "no-repeat",
    backgroundColor:
      theme.palette.type === "dark"
        ? theme.palette.grey[900]
        : theme.palette.grey[50],
    backgroundSize: "cover",
    backgroundPosition: "center"
  },
  paper: {
    margin: theme.spacing(1),
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.secondary.main
  },
  form: {
    width: "100%", // Fix IE 11 issue.
    marginTop: theme.spacing(1)
  },
  submit: {
    margin: theme.spacing(3, 0, 2)
  }
}));

export default function SignInSide() {
  const classes = useStyles();
  const [sunday, setSunday] = useState("");
  const [monday, setMonday] = useState("");
  const [tuesday, setTuesday] = useState("");
  const [wednesday, setWednesday] = useState("");
  const [thursday, setThursday] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
      //   const { data } = await getRuleData();
      //  console.log(data);
      //   await setSunday(data.sunday);
        // await setMonday(data.monday);
        // await setTuesday(data.tuesday);
        // await setWednesday(data.wednesday);
        // await setThursday(data.thursday);
      } catch (ex) {
        alert("Error");
      }
    }
    fetchData();
  });
  // console.log(sunday);
  const handleSubmit = async e => {
    e.preventDefault();
    try {
      rule(sunday, monday, tuesday, wednesday, thursday);
    } catch (ex) {
      alert("cannot update the data !");
    }
  };
  return (
    <Grid container component="main" className={classes.root}>
      <CssBaseline />
      <Grid item xs={false} sm={4} md={7} className={classes.image} />
      <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
        <div className={classes.paper}>
          <Avatar className={classes.avatar}>
            <GavelIcon className="mt-0" />
          </Avatar>

          <form
            className={classes.form}
            noValidate
            onSubmit={e => handleSubmit(e)}
          >
            <TextField
              variant="outlined"
              required={true}
              fullWidth
              id="sunday"
              label="Sunday Arrival time"
              name="sunday"
              value={sunday ? sunday : ""}
              onChange={({ target: input }) => setSunday(input.value)}
              autoComplete="sunday"
            />

            <TextField
              className="mt-2"
              variant="outlined"
              value={monday ? monday : ""}
              required
              fullWidth
              name="monday"
              label="Monday Arrival Time"
              type="monday"
              id="monday"
              onChange={({ target: input }) => setMonday(input.value)}
              autoComplete="monday"
            />

            <TextField
              className="mt-2"
              variant="outlined"
              required
              value={tuesday ? tuesday : ""}
              fullWidth
              name="tuesday"
              label="Tuesday Arrival Time"
              type="tuesday"
              id="tuesday"
              onChange={({ target: input }) => setTuesday(input.value)}
              autoComplete="tuesday"
            />

            <TextField
              className="mt-2"
              variant="outlined"
              required
              fullWidth
              value={wednesday ? wednesday : ""}
              name="wednesday"
              label="Wednesday Arrival Time"
              type="wednesday"
              id="wednesday"
              onChange={({ target: input }) => setWednesday(input.value)}
              autoComplete="current-wednesday"
            />

            <TextField
              className="mt-2"
              variant="outlined"
              required
              fullWidth
              value={thursday ? thursday : ""}
              name="thursday"
              label="Thursday Arrival Time"
              type="thursday"
              id="thursday"
              onChange={({ target: input }) => setThursday(input.value)}
              autoComplete="thursday"
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              className={classes.submit}
            >
              Apply Rule
            </Button>
            <Box mt={5}>
              <Copyright />
            </Box>
          </form>
        </div>
      </Grid>
    </Grid>
  );
}
