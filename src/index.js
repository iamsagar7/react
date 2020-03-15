import React, { Component } from "react";
import PropTypes from "prop-types";
import {
  configure,
  BarcodePicker as ScanditSDKBarcodePicker
} from "scandit-sdk";

// Configure the library and activate it with a license key
configure(
  "AXN+uTyhIu6sKkzhnTlwJ+E98UiqHPrNY1Bh/csJXOL3d1KLoFrWzxVkOgc9Gbg9yV0ctdRLbsclaiJLUFVBM2NiVZ4fdBiVC0fy1cI3+K9AM5BKSjBK3XoVmjYIhbOvs0f1RFCu3T6YAYN1KqM9PUs4G22LmpRIIH81MHnly+f4V22Qxyaezv7BTSy1ngJXmYVqcz4Iz5z8uUMv/Yhp6KrV8+/6XeF1a0+Yuis51p/+zLAixMTfcHZ4SAa3zI6GexZaaKX4U1caRf8McfIszAUpXWZgaR7AfTg801HpALhk7/D4TNmjoKzOtWV7QhjyejpA8FbeQ5WuCoKmnqeIhWU1DL7IyLUpEFRtJYp+DjWmafEvqRQuQdctxR9UYJoQzQVf803+ZDuSjqpkALFrx8RmNXJpRkKrc+my9jOLTcvxm/UucqQwmahaglVkcrRWGTup4JSXpYIcAqEjSLLT96NRN1phIX0+ElNcIQ9BLiOlx2T02G89iwlEoFz+nyVo2ePpn9hrwvINark/8SVBWZHkfo+qLa45rR0xUSlU8VbJiV92IsKWvl202NVKlWWntB7stNqE33JvTJXH32FWLTzpFvu0FNWkXPlJ3Fuk9eyrc9eXM3A4SwIQiBZLN121fCEcmK28Tn51d4rsZ6/IGrfCAC1ZQW3eCUX/wEPnZxTz24VsELoMCYIqDeH/4ZnBCGHmb6S5DxDnp7HAXaBW0fmYv/Xp/lCaQ0xbfUT9VI+YOIIaqd1LTpM7iM9XYKEAnwBVApJatd0zqC8XR3F9zYZdhlbZa33ZMUIU"
).catch(error => {
  alert(error);
});

const style = {
  position: "absolute",
  top: "0",
  bottom: "0",
  left: "0",
  right: "0",
  margin: "auto",
  maxWidth: "1280px",
  maxHeight: "80%"
};

class BarcodePicker extends Component {
  static propTypes = {
    visible: PropTypes.bool,
    playSoundOnScan: PropTypes.bool,
    vibrateOnScan: PropTypes.bool,
    scanningPaused: PropTypes.bool,
    guiStyle: PropTypes.string,
    videoFit: PropTypes.string,
    scanSettings: PropTypes.object,
    enableCameraSwitcher: PropTypes.bool,
    enableTorchToggle: PropTypes.bool,
    enableTapToFocus: PropTypes.bool,
    enablePinchToZoom: PropTypes.bool,
    accessCamera: PropTypes.bool,
    camera: PropTypes.object,
    cameraSettings: PropTypes.object,
    targetScanningFPS: PropTypes.number,
    onScan: PropTypes.func,
    onError: PropTypes.func
  };

  constructor(props) {
    super(props);
    this.ref = React.createRef();
  }

  componentDidMount() {
    ScanditSDKBarcodePicker.create(this.ref.current, this.props).then(
      barcodePicker => {
        this.barcodePicker = barcodePicker;
        if (this.props.onScan != null) {
          barcodePicker.on("scan", this.props.onScan);
        }
        if (this.props.onError != null) {
          barcodePicker.on("scanError", this.props.onError);
        }
      }
    );
  }

  componentWillUnmount() {
    if (this.barcodePicker != null) {
      this.barcodePicker.destroy();
    }
  }

  componentDidUpdate(prevProps) {
    // These are just some examples of how to react to some possible property changes

    if (
      JSON.stringify(prevProps.scanSettings) !==
      JSON.stringify(this.props.scanSettings)
    ) {
      this.barcodePicker.applyScanSettings(this.props.scanSettings);
    }

    if (prevProps.visible !== this.props.visible) {
      this.barcodePicker.setVisible(this.props.visible);
    }
  }

  render() {
    return <div ref={this.ref} style={style} />;
  }
}

export default BarcodePicker;
