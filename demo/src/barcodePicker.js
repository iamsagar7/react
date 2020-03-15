import React, { Component } from "react";
import { ScanSettings, Barcode } from "scandit-sdk";
import { toast } from "react-toastify";
import BarcodePicker from "../../src";
import { attendance } from "./services/attendanceService";
class BarcodeReader extends Component {
  state = {};

  render() {
    return (
      <BarcodePicker
        playSoundOnScan={true}
        vibrateOnScan={true}
        scanSettings={
          new ScanSettings({
            enabledSymbologies: [
              "qr",
              "ean8",
              "ean13",
              "upca",
              "upce",
              "code128",
              "code39",
              "code93",
              "itf"
            ],
            codeDuplicateFilter: 1000
          })
        }
        onScan={async scanResult => {
          const { barcodes } = scanResult;
          const barcode = barcodes[0].data;
          try {
            const { data } = await attendance(barcode);
            toast.info(`Hello ${data.name}`, {
              position: toast.POSITION.TOP_RIGHT,
              autoClose: 2000
            });
          } catch (ex) {
            if (ex.response && ex.response.status === 400) {
              toast.error(ex.response.data);
            }
          }
        }}
        onError={error => {
          console.error(error.message);
        }}
      />
    );
  }
}

export default BarcodeReader;
