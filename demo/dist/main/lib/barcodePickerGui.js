"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var resize_observer_1 = require("@juggle/resize-observer");
// tslint:disable-next-line: variable-name
var ResizeObserver = 
// tslint:disable-next-line: no-any
"ResizeObserver" in window ? /* istanbul ignore next */ window.ResizeObserver : resize_observer_1.ResizeObserver;
var base64assets_1 = require("./assets/base64assets");
var barcodePicker_1 = require("./barcodePicker");
var browserHelper_1 = require("./browserHelper");
var camera_1 = require("./camera");
var cameraAccess_1 = require("./cameraAccess");
var imageSettings_1 = require("./imageSettings");
var BarcodePickerGui = /** @class */ (function () {
    function BarcodePickerGui(options) {
        var _this = this;
        this.scanner = options.scanner;
        this.originElement = options.originElement;
        this.singleImageMode = options.singleImageMode;
        this.scanningPaused = options.scanningPaused;
        this.cameraUploadCallback = options.cameraUploadCallback;
        this.mirrorImageOverrides = new Map();
        this.grandParentElement = document.createElement("div");
        this.grandParentElement.className = BarcodePickerGui.grandParentElementClassName;
        this.originElement.appendChild(this.grandParentElement);
        this.parentElement = document.createElement("div");
        this.parentElement.className = BarcodePickerGui.parentElementClassName;
        this.grandParentElement.appendChild(this.parentElement);
        this.videoImageCanvasContext = document.createElement("canvas").getContext("2d");
        this.videoElement = document.createElement("video");
        this.cameraSwitcherElement = document.createElement("img");
        this.torchTogglerElement = document.createElement("img");
        this.laserContainerElement = document.createElement("div");
        this.laserActiveImageElement = document.createElement("img");
        this.laserPausedImageElement = document.createElement("img");
        this.viewfinderElement = document.createElement("div");
        if (options.singleImageMode) {
            this.cameraUploadElement = document.createElement("div");
            this.cameraUploadInputElement = document.createElement("input");
            this.cameraUploadLabelElement = document.createElement("label");
            this.cameraUploadProgressElement = document.createElement("div");
            this.setupCameraUploadGuiAssets();
            this.guiStyle = barcodePicker_1.BarcodePicker.GuiStyle.NONE;
        }
        else {
            this.setupVideoElement();
            this.setupCameraSwitcher();
            this.setupTorchToggler();
            this.setupFullGuiAssets();
            this.setGuiStyle(options.guiStyle);
            this.setVideoFit(options.videoFit);
            this.setLaserArea(options.laserArea);
            this.setViewfinderArea(options.viewfinderArea);
            this.visibilityListener = this.checkAndRecoverPlayback.bind(this);
            document.addEventListener("visibilitychange", this.visibilityListener);
            this.newScanSettingsListener = this.handleNewScanSettings.bind(this);
            this.scanner.onNewScanSettings(this.newScanSettingsListener);
            this.handleNewScanSettings();
            this.videoResizeListener = this.handleVideoResize.bind(this);
            this.videoElement.addEventListener("resize", this.videoResizeListener);
        }
        if (options.hideLogo) {
            this.licenseFeaturesReadyListener = this.showScanditLogo.bind(this, options.hideLogo);
            this.scanner.onLicenseFeaturesReady(this.licenseFeaturesReadyListener);
        }
        else {
            this.showScanditLogo(false);
        }
        this.resize();
        this.resizeObserver = new ResizeObserver(function () {
            _this.resize();
        });
        this.resizeObserver.observe(this.originElement);
        this.setVisible(options.visible);
    }
    BarcodePickerGui.prototype.destroy = function () {
        if (this.visibilityListener != null) {
            document.removeEventListener("visibilitychange", this.visibilityListener);
        }
        if (this.newScanSettingsListener != null) {
            this.scanner.removeListener("newScanSettings", this.newScanSettingsListener);
        }
        if (this.videoResizeListener != null) {
            document.removeEventListener("resize", this.videoResizeListener);
        }
        if (this.licenseFeaturesReadyListener != null) {
            this.scanner.removeListener("licenseFeaturesReady", this.licenseFeaturesReadyListener);
        }
        this.resizeObserver.disconnect();
        this.grandParentElement.remove();
        this.originElement.classList.remove(BarcodePickerGui.hiddenClassName);
    };
    BarcodePickerGui.prototype.setCameraManager = function (cameraManager) {
        this.cameraManager = cameraManager;
    };
    BarcodePickerGui.prototype.pauseScanning = function () {
        this.scanningPaused = true;
        this.laserActiveImageElement.classList.add(BarcodePickerGui.hiddenOpacityClassName);
        this.laserPausedImageElement.classList.remove(BarcodePickerGui.hiddenOpacityClassName);
        this.viewfinderElement.classList.add(BarcodePickerGui.pausedClassName);
    };
    BarcodePickerGui.prototype.resumeScanning = function () {
        this.scanningPaused = false;
        this.laserPausedImageElement.classList.add(BarcodePickerGui.hiddenOpacityClassName);
        this.laserActiveImageElement.classList.remove(BarcodePickerGui.hiddenOpacityClassName);
        this.viewfinderElement.classList.remove(BarcodePickerGui.pausedClassName);
    };
    BarcodePickerGui.prototype.isVisible = function () {
        return this.visible;
    };
    BarcodePickerGui.prototype.setVisible = function (visible) {
        var browserName = browserHelper_1.BrowserHelper.userAgentInfo.getBrowser().name;
        if (browserName != null && browserName.includes("Safari") && this.visible != null && !this.visible && visible) {
            // Safari behaves very weirdly when displaying the video element again after being hidden:
            // it undetectably reuses video frames "buffered" from the video just before it was hidden.
            // We do this to avoid reusing old data
            this.videoElement.pause();
            this.videoElement.currentTime = 0;
            this.videoElement.load();
            this.playVideo();
        }
        this.visible = visible;
        if (visible) {
            this.originElement.classList.remove(BarcodePickerGui.hiddenClassName);
            if (this.guiStyle === barcodePicker_1.BarcodePicker.GuiStyle.LASER) {
                this.laserActiveImageElement.classList.remove(BarcodePickerGui.flashColorClassName);
            }
            else if (this.guiStyle === barcodePicker_1.BarcodePicker.GuiStyle.VIEWFINDER) {
                this.viewfinderElement.classList.remove(BarcodePickerGui.flashWhiteClassName);
            }
        }
        else {
            this.originElement.classList.add(BarcodePickerGui.hiddenClassName);
        }
    };
    BarcodePickerGui.prototype.isMirrorImageEnabled = function () {
        if (this.cameraManager != null &&
            this.cameraManager.selectedCamera != null &&
            this.cameraManager.activeCamera != null) {
            var mirrorImageOverride = this.mirrorImageOverrides.get(this.cameraManager.activeCamera.deviceId + this.cameraManager.activeCamera.label);
            if (mirrorImageOverride != null) {
                return mirrorImageOverride;
            }
            else {
                return this.cameraManager.activeCamera.cameraType === camera_1.Camera.Type.FRONT;
            }
        }
        else {
            return false;
        }
    };
    BarcodePickerGui.prototype.setMirrorImageEnabled = function (enabled, override) {
        if (this.cameraManager != null && this.cameraManager.selectedCamera != null) {
            if (enabled) {
                this.videoElement.classList.add(BarcodePickerGui.mirroredClassName);
            }
            else {
                this.videoElement.classList.remove(BarcodePickerGui.mirroredClassName);
            }
            if (override) {
                this.mirrorImageOverrides.set(this.cameraManager.selectedCamera.deviceId + this.cameraManager.selectedCamera.label, enabled);
            }
        }
    };
    BarcodePickerGui.prototype.setGuiStyle = function (guiStyle) {
        if (this.singleImageMode) {
            return;
        }
        switch (guiStyle) {
            case barcodePicker_1.BarcodePicker.GuiStyle.LASER:
                this.guiStyle = guiStyle;
                this.laserContainerElement.classList.remove(BarcodePickerGui.hiddenClassName);
                this.viewfinderElement.classList.add(BarcodePickerGui.hiddenClassName);
                break;
            case barcodePicker_1.BarcodePicker.GuiStyle.VIEWFINDER:
                this.guiStyle = guiStyle;
                this.laserContainerElement.classList.add(BarcodePickerGui.hiddenClassName);
                this.viewfinderElement.classList.remove(BarcodePickerGui.hiddenClassName);
                break;
            case barcodePicker_1.BarcodePicker.GuiStyle.NONE:
            default:
                this.guiStyle = barcodePicker_1.BarcodePicker.GuiStyle.NONE;
                this.laserContainerElement.classList.add(BarcodePickerGui.hiddenClassName);
                this.viewfinderElement.classList.add(BarcodePickerGui.hiddenClassName);
                break;
        }
    };
    BarcodePickerGui.prototype.setLaserArea = function (area) {
        this.customLaserArea = area;
        if (area == null) {
            area = this.scanner.getScanSettings().getSearchArea();
        }
        var borderPercentage = 0.025;
        var usablePercentage = 1 - borderPercentage * 2;
        this.laserContainerElement.style.left = (borderPercentage + area.x * usablePercentage) * 100 + "%";
        this.laserContainerElement.style.width = area.width * usablePercentage * 100 + "%";
        this.laserContainerElement.style.top = (borderPercentage + area.y * usablePercentage) * 100 + "%";
        this.laserContainerElement.style.height = area.height * usablePercentage * 100 + "%";
    };
    BarcodePickerGui.prototype.setViewfinderArea = function (area) {
        this.customViewfinderArea = area;
        if (area == null) {
            area = this.scanner.getScanSettings().getSearchArea();
        }
        var borderPercentage = 0.025;
        var usablePercentage = 1 - borderPercentage * 2;
        this.viewfinderElement.style.left = (borderPercentage + area.x * usablePercentage) * 100 + "%";
        this.viewfinderElement.style.width = area.width * usablePercentage * 100 + "%";
        this.viewfinderElement.style.top = (borderPercentage + area.y * usablePercentage) * 100 + "%";
        this.viewfinderElement.style.height = area.height * usablePercentage * 100 + "%";
    };
    BarcodePickerGui.prototype.setVideoFit = function (objectFit) {
        if (this.singleImageMode) {
            return;
        }
        this.videoFit = objectFit;
        if (objectFit === barcodePicker_1.BarcodePicker.ObjectFit.COVER) {
            this.videoElement.style.objectFit = "cover";
            this.videoElement.dataset.objectFit = "cover"; // used by "objectFitPolyfill" library
        }
        else {
            this.videoElement.style.objectFit = "contain";
            this.videoElement.dataset.objectFit = "contain"; // used by "objectFitPolyfill" library
            this.scanner.applyScanSettings(this.scanner.getScanSettings().setBaseSearchArea({ x: 0, y: 0, width: 1.0, height: 1.0 }));
        }
        this.resize();
    };
    BarcodePickerGui.prototype.reassignOriginElement = function (originElement) {
        if (!this.visible) {
            this.originElement.classList.remove(BarcodePickerGui.hiddenClassName);
            originElement.classList.add(BarcodePickerGui.hiddenClassName);
        }
        originElement.appendChild(this.grandParentElement);
        this.checkAndRecoverPlayback();
        this.resize();
        this.resizeObserver.disconnect();
        this.resizeObserver.observe(originElement);
        this.originElement = originElement;
    };
    BarcodePickerGui.prototype.flashGUI = function () {
        if (this.guiStyle === barcodePicker_1.BarcodePicker.GuiStyle.LASER) {
            this.flashLaser();
        }
        else if (this.guiStyle === barcodePicker_1.BarcodePicker.GuiStyle.VIEWFINDER) {
            this.flashViewfinder();
        }
    };
    BarcodePickerGui.prototype.getVideoImageData = function () {
        if (!this.singleImageMode) {
            // This could happen in very weird situations and should be temporary
            if (this.videoElement.readyState !== 4 ||
                this.videoImageCanvasContext.canvas.width <= 2 ||
                this.videoImageCanvasContext.canvas.height <= 2) {
                return undefined;
            }
            this.videoImageCanvasContext.drawImage(this.videoElement, 0, 0);
        }
        return this.videoImageCanvasContext.getImageData(0, 0, this.videoImageCanvasContext.canvas.width, this.videoImageCanvasContext.canvas.height).data;
    };
    BarcodePickerGui.prototype.getVideoCurrentTime = function () {
        return this.videoElement.currentTime;
    };
    BarcodePickerGui.prototype.setCameraSwitcherVisible = function (visible) {
        if (visible) {
            this.cameraSwitcherElement.classList.remove(BarcodePickerGui.hiddenClassName);
        }
        else {
            this.cameraSwitcherElement.classList.add(BarcodePickerGui.hiddenClassName);
        }
    };
    BarcodePickerGui.prototype.setTorchTogglerVisible = function (visible) {
        if (visible) {
            this.torchTogglerElement.classList.remove(BarcodePickerGui.hiddenClassName);
        }
        else {
            this.torchTogglerElement.classList.add(BarcodePickerGui.hiddenClassName);
        }
    };
    BarcodePickerGui.prototype.playVideo = function () {
        var playPromise = this.videoElement.play();
        if (playPromise != null) {
            playPromise.catch(
            /* istanbul ignore next */ function () {
                // Can sometimes cause an incorrect rejection (all is good, ignore).
            });
        }
    };
    BarcodePickerGui.prototype.setCameraUploadGuiAvailable = function (available) {
        if (available) {
            this.cameraUploadProgressElement.classList.add(BarcodePickerGui.flashWhiteInsetClassName);
            this.cameraUploadElement.classList.remove(BarcodePickerGui.opacityPulseClassName);
        }
        else {
            this.cameraUploadProgressElement.classList.remove(BarcodePickerGui.flashWhiteInsetClassName);
            this.cameraUploadElement.classList.add(BarcodePickerGui.opacityPulseClassName);
        }
    };
    BarcodePickerGui.prototype.setupVideoElement = function () {
        this.videoElement.setAttribute("autoplay", "autoplay");
        this.videoElement.setAttribute("playsinline", "true");
        this.videoElement.setAttribute("muted", "muted");
        this.videoElement.className = BarcodePickerGui.videoElementClassName;
        this.parentElement.appendChild(this.videoElement);
    };
    BarcodePickerGui.prototype.setupCameraUploadGuiAssets = function () {
        var _this = this;
        this.cameraUploadElement.className = BarcodePickerGui.cameraUploadElementClassName;
        this.parentElement.appendChild(this.cameraUploadElement);
        this.cameraUploadInputElement.type = "file";
        this.cameraUploadInputElement.accept = "image/*";
        this.cameraUploadInputElement.setAttribute("capture", "environment");
        this.cameraUploadInputElement.addEventListener("change", this.cameraUploadFile.bind(this));
        this.cameraUploadInputElement.addEventListener("click", 
        /* istanbul ignore next */ function (event) {
            if (_this.scanningPaused || _this.scanner.isBusyProcessing()) {
                event.preventDefault();
            }
        });
        this.cameraUploadLabelElement.appendChild(this.cameraUploadInputElement);
        this.cameraUploadElement.appendChild(this.cameraUploadLabelElement);
        var cameraUploadImageElement = document.createElement("img");
        cameraUploadImageElement.src = base64assets_1.cameraImage;
        this.cameraUploadLabelElement.appendChild(cameraUploadImageElement);
        var cameraUploadTextElement = document.createElement("div");
        cameraUploadTextElement.innerText = "Scan from Camera";
        this.cameraUploadLabelElement.appendChild(cameraUploadTextElement);
        this.cameraUploadProgressElement.classList.add("radial-progress");
        this.cameraUploadElement.appendChild(this.cameraUploadProgressElement);
    };
    BarcodePickerGui.prototype.setupFullGuiAssets = function () {
        this.laserActiveImageElement.src = base64assets_1.laserActiveImage;
        this.laserContainerElement.appendChild(this.laserActiveImageElement);
        this.laserPausedImageElement.src = base64assets_1.laserPausedImage;
        this.laserContainerElement.appendChild(this.laserPausedImageElement);
        this.laserContainerElement.className = BarcodePickerGui.laserContainerElementClassName;
        this.parentElement.appendChild(this.laserContainerElement);
        this.viewfinderElement.className = BarcodePickerGui.viewfinderElementClassName;
        this.parentElement.appendChild(this.viewfinderElement);
        // Show inactive GUI, as for now the scanner isn't ready yet
        this.laserActiveImageElement.classList.add(BarcodePickerGui.hiddenOpacityClassName);
        this.laserPausedImageElement.classList.remove(BarcodePickerGui.hiddenOpacityClassName);
        this.viewfinderElement.classList.add(BarcodePickerGui.pausedClassName);
    };
    BarcodePickerGui.prototype.flashLaser = function () {
        this.laserActiveImageElement.classList.remove(BarcodePickerGui.flashColorClassName);
        // tslint:disable-next-line:no-unused-expression
        this.laserActiveImageElement.offsetHeight; // NOSONAR // Trigger reflow to restart animation
        this.laserActiveImageElement.classList.add(BarcodePickerGui.flashColorClassName);
    };
    BarcodePickerGui.prototype.flashViewfinder = function () {
        this.viewfinderElement.classList.remove(BarcodePickerGui.flashWhiteClassName);
        // tslint:disable-next-line:no-unused-expression
        this.viewfinderElement.offsetHeight; // NOSONAR // Trigger reflow to restart animation
        this.viewfinderElement.classList.add(BarcodePickerGui.flashWhiteClassName);
    };
    BarcodePickerGui.prototype.resize = function () {
        this.parentElement.style.maxWidth = "";
        this.parentElement.style.maxHeight = "";
        var width = this.originElement.clientWidth;
        var height = this.originElement.clientHeight;
        if (width === 0 || height === 0) {
            return;
        }
        if (this.singleImageMode) {
            this.resizeCameraUpload(width, height);
        }
        else {
            this.resizeVideo(width, height);
        }
    };
    BarcodePickerGui.prototype.resizeCameraUpload = function (width, height) {
        this.cameraUploadLabelElement.style.transform = "scale(" + Math.min(1, width / 500, height / 300) + ")";
        this.cameraUploadProgressElement.style.transform = "scale(" + Math.min(1, width / 500, height / 300) + ")";
    };
    BarcodePickerGui.prototype.resizeVideo = function (width, height) {
        if (this.videoElement.videoWidth <= 2 || this.videoElement.videoHeight <= 2) {
            return;
        }
        var videoRatio = this.videoElement.videoWidth / this.videoElement.videoHeight;
        if (this.videoFit === barcodePicker_1.BarcodePicker.ObjectFit.COVER) {
            var widthPercentage = 1;
            var heightPercentage = 1;
            if (videoRatio < width / height) {
                heightPercentage = Math.min(1, height / (width / videoRatio));
            }
            else {
                widthPercentage = Math.min(1, width / (height * videoRatio));
            }
            this.scanner.applyScanSettings(this.scanner.getScanSettings().setBaseSearchArea({
                x: (1 - widthPercentage) / 2,
                y: (1 - heightPercentage) / 2,
                width: widthPercentage,
                height: heightPercentage
            }));
            return;
        }
        if (videoRatio > width / height) {
            height = width / videoRatio;
        }
        else {
            width = height * videoRatio;
        }
        this.parentElement.style.maxWidth = Math.ceil(width) + "px";
        this.parentElement.style.maxHeight = Math.ceil(height) + "px";
        window.objectFitPolyfill(this.videoElement);
    };
    BarcodePickerGui.prototype.checkAndRecoverPlayback = function () {
        if (this.cameraManager != null &&
            this.cameraManager.activeCamera != null &&
            this.videoElement != null &&
            this.videoElement.srcObject != null) {
            if (!this.videoElement.srcObject.active) {
                this.cameraManager.reinitializeCamera();
            }
            else {
                this.playVideo();
            }
        }
    };
    BarcodePickerGui.prototype.updateCameraUploadProgress = function (progressPercentageValue) {
        this.cameraUploadProgressElement.setAttribute("data-progress", progressPercentageValue);
    };
    BarcodePickerGui.prototype.cameraUploadImageLoad = function (image) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var resizedImageWidth, resizedImageHeight, resizedImageSizeLimit;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.updateCameraUploadProgress("100");
                        resizedImageSizeLimit = 1440;
                        if (image.naturalWidth <= resizedImageSizeLimit && image.naturalHeight <= resizedImageSizeLimit) {
                            resizedImageWidth = image.naturalWidth;
                            resizedImageHeight = image.naturalHeight;
                        }
                        else {
                            if (image.naturalWidth > image.naturalHeight) {
                                resizedImageWidth = resizedImageSizeLimit;
                                resizedImageHeight = Math.round((image.naturalHeight / image.naturalWidth) * resizedImageSizeLimit);
                            }
                            else {
                                resizedImageWidth = Math.round((image.naturalWidth / image.naturalHeight) * resizedImageSizeLimit);
                                resizedImageHeight = resizedImageSizeLimit;
                            }
                        }
                        return [4 /*yield*/, this.cameraUploadFileProcess(image, resizedImageWidth, resizedImageHeight)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BarcodePickerGui.prototype.cameraUploadFileProcess = function (image, width, height) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.videoImageCanvasContext.canvas.width = width;
                        this.videoImageCanvasContext.canvas.height = height;
                        this.videoImageCanvasContext.drawImage(image, 0, 0, width, height);
                        this.scanner.applyImageSettings({
                            width: width,
                            height: height,
                            format: imageSettings_1.ImageSettings.Format.RGBA_8U
                        });
                        this.setCameraUploadGuiAvailable(false);
                        return [4 /*yield*/, this.cameraUploadCallback()];
                    case 1:
                        _a.sent();
                        this.setCameraUploadGuiAvailable(true);
                        return [2 /*return*/];
                }
            });
        });
    };
    BarcodePickerGui.prototype.cameraUploadFile = function () {
        var _this = this;
        var files = this.cameraUploadInputElement.files;
        if (files != null && files.length !== 0) {
            var image_1 = new Image();
            var fileReader_1 = new FileReader();
            fileReader_1.onload = function () {
                _this.cameraUploadInputElement.value = "";
                if (fileReader_1.result != null) {
                    image_1.onload = _this.cameraUploadImageLoad.bind(_this, image_1);
                    image_1.onprogress = function (event2) {
                        if (event2.lengthComputable) {
                            var progress = Math.round((event2.loaded / event2.total) * 20) * 5;
                            if (progress <= 100) {
                                _this.updateCameraUploadProgress(progress.toString());
                            }
                        }
                    };
                    image_1.src = fileReader_1.result;
                }
            };
            this.updateCameraUploadProgress("0");
            fileReader_1.readAsDataURL(files[0]);
        }
    };
    BarcodePickerGui.prototype.setupCameraSwitcher = function () {
        var _this = this;
        this.cameraSwitcherElement.src = base64assets_1.switchCameraImage;
        this.cameraSwitcherElement.className = BarcodePickerGui.cameraSwitcherElementClassName;
        this.cameraSwitcherElement.classList.add(BarcodePickerGui.hiddenClassName);
        this.parentElement.appendChild(this.cameraSwitcherElement);
        ["touchstart", "mousedown"].forEach(function (eventName) {
            _this.cameraSwitcherElement.addEventListener(eventName, function (event) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                var cameraManager_1, cameras, newCameraIndex, error_1;
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!(this.cameraManager != null)) return [3 /*break*/, 4];
                            cameraManager_1 = this.cameraManager;
                            event.preventDefault();
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, cameraAccess_1.CameraAccess.getCameras()];
                        case 2:
                            cameras = _a.sent();
                            newCameraIndex = (cameras.findIndex(function (camera) {
                                return (camera.deviceId ===
                                    (cameraManager_1.activeCamera == null ? camera.deviceId : cameraManager_1.activeCamera.deviceId));
                            }) +
                                1) %
                                cameras.length;
                            cameraManager_1
                                .initializeCameraWithSettings(cameras[newCameraIndex], cameraManager_1.activeCameraSettings)
                                .catch(console.error);
                            return [3 /*break*/, 4];
                        case 3:
                            error_1 = _a.sent();
                            console.error(error_1);
                            return [3 /*break*/, 4];
                        case 4: return [2 /*return*/];
                    }
                });
            }); });
        });
    };
    BarcodePickerGui.prototype.setupTorchToggler = function () {
        var _this = this;
        this.torchTogglerElement.src = base64assets_1.toggleTorchImage;
        this.torchTogglerElement.className = BarcodePickerGui.torchTogglerElementClassName;
        this.torchTogglerElement.classList.add(BarcodePickerGui.hiddenClassName);
        this.parentElement.appendChild(this.torchTogglerElement);
        ["touchstart", "mousedown"].forEach(function (eventName) {
            _this.torchTogglerElement.addEventListener(eventName, function (event) {
                if (_this.cameraManager != null) {
                    event.preventDefault();
                    _this.cameraManager.toggleTorch();
                }
            });
        });
    };
    BarcodePickerGui.prototype.showScanditLogo = function (hideLogo, licenseFeatures) {
        if (hideLogo &&
            licenseFeatures != null &&
            licenseFeatures.hiddenScanditLogoAllowed != null &&
            licenseFeatures.hiddenScanditLogoAllowed) {
            return;
        }
        var scanditLogoImageElement = document.createElement("img");
        scanditLogoImageElement.src = base64assets_1.scanditLogoImage;
        scanditLogoImageElement.className = BarcodePickerGui.scanditLogoImageElementClassName;
        this.parentElement.appendChild(scanditLogoImageElement);
    };
    BarcodePickerGui.prototype.handleNewScanSettings = function () {
        if (this.customLaserArea == null) {
            this.setLaserArea();
        }
        if (this.customViewfinderArea == null) {
            this.setViewfinderArea();
        }
    };
    BarcodePickerGui.prototype.handleVideoResize = function () {
        this.resize();
        if (this.videoImageCanvasContext.canvas.width === this.videoElement.videoWidth &&
            this.videoImageCanvasContext.canvas.height === this.videoElement.videoHeight) {
            return;
        }
        this.videoImageCanvasContext.canvas.width = this.videoElement.videoWidth;
        this.videoImageCanvasContext.canvas.height = this.videoElement.videoHeight;
        this.scanner.applyImageSettings({
            width: this.videoElement.videoWidth,
            height: this.videoElement.videoHeight,
            format: imageSettings_1.ImageSettings.Format.RGBA_8U
        });
    };
    BarcodePickerGui.grandParentElementClassName = "scandit scandit-container";
    BarcodePickerGui.parentElementClassName = "scandit scandit-barcode-picker";
    BarcodePickerGui.hiddenClassName = "scandit-hidden";
    BarcodePickerGui.hiddenOpacityClassName = "scandit-hidden-opacity";
    BarcodePickerGui.videoElementClassName = "scandit-video";
    BarcodePickerGui.scanditLogoImageElementClassName = "sandit";
    BarcodePickerGui.laserContainerElementClassName = "scandit-laser";
    BarcodePickerGui.viewfinderElementClassName = "scandit-viewfinder";
    BarcodePickerGui.cameraSwitcherElementClassName = "scandit-camera-switcher";
    BarcodePickerGui.torchTogglerElementClassName = "scandit-torch-toggle";
    BarcodePickerGui.cameraUploadElementClassName = "scandit-camera-upload";
    BarcodePickerGui.flashColorClassName = "scandit-flash-color";
    BarcodePickerGui.flashWhiteClassName = "scandit-flash-white";
    BarcodePickerGui.flashWhiteInsetClassName = "scandit-flash-white-inset";
    BarcodePickerGui.opacityPulseClassName = "scandit-opacity-pulse";
    BarcodePickerGui.mirroredClassName = "mirrored";
    BarcodePickerGui.pausedClassName = "paused";
    return BarcodePickerGui;
}());
exports.BarcodePickerGui = BarcodePickerGui;
//# sourceMappingURL=barcodePickerGui.js.map