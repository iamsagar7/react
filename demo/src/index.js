import React, { Component } from "react";
import { render } from "react-dom";
import App from "./app";
import { BrowserRouter } from "react-router-dom";

class Demo extends Component {
  render() {
    return <App />;
  }
}

render(
  <BrowserRouter>
    <Demo />
  </BrowserRouter>,
  document.querySelector("#demo")
);
