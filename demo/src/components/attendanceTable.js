import React, { Component } from "react";
import moment from "moment";
import { userAttendance } from "../services/attendanceService";

class AttendanceTable extends Component {
  state = {
    userAtt: []
  };
  async populateAttendance() {
    try {
      const attendanceId = this.props.match.params.id;
      const { data } = await userAttendance(attendanceId);
      this.setState({ userAtt: data });
    } catch (ex) {
      if (ex.response && ex.response.status === 404)
        this.props.history.replace("/not-found");
    }
  }
  async componentDidMount() {
    await this.populateAttendance();
  }
  render() {
    const { userAtt } = this.state;
    console.log(userAtt);
    return (
      <div className="container">
        <table class="table">
          <thead class="thead-dark">
            <tr>
              <th scope="col">SN</th>
              <th scope="col">Arrival Time</th>
              <th scope="col">Day</th>
              <th scope="col">Time</th>
              <th scope="col">Month</th>
            </tr>
          </thead>
          <tbody>
            {userAtt.map((user, index) => {
              return (
                <tr>
                  <th scope="row" className="text-white">
                    {index}
                  </th>
                  <td className="text-white">{user.arrivalTime}</td>
                  <td className="text-white">
                    {moment(user.arrivalTime).format("dddd")}
                  </td>
                  <td className="text-white">
                    {moment(user.arrivalTime).format("h:mm")}
                  </td>
                  <td className="text-white">
                    {moment(user.arrivalTime).format("MMMM")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
}

export default AttendanceTable;
