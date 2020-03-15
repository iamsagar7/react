import { Camera } from "./camera";
import { CameraAccess } from "./cameraAccess";
import { CameraManager } from "./cameraManager";
import { CameraSettings } from "./cameraSettings";
import { CustomError } from "./customError";
export var MeteringMode;
(function (MeteringMode) {
    MeteringMode["CONTINUOUS"] = "continuous";
    MeteringMode["MANUAL"] = "manual";
    MeteringMode["NONE"] = "none";
    MeteringMode["SINGLE_SHOT"] = "single-shot";
})(MeteringMode || (MeteringMode = {}));
/**
 * A barcode picker utility class used to handle camera interaction.
 */
export class BarcodePickerCameraManager extends CameraManager {
    constructor(triggerFatalError, barcodePickerGui) {
        super();
        this.postStreamInitializationListener = this.postStreamInitialization.bind(this);
        this.videoTrackUnmuteListener = this.videoTrackUnmuteRecovery.bind(this);
        this.triggerManualFocusListener = this.triggerManualFocus.bind(this);
        this.triggerZoomStartListener = this.triggerZoomStart.bind(this);
        this.triggerZoomMoveListener = this.triggerZoomMove.bind(this);
        this.triggerFatalError = triggerFatalError;
        this.barcodePickerGui = barcodePickerGui;
    }
    setInteractionOptions(cameraSwitcherEnabled, torchToggleEnabled, tapToFocusEnabled, pinchToZoomEnabled) {
        this.cameraSwitcherEnabled = cameraSwitcherEnabled;
        this.torchToggleEnabled = torchToggleEnabled;
        this.tapToFocusEnabled = tapToFocusEnabled;
        this.pinchToZoomEnabled = pinchToZoomEnabled;
    }
    isCameraSwitcherEnabled() {
        return this.cameraSwitcherEnabled;
    }
    async setCameraSwitcherEnabled(enabled) {
        this.cameraSwitcherEnabled = enabled;
        if (this.cameraSwitcherEnabled) {
            const cameras = await CameraAccess.getCameras();
            if (cameras.length > 1) {
                this.barcodePickerGui.setCameraSwitcherVisible(true);
            }
        }
        else {
            this.barcodePickerGui.setCameraSwitcherVisible(false);
        }
    }
    isTorchToggleEnabled() {
        return this.torchToggleEnabled;
    }
    setTorchToggleEnabled(enabled) {
        this.torchToggleEnabled = enabled;
        if (this.torchToggleEnabled) {
            if (this.mediaStream != null &&
                this.mediaTrackCapabilities != null &&
                this.mediaTrackCapabilities.torch != null &&
                this.mediaTrackCapabilities.torch) {
                this.barcodePickerGui.setTorchTogglerVisible(true);
            }
        }
        else {
            this.barcodePickerGui.setTorchTogglerVisible(false);
        }
    }
    isTapToFocusEnabled() {
        return this.tapToFocusEnabled;
    }
    setTapToFocusEnabled(enabled) {
        this.tapToFocusEnabled = enabled;
        if (this.mediaStream != null) {
            if (this.tapToFocusEnabled) {
                this.enableTapToFocusListeners();
            }
            else {
                this.disableTapToFocusListeners();
            }
        }
    }
    isPinchToZoomEnabled() {
        return this.pinchToZoomEnabled;
    }
    setPinchToZoomEnabled(enabled) {
        this.pinchToZoomEnabled = enabled;
        if (this.mediaStream != null) {
            if (this.pinchToZoomEnabled) {
                this.enablePinchToZoomListeners();
            }
            else {
                this.disablePinchToZoomListeners();
            }
        }
    }
    setSelectedCamera(camera) {
        this.selectedCamera = camera;
    }
    setSelectedCameraSettings(cameraSettings) {
        this.selectedCameraSettings = cameraSettings;
    }
    async setupCameras() {
        if (this.cameraInitializationPromise != null) {
            return this.cameraInitializationPromise;
        }
        const mediaStreamTrack = await this.accessInitialCamera();
        const cameras = await CameraAccess.getCameras();
        if (this.cameraSwitcherEnabled && cameras.length > 1) {
            this.barcodePickerGui.setCameraSwitcherVisible(true);
        }
        if (mediaStreamTrack != null) {
            // We successfully accessed a camera, check if it's really the main (back or only) camera
            const mainCamera = CameraAccess.adjustCamerasFromMainCameraStream(mediaStreamTrack, cameras);
            if (mainCamera != null) {
                this.selectedCamera = mainCamera;
                this.updateActiveCameraCurrentResolution(mainCamera);
                return Promise.resolve();
            }
            this.setSelectedCamera();
        }
        if (this.selectedCamera == null) {
            let autoselectedCamera = cameras
                .filter(camera => {
                return camera.cameraType === Camera.Type.BACK;
            })
                .sort((camera1, camera2) => {
                return camera1.label.localeCompare(camera2.label);
            })[0];
            if (autoselectedCamera == null) {
                autoselectedCamera = cameras[0];
                if (autoselectedCamera == null) {
                    throw new CustomError(BarcodePickerCameraManager.noCameraErrorParameters);
                }
            }
            return this.initializeCameraWithSettings(autoselectedCamera, this.selectedCameraSettings);
        }
        else {
            return this.initializeCameraWithSettings(this.selectedCamera, this.selectedCameraSettings);
        }
    }
    stopStream() {
        if (this.activeCamera != null) {
            this.activeCamera.currentResolution = undefined;
        }
        this.activeCamera = undefined;
        if (this.mediaStream != null) {
            window.clearTimeout(this.cameraAccessTimeout);
            window.clearInterval(this.cameraMetadataCheckInterval);
            window.clearTimeout(this.getCapabilitiesTimeout);
            window.clearTimeout(this.manualFocusWaitTimeout);
            window.clearTimeout(this.manualToAutofocusResumeTimeout);
            window.clearInterval(this.autofocusInterval);
            this.mediaStream.getVideoTracks().forEach(track => {
                track.stop();
            });
            this.mediaStream = undefined;
            this.mediaTrackCapabilities = undefined;
        }
    }
    applyCameraSettings(cameraSettings) {
        this.selectedCameraSettings = cameraSettings;
        if (this.activeCamera == null) {
            return Promise.reject(new CustomError(BarcodePickerCameraManager.noCameraErrorParameters));
        }
        return this.initializeCameraWithSettings(this.activeCamera, cameraSettings);
    }
    reinitializeCamera() {
        if (this.activeCamera != null) {
            this.initializeCameraWithSettings(this.activeCamera, this.activeCameraSettings).catch(this.triggerFatalError);
        }
    }
    async initializeCameraWithSettings(camera, cameraSettings) {
        let existingCameraInitializationPromise = Promise.resolve();
        if (this.cameraInitializationPromise != null) {
            existingCameraInitializationPromise = this.cameraInitializationPromise;
        }
        await existingCameraInitializationPromise;
        this.setSelectedCamera(camera);
        this.selectedCameraSettings = this.activeCameraSettings = cameraSettings;
        if (cameraSettings != null && cameraSettings.resolutionPreference === CameraSettings.ResolutionPreference.FULL_HD) {
            this.cameraInitializationPromise = this.initializeCameraAndCheckUpdatedSettings(camera);
        }
        else {
            this.cameraInitializationPromise = this.initializeCameraAndCheckUpdatedSettings(camera, 3);
        }
        return this.cameraInitializationPromise;
    }
    async setTorchEnabled(enabled) {
        if (this.mediaStream != null &&
            this.mediaTrackCapabilities != null &&
            this.mediaTrackCapabilities.torch != null &&
            this.mediaTrackCapabilities.torch) {
            this.torchEnabled = enabled;
            const videoTracks = this.mediaStream.getVideoTracks();
            // istanbul ignore else
            if (videoTracks.length !== 0 && typeof videoTracks[0].applyConstraints === "function") {
                await videoTracks[0].applyConstraints({ advanced: [{ torch: enabled }] });
            }
        }
    }
    async toggleTorch() {
        this.torchEnabled = !this.torchEnabled;
        await this.setTorchEnabled(this.torchEnabled);
    }
    async setZoom(zoomPercentage, currentZoom) {
        if (this.mediaStream != null && this.mediaTrackCapabilities != null && this.mediaTrackCapabilities.zoom != null) {
            const videoTracks = this.mediaStream.getVideoTracks();
            // istanbul ignore else
            if (videoTracks.length !== 0 && typeof videoTracks[0].applyConstraints === "function") {
                const zoomRange = this.mediaTrackCapabilities.zoom.max - this.mediaTrackCapabilities.zoom.min;
                if (currentZoom == null) {
                    currentZoom = this.mediaTrackCapabilities.zoom.min;
                }
                const targetZoom = Math.max(this.mediaTrackCapabilities.zoom.min, Math.min(currentZoom + zoomRange * zoomPercentage, this.mediaTrackCapabilities.zoom.max));
                await videoTracks[0].applyConstraints({
                    advanced: [{ zoom: targetZoom }]
                });
            }
        }
    }
    accessInitialCamera() {
        let initialCameraAccessPromise = Promise.resolve();
        if (this.selectedCamera == null) {
            // Try to directly access primary (back or only) camera
            const primaryCamera = {
                deviceId: "",
                label: "",
                cameraType: Camera.Type.BACK
            };
            initialCameraAccessPromise = new Promise(async (resolve) => {
                try {
                    await this.initializeCameraWithSettings(primaryCamera, this.selectedCameraSettings);
                    if (this.mediaStream != null) {
                        const videoTracks = this.mediaStream.getVideoTracks();
                        if (videoTracks.length !== 0) {
                            return resolve(videoTracks[0]);
                        }
                    }
                }
                catch {
                    // Ignored
                }
                finally {
                    resolve();
                }
            });
        }
        return initialCameraAccessPromise;
    }
    updateActiveCameraCurrentResolution(camera) {
        this.activeCamera = camera;
        this.activeCamera.currentResolution = {
            width: this.barcodePickerGui.videoElement.videoWidth,
            height: this.barcodePickerGui.videoElement.videoHeight
        };
        this.barcodePickerGui.setMirrorImageEnabled(this.barcodePickerGui.isMirrorImageEnabled(), false);
    }
    postStreamInitialization() {
        window.clearTimeout(this.getCapabilitiesTimeout);
        this.getCapabilitiesTimeout = window.setTimeout(() => {
            this.storeStreamCapabilities();
            this.setupAutofocus();
            if (this.torchToggleEnabled &&
                this.mediaStream != null &&
                this.mediaTrackCapabilities != null &&
                this.mediaTrackCapabilities.torch != null &&
                this.mediaTrackCapabilities.torch) {
                this.barcodePickerGui.setTorchTogglerVisible(true);
            }
        }, BarcodePickerCameraManager.getCapabilitiesTimeoutMs);
    }
    videoTrackUnmuteRecovery() {
        this.reinitializeCamera();
    }
    async triggerManualFocusForContinuous() {
        this.manualToAutofocusResumeTimeout = window.setTimeout(async () => {
            await this.triggerFocusMode(MeteringMode.CONTINUOUS);
        }, BarcodePickerCameraManager.manualToAutofocusResumeTimeoutMs);
        try {
            await this.triggerFocusMode(MeteringMode.CONTINUOUS);
            this.manualFocusWaitTimeout = window.setTimeout(async () => {
                await this.triggerFocusMode(MeteringMode.MANUAL);
            }, BarcodePickerCameraManager.manualFocusWaitTimeoutMs);
        }
        catch {
            // istanbul ignore next
        }
    }
    async triggerManualFocusForSingleShot() {
        window.clearInterval(this.autofocusInterval);
        this.manualToAutofocusResumeTimeout = window.setTimeout(() => {
            this.autofocusInterval = window.setInterval(this.triggerAutoFocus.bind(this), BarcodePickerCameraManager.autofocusIntervalMs);
        }, BarcodePickerCameraManager.manualToAutofocusResumeTimeoutMs);
        try {
            await this.triggerFocusMode(MeteringMode.SINGLE_SHOT);
        }
        catch {
            // istanbul ignore next
        }
    }
    async triggerManualFocus(event) {
        if (event != null) {
            event.preventDefault();
            if (event.type === "touchend" && event.touches.length !== 0) {
                return;
            }
            // Check if we were using pinch-to-zoom
            if (this.pinchToZoomDistance != null) {
                this.pinchToZoomDistance = undefined;
                return;
            }
        }
        window.clearTimeout(this.manualFocusWaitTimeout);
        window.clearTimeout(this.manualToAutofocusResumeTimeout);
        if (this.mediaStream != null && this.mediaTrackCapabilities != null) {
            const focusModeCapability = this.mediaTrackCapabilities.focusMode;
            if (focusModeCapability instanceof Array && focusModeCapability.includes(MeteringMode.SINGLE_SHOT)) {
                if (focusModeCapability.includes(MeteringMode.CONTINUOUS) &&
                    focusModeCapability.includes(MeteringMode.MANUAL)) {
                    await this.triggerManualFocusForContinuous();
                }
                else if (!focusModeCapability.includes(MeteringMode.CONTINUOUS)) {
                    await this.triggerManualFocusForSingleShot();
                }
            }
        }
    }
    triggerZoomStart(event) {
        if (event == null || event.touches.length !== 2) {
            return;
        }
        event.preventDefault();
        this.pinchToZoomDistance = Math.hypot((event.touches[1].screenX - event.touches[0].screenX) / screen.width, (event.touches[1].screenY - event.touches[0].screenY) / screen.height);
        if (this.mediaStream != null && this.mediaTrackCapabilities != null && this.mediaTrackCapabilities.zoom != null) {
            const videoTracks = this.mediaStream.getVideoTracks();
            // istanbul ignore else
            if (videoTracks.length !== 0 && typeof videoTracks[0].getConstraints === "function") {
                this.pinchToZoomInitialZoom = this.mediaTrackCapabilities.zoom.min;
                const currentConstraints = videoTracks[0].getConstraints();
                if (currentConstraints.advanced != null) {
                    const currentZoomConstraint = currentConstraints.advanced.find(constraint => {
                        return "zoom" in constraint;
                    });
                    if (currentZoomConstraint != null && currentZoomConstraint.zoom != null) {
                        this.pinchToZoomInitialZoom = currentZoomConstraint.zoom;
                    }
                }
            }
        }
    }
    async triggerZoomMove(event) {
        if (this.pinchToZoomDistance == null || event == null || event.touches.length !== 2) {
            return;
        }
        event.preventDefault();
        await this.setZoom((Math.hypot((event.touches[1].screenX - event.touches[0].screenX) / screen.width, (event.touches[1].screenY - event.touches[0].screenY) / screen.height) -
            this.pinchToZoomDistance) *
            2, this.pinchToZoomInitialZoom);
    }
    storeStreamCapabilities() {
        // istanbul ignore else
        if (this.mediaStream != null) {
            const videoTracks = this.mediaStream.getVideoTracks();
            // istanbul ignore else
            if (videoTracks.length !== 0 && typeof videoTracks[0].getCapabilities === "function") {
                this.mediaTrackCapabilities = videoTracks[0].getCapabilities();
            }
        }
    }
    setupAutofocus() {
        window.clearTimeout(this.manualFocusWaitTimeout);
        window.clearTimeout(this.manualToAutofocusResumeTimeout);
        // istanbul ignore else
        if (this.mediaStream != null && this.mediaTrackCapabilities != null) {
            const focusModeCapability = this.mediaTrackCapabilities.focusMode;
            if (focusModeCapability instanceof Array &&
                !focusModeCapability.includes(MeteringMode.CONTINUOUS) &&
                focusModeCapability.includes(MeteringMode.SINGLE_SHOT)) {
                window.clearInterval(this.autofocusInterval);
                this.autofocusInterval = window.setInterval(this.triggerAutoFocus.bind(this), BarcodePickerCameraManager.autofocusIntervalMs);
            }
        }
    }
    triggerAutoFocus() {
        this.triggerFocusMode(MeteringMode.SINGLE_SHOT).catch(
        /* istanbul ignore next */ () => {
            // Ignored
        });
    }
    triggerFocusMode(focusMode) {
        // istanbul ignore else
        if (this.mediaStream != null) {
            const videoTracks = this.mediaStream.getVideoTracks();
            if (videoTracks.length !== 0 && typeof videoTracks[0].applyConstraints === "function") {
                return videoTracks[0].applyConstraints({ advanced: [{ focusMode }] });
            }
        }
        return Promise.reject(undefined);
    }
    enableTapToFocusListeners() {
        ["touchend", "mousedown"].forEach(eventName => {
            this.barcodePickerGui.videoElement.addEventListener(eventName, this.triggerManualFocusListener);
        });
    }
    enablePinchToZoomListeners() {
        this.barcodePickerGui.videoElement.addEventListener("touchstart", this.triggerZoomStartListener);
        this.barcodePickerGui.videoElement.addEventListener("touchmove", this.triggerZoomMoveListener);
    }
    disableTapToFocusListeners() {
        ["touchend", "mousedown"].forEach(eventName => {
            this.barcodePickerGui.videoElement.removeEventListener(eventName, this.triggerManualFocusListener);
        });
    }
    disablePinchToZoomListeners() {
        this.barcodePickerGui.videoElement.removeEventListener("touchstart", this.triggerZoomStartListener);
        this.barcodePickerGui.videoElement.removeEventListener("touchmove", this.triggerZoomMoveListener);
    }
    async initializeCameraAndCheckUpdatedSettings(camera, resolutionFallbackLevel) {
        try {
            await this.initializeCamera(camera, resolutionFallbackLevel);
            // Check if due to asynchronous behaviour camera settings were changed while camera was initialized
            if (this.selectedCameraSettings !== this.activeCameraSettings &&
                (this.selectedCameraSettings == null ||
                    this.activeCameraSettings == null ||
                    Object.keys(this.selectedCameraSettings).some(cameraSettingsProperty => {
                        return (this.selectedCameraSettings[cameraSettingsProperty] !==
                            this.activeCameraSettings[cameraSettingsProperty]);
                    }))) {
                this.activeCameraSettings = this.selectedCameraSettings;
                return this.initializeCameraAndCheckUpdatedSettings(camera, resolutionFallbackLevel);
            }
        }
        finally {
            this.cameraInitializationPromise = undefined;
        }
    }
    retryInitializeCameraIfNeeded(camera, resolutionFallbackLevel, resolve, reject, error) {
        if (resolutionFallbackLevel < 6) {
            return this.initializeCamera(camera, resolutionFallbackLevel + 1)
                .then(resolve)
                .catch(reject);
        }
        else {
            return reject(error);
        }
    }
    async handleCameraInitializationError(error, resolutionFallbackLevel, camera, resolve, reject) {
        // istanbul ignore if
        if (error.name === "SourceUnavailableError") {
            error.name = "NotReadableError";
        }
        if (error.message === "Invalid constraint" ||
            // tslint:disable-next-line:no-any
            (error.name === "OverconstrainedError" && error.constraint === "deviceId")) {
            // Camera might have changed deviceId: check for new cameras with same label and type but different deviceId
            const cameras = await CameraAccess.getCameras();
            const newCamera = cameras.find(currentCamera => {
                return (currentCamera.label === camera.label &&
                    currentCamera.cameraType === camera.cameraType &&
                    currentCamera.deviceId !== camera.deviceId);
            });
            if (newCamera == null) {
                return this.retryInitializeCameraIfNeeded(camera, resolutionFallbackLevel, resolve, reject, error);
            }
            else {
                return this.initializeCamera(newCamera, resolutionFallbackLevel)
                    .then(resolve)
                    .catch(reject);
            }
        }
        if (["PermissionDeniedError", "PermissionDismissedError", "NotAllowedError", "NotFoundError", "AbortError"].includes(error.name)) {
            // Camera is not accessible at all
            return reject(error);
        }
        return this.retryInitializeCameraIfNeeded(camera, resolutionFallbackLevel, resolve, reject, error);
    }
    initializeCamera(camera, resolutionFallbackLevel = 0) {
        if (camera == null) {
            return Promise.reject(new CustomError(BarcodePickerCameraManager.noCameraErrorParameters));
        }
        this.stopStream();
        this.torchEnabled = false;
        this.barcodePickerGui.setTorchTogglerVisible(false);
        return new Promise(async (resolve, reject) => {
            try {
                const stream = await CameraAccess.accessCameraStream(resolutionFallbackLevel, camera);
                // Detect weird browser behaviour that on unsupported resolution returns a 2x2 video instead
                if (typeof stream.getTracks()[0].getSettings === "function") {
                    const mediaTrackSettings = stream.getTracks()[0].getSettings();
                    if (mediaTrackSettings.width != null &&
                        mediaTrackSettings.height != null &&
                        (mediaTrackSettings.width === 2 || mediaTrackSettings.height === 2)) {
                        if (resolutionFallbackLevel === 6) {
                            return reject(new CustomError({ name: "NotReadableError", message: "Could not initialize camera correctly" }));
                        }
                        else {
                            return this.initializeCamera(camera, resolutionFallbackLevel + 1)
                                .then(resolve)
                                .catch(reject);
                        }
                    }
                }
                this.mediaStream = stream;
                this.mediaStream.getVideoTracks().forEach(track => {
                    // Reinitialize camera on weird pause/resumption coming from the OS
                    // This will add the listener only once in the case of multiple calls, identical listeners are ignored
                    track.addEventListener("unmute", this.videoTrackUnmuteListener);
                });
                // This will add the listener only once in the case of multiple calls, identical listeners are ignored
                this.barcodePickerGui.videoElement.addEventListener("loadedmetadata", this.postStreamInitializationListener);
                if (this.tapToFocusEnabled) {
                    this.enableTapToFocusListeners();
                }
                if (this.pinchToZoomEnabled) {
                    this.enablePinchToZoomListeners();
                }
                this.resolveInitializeCamera(camera, resolve, reject);
                this.barcodePickerGui.videoElement.srcObject = stream;
                this.barcodePickerGui.videoElement.load();
                this.barcodePickerGui.playVideo();
            }
            catch (error) {
                await this.handleCameraInitializationError(error, resolutionFallbackLevel, camera, resolve, reject);
            }
        });
    }
    resolveInitializeCamera(camera, resolve, reject) {
        const cameraNotReadableError = new CustomError({
            name: "NotReadableError",
            message: "Could not initialize camera correctly"
        });
        window.clearTimeout(this.cameraAccessTimeout);
        this.cameraAccessTimeout = window.setTimeout(() => {
            this.stopStream();
            reject(cameraNotReadableError);
        }, BarcodePickerCameraManager.cameraAccessTimeoutMs);
        this.barcodePickerGui.videoElement.onresize = () => {
            if (this.activeCamera != null) {
                this.updateActiveCameraCurrentResolution(this.activeCamera);
            }
        };
        this.barcodePickerGui.videoElement.onloadeddata = () => {
            this.barcodePickerGui.videoElement.onloadeddata = null;
            window.clearTimeout(this.cameraAccessTimeout);
            // Detect weird browser behaviour that on unsupported resolution returns a 2x2 video instead
            // Also detect failed camera access with no error but also no video stream provided
            if (this.barcodePickerGui.videoElement.videoWidth > 2 &&
                this.barcodePickerGui.videoElement.videoHeight > 2 &&
                this.barcodePickerGui.videoElement.currentTime > 0) {
                if (camera.deviceId !== "") {
                    this.updateActiveCameraCurrentResolution(camera);
                }
                return resolve();
            }
            const cameraMetadataCheckStartTime = performance.now();
            window.clearInterval(this.cameraMetadataCheckInterval);
            this.cameraMetadataCheckInterval = window.setInterval(() => {
                // Detect weird browser behaviour that on unsupported resolution returns a 2x2 video instead
                // Also detect failed camera access with no error but also no video stream provided
                if (this.barcodePickerGui.videoElement.videoWidth === 2 ||
                    this.barcodePickerGui.videoElement.videoHeight === 2 ||
                    this.barcodePickerGui.videoElement.currentTime === 0) {
                    if (performance.now() - cameraMetadataCheckStartTime >
                        BarcodePickerCameraManager.cameraMetadataCheckTimeoutMs) {
                        window.clearInterval(this.cameraMetadataCheckInterval);
                        this.stopStream();
                        return reject(cameraNotReadableError);
                    }
                    return;
                }
                window.clearInterval(this.cameraMetadataCheckInterval);
                if (camera.deviceId !== "") {
                    this.updateActiveCameraCurrentResolution(camera);
                    this.barcodePickerGui.videoElement.dispatchEvent(new Event("canplay"));
                }
                return resolve();
            }, BarcodePickerCameraManager.cameraMetadataCheckIntervalMs);
        };
    }
}
BarcodePickerCameraManager.cameraAccessTimeoutMs = 4000;
BarcodePickerCameraManager.cameraMetadataCheckTimeoutMs = 4000;
BarcodePickerCameraManager.cameraMetadataCheckIntervalMs = 50;
BarcodePickerCameraManager.getCapabilitiesTimeoutMs = 500;
BarcodePickerCameraManager.autofocusIntervalMs = 1500;
BarcodePickerCameraManager.manualToAutofocusResumeTimeoutMs = 5000;
BarcodePickerCameraManager.manualFocusWaitTimeoutMs = 400;
BarcodePickerCameraManager.noCameraErrorParameters = {
    name: "NoCameraAvailableError",
    message: "No camera available"
};
//# sourceMappingURL=barcodePickerCameraManager.js.map