import {saveAs} from 'file-saver';
import React, {FormEvent, useEffect, useRef, useState} from "react";
import {BrowserQRCodeReader, IScannerControls} from "@zxing/browser";
import {Result} from "@zxing/library";
import Link from 'next/link';

import Card from "./Card";
import Alert from "./Alert";
import Check from './Check';
import {PayloadBody} from "../src/payload";
import {getPayloadBodyFromFile, getPayloadBodyFromQR} from "../src/process";
import {PassData} from "../src/pass";
import {COLORS} from "../src/colors";
import Colors from './Colors';

function Form(): JSX.Element {

    // Whether camera is open or not
    const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);

    // Currently selected color
    const [selectedColor, setSelectedColor] = useState<COLORS>(COLORS.WHITE);

    // Global camera controls
    const [globalControls, setGlobalControls] = useState<IScannerControls>(undefined);

    // Currently selected QR Code / File. Only one of them is set.
    const [qrCode, setQrCode] = useState<Result>(undefined);
    const [file, setFile] = useState<File>(undefined);

    const [errorMessage, _setErrorMessage] = useState<string>(undefined);
    const [loading, setLoading] = useState<boolean>(false);

    // Check if there is a translation and replace message accordingly
    const setErrorMessage = (message: string) => {
        if (message == undefined) {
            _setErrorMessage(undefined);
            return;
        }

        const translation = message;
        _setErrorMessage(translation !== message ? translation : message);
    };

    // File Input ref
    const inputFile = useRef<HTMLInputElement>(undefined)

    // Add event listener to listen for file change events
    useEffect(() => {
        if (inputFile && inputFile.current) {
            inputFile.current.addEventListener('input', () => {
                let selectedFile = inputFile.current.files[0];
                if (selectedFile !== undefined) {
                    setQrCode(undefined);
                    setFile(selectedFile);
                }
            });
        }
    }, [inputFile])

    // Show file Dialog
    async function showFileDialog() {
        inputFile.current.click();
    }

    // Hide camera view
    async function hideCameraView() {
        if (globalControls !== undefined) {
            globalControls.stop();
        }
        setIsCameraOpen(false);
    }

    // Show camera view
    async function showCameraView() {
        // Create new QR Code Reader
        const codeReader = new BrowserQRCodeReader();

        // Needs to be called before any camera can be accessed
        let deviceList: MediaDeviceInfo[];

        try {
            deviceList = await BrowserQRCodeReader.listVideoInputDevices();
        } catch (e) {
            setErrorMessage('noCameraAccess');
            return;
        }

        // Check if camera device is present
        if (deviceList.length == 0) {
            setErrorMessage("noCameraFound");
            return;
        }

        // Get preview Element to show camera stream
        const previewElem: HTMLVideoElement = document.querySelector('#cameraPreview');

        // Set Global controls
        setGlobalControls(
            // Start decoding from video device
            await codeReader.decodeFromVideoDevice(undefined,
                previewElem,
                (result, error, controls) => {
                    if (result !== undefined) {
                        setQrCode(result);
                        setFile(undefined);

                        controls.stop();

                        // Reset
                        setGlobalControls(undefined);
                        setIsCameraOpen(false);
                    }
                    if (error !== undefined) {
                        setErrorMessage(error.message);
                    }
                }
            )
        );

        setIsCameraOpen(true);
    }

    // Add Pass to wallet
    async function addToWallet(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);

        if (navigator.userAgent.match('CriOS')) {
            setErrorMessage('safariSupportOnly');
            setLoading(false);
            return;
        }

        if (!file && !qrCode) {
            setErrorMessage('noFileOrQrCode')
            setLoading(false);
            return;
        }

        const color = selectedColor;
        let payloadBody: PayloadBody;

        try {
            if (file) {
                payloadBody = await getPayloadBodyFromFile(file, color);
            } else {
                payloadBody = await getPayloadBodyFromQR(qrCode, color);
            }

            let pass = await PassData.generatePass(payloadBody);

            const passBlob = new Blob([pass], {type: "application/vnd.apple.pkpass"});
            saveAs(passBlob, 'covid.pkpass');
            setLoading(false);
        } catch (e) {
            setErrorMessage(e.message);
            setLoading(false);
        }
    }

    return (
        <div>
            <form className="space-y-5" id="form" onSubmit={addToWallet}>
                <Card step="1" heading="Select Certificate" content={
                    <div className="space-y-5">
                        <p>Please scan the QR code on your certificate or select a screenshot or PDF page with the QR code. 
  Note that selecting a file directly from camera is not supported.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <button
                                type="button"
                                onClick={isCameraOpen ? hideCameraView : showCameraView}
                                className="focus:outline-none h-20 bg-gray-500 hover:bg-gray-700 text-white font-semibold rounded-md">
                                {isCameraOpen ? "Stop Camera" : "Start Camera"}
                            </button>
                            <button
                                type="button"
                                onClick={showFileDialog}
                                className="focus:outline-none h-20 bg-gray-500 hover:bg-gray-700 text-white font-semibold rounded-md">
                                    Select File
                            </button>
                        </div>

                        <video id="cameraPreview"
                               className={`${isCameraOpen ? undefined : "hidden"} rounded-md w-full`}/>
                        <input type='file'
                               id='file'
                               accept="application/pdf,image/png"
                               ref={inputFile}
                               style={{display: 'none'}}
                        />

                        {(qrCode || file) &&
                        <div className="flex items-center space-x-1">
                            <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24"
                                 stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                            </svg>
                            <span className="w-full truncate">
                                {
                                    qrCode && "Found QR Code!"
                                }
                                {
                                    file && file.name
                                }
                            </span>
                        </div>
                        }
                    </div>
                }/>
                <Card step="2" heading="Pick a Color" content={
                    <div className="space-y-5">
                        <p>Pick a background color for your pass.</p>
                        <div className="relative inline-block w-full">
                            <Colors onChange={setSelectedColor} initialValue={selectedColor}/>
                        </div>
                    </div>
                }/>
                <Card step="3" heading="Add to Wallet" content={
                    <div className="space-y-5">
                        <p>
                        Data privacy is of special importance when processing health-related data. 
  In order for you to make an informed decision, please read the
                            <Link href="/privacy">
                                <a>
                                Privacy Policy
                                </a>
                            </Link>.
                        </p>
                        <div>
                            <ul className="list-none">
                                <Check text="Created on your device"/>
                                <Check text="Open source and transparent"/>
                                <Check text="Hosted in the EU"/>
                            </ul>
                        </div>
                        <label htmlFor="privacy" className="flex flex-row space-x-4 items-center pb-2">
                            <input type="checkbox" id="privacy" value="privacy" required className="h-5 w-5 outline-none"/>
                            <p>
                            I accept the&nbsp;
                                <Link href="/privacy">
                                    <a className="underline">
                                    Privacy Policy
                                    </a>
                                </Link>.
                            </p>
                        </label>
                        <div className="flex flex-row items-center justify-start">
                            <button id="download" type="submit"
                                    className="focus:outline-none bg-green-600 py-2 px-3 text-white font-semibold rounded-md disabled:bg-gray-400">
                                Add to Wallet
                            </button>
                            <div id="spin" className={loading ? undefined : "hidden"}>
                                <svg className="animate-spin h-5 w-5 ml-4" viewBox="0 0 24 24">
                                    <circle className="opacity-0" cx="12" cy="12" r="10" stroke="currentColor"
                                            strokeWidth="4"/>
                                    <path className="opacity-75" fill="currentColor"
                                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                                </svg>
                            </div>
                        </div>
                    </div>
                }/>
            </form>
            <canvas id="canvas" style={{display: "none"}}/>
            {
                errorMessage && <Alert errorMessage={errorMessage} onClose={() => setErrorMessage(undefined)}/>
            }
        </div>
    )
}

export default Form;