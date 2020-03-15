import React, { Component } from "react";
import { Route, Redirect, Switch } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Login from "./components/login";
import Logout from "./components/logout";
import BarcodePicker from "./barcodePicker";
import NavBar from "./components/navBar";
import Register from "./components/register";
import Profile from "./components/profile";
import ProtectedRoute from "./components/protectedRoute";
import { getCurrentUser } from "./services/authService";
import ArrivalRule from "./components/arrivalRule";
import "react-toastify/dist/ReactToastify.css";
import Spinner from "./components/spinner";
import AttendanceTable from "./components/attendanceTable";
import NotFound from "./components/notFound";
import { userAttendance } from "./services/attendanceService";
import AllUser from "./components/allUsers";
const ProfileOverview = Spinner(Profile);
const AttendanceOverview = Spinner(AttendanceTable);
const UsersOverview = Spinner(AllUser);
class App extends Component {
  state = {
    loading: true,
    tableData: true,
    userAtt: []
  };

  async componentDidMount() {
    const user = await getCurrentUser();
    this.setState({ user });
    this.setState({ loading: false });
    if (user) {
      const userData = { ...this.state.user };
      const { data } = await userAttendance(userData.barcode);
      this.setState({ userAtt: data, tableData: false });
    }
  }
  render() {
    const { user, loading, tableData, userAtt } = this.state;
    return (
      <React.Fragment>
        <NavBar user={user} />
        <ToastContainer
          autoClose={2000}
          position="top-center"
          className="toast-container text-white"
          toastClassName="dark-toast"
        />

        <main className="container">
          <Switch>
            <Route exact path="/" component={BarcodePicker} />
            <Route path="/login" component={Login} />
            <ProtectedRoute exact path="/logout" component={Logout} />
            <Route path="/register" component={Register} />
            <ProtectedRoute
              path="/profile"
              render={props => (
                <ProfileOverview isloading={loading} user={user} {...props} />
              )}
            />
            <ProtectedRoute
              path="/attendance/:id"
              render={props => (
                <AttendanceOverview
                  isloading={tableData}
                  {...props}
                />
              )}
            />
            <ProtectedRoute
              exact
              path="/users"
              render={props => <UsersOverview  user={user} />}
            />
            <ProtectedRoute exact path="/rule" component={ArrivalRule} />
            <Route exact path="/not-found" component={NotFound} />
            <Redirect to="/not-found" />
          </Switch>
        </main>
      </React.Fragment>
    );
  }
}

export default App;
