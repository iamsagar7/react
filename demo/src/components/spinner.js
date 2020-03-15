import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import CircularProgress from "@material-ui/core/CircularProgress";

const Spinner = WrappedComponent => ({ isloading, ...restProps }) => {
  return isloading ? (
    <div>
      <CircularProgress />
    </div>
  ) : (
    <WrappedComponent {...restProps} />
  );
};

export default Spinner;
