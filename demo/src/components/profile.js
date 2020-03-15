import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import JsBarcode from "jsbarcode";

const Profile = ({ user }) => {
  JsBarcode(".barcode").init();
  return (
    <div
      className="container"
      style={{
        backgroundImage:
          "url(https://businessesgrow.com/wp-content/uploads/2020/01/invest-in-artificial-intelligence.jpeg)",
        height: "100%"
      }}
    >
      {user && user.isAdmin ? (
        ""
      ) : (
        <div className="mt-3 mb-3">
          {" "}
          <Link to={`/attendance/${user.barcode}`}>
            <button className="btn btn-primary">Attendance Report</button>{" "}
          </Link>
        </div>
      )}
      {user && user.isAdmin ? (
        <div className="mt-3 mb-3">
          <Link to="/users">
            <button className="btn btn-warning">All Atendance Data</button>{" "}
          </Link>
        </div>
      ) : (
        ""
      )}
      <h3> Name: {user.name}</h3>
      <h3> Email: {user.email}</h3>
      <h3> Barcode</h3>
      {/* <svg
        className="barcode"
        jsbarcode-format="upc"
        jsbarcode-value={user.barcode}
        jsbarcode-textmargin="0"
        jsbarcode-fontoptions="bold"
        style={{ alignContent: "center" }}
      ></svg> */}
    </div>
  );
};

export default Profile;
