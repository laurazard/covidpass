import {toBuffer as createZip} from 'do-not-zip';
import {v4 as uuid4} from 'uuid';

import {Constants} from "./constants";
import {Payload, PayloadBody, PassDictionary} from "./payload";
import {ValueSets} from "./value_sets";

const crypto = require('crypto')

enum QrFormat {
    PKBarcodeFormatQR = 'PKBarcodeFormatQR',
}

enum Encoding {
    utf8 = "utf-8",
}

interface QrCode {
    message: string;
    format: QrFormat;
    messageEncoding: Encoding;
}

interface SignData {
    PassJsonHash: string;
    useBlackVersion: boolean;
}

export class PassData {
    passTypeIdentifier: string = Constants.PASS_IDENTIFIER;
    teamIdentifier: string = Constants.TEAM_IDENTIFIER;
    sharingProhibited: boolean = false;
    voided: boolean = false;
    formatVersion: number = 1;
    logoText: string = Constants.NAME;
    organizationName: string = Constants.NAME;
    description: string = Constants.NAME;
    labelColor: string;
    foregroundColor: string;
    backgroundColor: string;
    serialNumber: string;
    barcodes: Array<QrCode>;
    barcode: QrCode;
    generic: PassDictionary;

    // Generates a sha1 hash from a given buffer
    private static getBufferHash(buffer: Buffer | string): string {
        const sha = crypto.createHash('sha1');
        sha.update(buffer);
        return sha.digest('hex');
    }

    private static async signWithRemote(signData: SignData): Promise<ArrayBuffer> {
        // Load API_BASE_URL form nextjs backend
        const apiBaseUrl = "https://covidpass-api.herokuapp.com"

        const response = await fetch(`${apiBaseUrl}/sign`, {
            method: 'POST',
            headers: {
                'Accept': 'application/octet-stream',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(signData)
        })

        if (response.status !== 200) {
            throw Error('signatureFailed')
        }

        return await response.arrayBuffer()
    }

    static async generatePass(payloadBody: PayloadBody): Promise<Buffer> {
        // Get the Value Sets from GitHub
        const valueSets: ValueSets = await ValueSets.loadValueSets();

        // Create Payload
        const payload: Payload = new Payload(payloadBody, valueSets);

        // Create QR Code Object
        const qrCode: QrCode = {
            message: payload.rawData,
            format: QrFormat.PKBarcodeFormatQR,
            messageEncoding: Encoding.utf8,
        }

        // Create pass data
        const pass: PassData = new PassData(payload, qrCode);

        // Create new zip
        const zip = [] as { path: string; data: Buffer | string }[];

        // Adding required fields

        // Create pass.json
        const passJson = JSON.stringify(pass);

        // Add pass.json to zip
        zip.push({path: 'pass.json', data: Buffer.from(passJson)});

        // Add Images to zip
        zip.push({path: 'icon.png', data: payload.img1x})
        zip.push({path: 'icon@2x.png', data: payload.img2x})
        zip.push({path: 'logo.png', data: payload.img1x})
        zip.push({path: 'logo@2x.png', data: payload.img2x})

        // Adding manifest
        // Construct manifest
        const manifestJson = JSON.stringify(
            zip.reduce(
                (res, {path, data}) => {
                    res[path] = PassData.getBufferHash(data);
                    return res;
                },
                {},
            ),
        );

        // Add Manifest JSON to zip
        zip.push({path: 'manifest.json', data: Buffer.from(manifestJson)});

        // Create pass hash
        const passHash = PassData.getBufferHash(Buffer.from(passJson));

        // Sign hash with server
        const manifestSignature = await PassData.signWithRemote({
            PassJsonHash: passHash,
            useBlackVersion: !payload.dark,
        });

        // Add signature to zip
        zip.push({path: 'signature', data: Buffer.from(manifestSignature)});

        return createZip(zip);
    }

    private constructor(payload: Payload, qrCode: QrCode) {
        this.labelColor = payload.labelColor;
        this.foregroundColor = payload.foregroundColor;
        this.backgroundColor = payload.backgroundColor;
        this.serialNumber = uuid4(); // Generate random UUID v4
        this.barcodes = [qrCode];
        this.barcode = qrCode;
        this.generic = payload.generic;
    }
}
