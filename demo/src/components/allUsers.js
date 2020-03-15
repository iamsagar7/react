import React, { Component } from "react";
import { Link } from "react-router-dom";
import moment from "moment";
import { getAllUser } from "../services/userService";
import { presentDays } from "../services/attendanceService";
class AllUser extends Component {
  state = { data: [], present: [] };

  async componentDidMount() {
    const { data } = await getAllUser();
    const { data: present } = await presentDays();
    this.setState({ data, present });
  }
  render() {
    const { data, present } = this.state;
    const totalDays = moment().daysInMonth();
    return (
      <div className="container">
        <table class="table">
          <thead class="thead-dark">
            <tr>
              <th scope="col">SN</th>
              <th scope="col">Name</th>
              <th scope="col">Email</th>
              <th scope="col">Present (This Month)</th>
              <th scope="col">This Month</th>
            </tr>
          </thead>
          <tbody>
            {data.map((user, index) => {
              const p = present.filter(u => u.barcode === user.barcode).length;

              return (
                <tr key={user._id}>
                  <th scope="row" className="text-white">
                    {index}
                  </th>
                  <td className="text-white">
                    <Link to={`/attendance/${user.barcode}`}>{user.name} </Link>
                  </td>
                  <td className="text-white">{user.email}</td>
                  <td className="text-white">{`${p}/${totalDays}`}</td>
                  <td className="text-white"></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
}

export default AllUser;
