import React, { useState } from "react";
import Avatar from "@material-ui/core/Avatar";
import Button from "@material-ui/core/Button";
import CssBaseline from "@material-ui/core/CssBaseline";
import TextField from "@material-ui/core/TextField";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import Link from "@material-ui/core/Link";
import Grid from "@material-ui/core/Grid";
import Box from "@material-ui/core/Box";
import LockOutlinedIcon from "@material-ui/icons/LockOutlined";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";
import { toast } from "react-toastify";
import JsBarcode from "jsbarcode";
import gs1 from "gs1";
import { register, loginWithJwt } from "../services/authService";

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
  paper: {
    marginTop: theme.spacing(8),
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
    marginTop: theme.spacing(3)
  },
  submit: {
    margin: theme.spacing(3, 0, 2)
  }
}));

export default function Register() {
  const classes = useStyles();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [barcode, setBarcode] = useState("");
  const [disable, setDisable] = useState(true);
  const [error, setError] = useState("");

  const handleSubmit = async e => {
    e.preventDefault();
    const name = `${firstName} ${lastName}`;
    const val = await gs1(barcode);
    try {
      const response = await register(name, email, password, val);
      loginWithJwt(response.headers["x-auth-token"]);
      window.location = "/";
    } catch (ex) {
      if (ex.response && ex.response.status === 400) {
        setError(ex.response.data);
      }
    }
  };
  const getRandomArbitrary = (min, max) => {
    return Math.ceil(Math.random() * (max - min) + min);
  };

  const generateBarcode = async e => {
    await setBarcode(getRandomArbitrary(11111111111, 99999999999));
    await JsBarcode(".barcode").init();
  };
  //  console.log(JsBarcode())

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <div className={classes.paper}>
        <Avatar className={classes.avatar}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Sign up
        </Typography>
        <form
          className={classes.form}
          noValidate
          onSubmit={e => handleSubmit(e)}
        >
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                autoComplete="fname"
                name="firstName"
                variant="outlined"
                required
                fullWidth
                id="firstName"
                label="First Name"
                autoFocus
                onChange={({ target: input }) => setFirstName(input.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                variant="outlined"
                required
                fullWidth
                id="lastName"
                label="Last Name"
                name="lastName"
                autoComplete="lname"
                onChange={({ target: input }) => setLastName(input.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                variant="outlined"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                onChange={({ target: input }) => setEmail(input.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                variant="outlined"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                onChange={({ target: input }) => setPassword(input.value)}
              />
              {error && <div className="text-danger">{error}</div>}
            </Grid>
          </Grid>
          {firstName.length &&
          lastName.length &&
          email.length &&
          password.length ? (
            barcode ? (
              ""
            ) : (
              <Button
                onClick={e => generateBarcode(e)}
                fullWidth
                variant="contained"
                color="primary"
                className={classes.submit}
              >
                Generate Barcode
              </Button>
            )
          ) : (
            <Button
              onClick={e => generateBarcode(e)}
              fullWidth
              variant="contained"
              color="primary"
              className={classes.submit}
              disabled={disable}
            >
              Generate Barcode
            </Button>
          )}
          {barcode ? (
            <svg
              className="barcode"
              jsbarcode-format="upc"
              jsbarcode-value={barcode}
              jsbarcode-textmargin="0"
              jsbarcode-fontoptions="bold"
              style={{ alignContent: "center" }}
            ></svg>
          ) : (
            ""
          )}
          {barcode ? (
            <Grid item xs={12}>
              <FormControlLabel
                control={<Checkbox value="allowExtraEmails" color="primary" />}
                label="I accepts all the terms and conditions."
              />
            </Grid>
          ) : (
            ""
          )}
          {barcode ? (
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              className={classes.submit}
            >
              Sign Up
            </Button>
          ) : (
            ""
          )}
          {/* <Grid container justify="flex-end">
            <Grid item>
              <Link href="#" variant="body2">
                Already have an account? Sign in
              </Link>
            </Grid>
          </Grid> */}
        </form>
      </div>
      <Box mt={5}>
        <Copyright />
      </Box>
    </Container>
  );
}
