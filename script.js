// ==========================================
// HOSPITAL REPORT TRANSFER VALIDATOR
// JavaScript frontend + Python Flask CRC-32
// ==========================================


// ==========================================
// GLOBAL VARIABLES
// ==========================================

let senderFile = null;
let receiverFile = null;

let referenceCRC = null;
let currentCRC = null;


// ==========================================
// GET HTML ELEMENTS
// ==========================================

const fileInput = document.getElementById("senderFile");

const senderInfo = document.getElementById("senderInfo");
const senderName = document.getElementById("senderName");
const senderSize = document.getElementById("senderSize");
const senderType = document.getElementById("senderType");

const receiverInfo = document.getElementById("receiverInfo");
const receiverName = document.getElementById("receiverName");
const receiverSize = document.getElementById("receiverSize");
const receiverType = document.getElementById("receiverType");

const referenceCRCElement =
    document.getElementById("referenceCRC");

const currentCRCElement =
    document.getElementById("currentCRC");

const transferStatus =
    document.getElementById("transferStatus");

const verificationResult =
    document.getElementById("verificationResult");

const saveButton =
    document.getElementById("saveButton");

const simulateError =
    document.getElementById("simulateError");

const errorControls =
    document.getElementById("errorControls");

const errorRate =
    document.getElementById("errorRate");

const errorValue =
    document.getElementById("errorValue");

const receiverPlaceholder =
    document.getElementById("receiverPlaceholder");


// ==========================================
// FILE SELECTED
// ==========================================

fileInput.addEventListener("change", function () {

    senderFile = this.files[0];

    if (!senderFile) {
        return;
    }

    // Display sender information
    senderInfo.style.display = "block";

    senderName.textContent = senderFile.name;

    senderSize.textContent =
        formatFileSize(senderFile.size);

    senderType.textContent =
        senderFile.type || "Unknown";

    // Reset CRC values
    referenceCRC = null;
    currentCRC = null;

    referenceCRCElement.textContent =
        "Not generated";

    currentCRCElement.textContent =
        "Not calculated";

    verificationResult.style.display = "none";

    saveButton.disabled = true;

    // Update status
    setStatus(
        "🔵 File selected — Generate CRC-32",
        "status-ready"
    );
});


// ==========================================
// FORMAT FILE SIZE
// ==========================================

function formatFileSize(bytes) {

    if (bytes === 0) {
        return "0 Bytes";
    }

    const units = [
        "Bytes",
        "KB",
        "MB",
        "GB"
    ];

    const index =
        Math.floor(
            Math.log(bytes) / Math.log(1024)
        );

    return (
        (bytes / Math.pow(1024, index))
            .toFixed(2)
        + " "
        + units[index]
    );
}


// ==========================================
// SET TRANSFER STATUS
// ==========================================

function setStatus(message, statusClass) {

    transferStatus.textContent = message;

    transferStatus.className =
        "status-text " + statusClass;
}


// ==========================================
// GENERATE REFERENCE CRC-32
// ==========================================

async function generateCRC() {

    if (!senderFile) {

        alert("Please select a hospital report first.");

        return;
    }

    setStatus(
        "⏳ Calculating CRC-32 using Python...",
        "status-ready"
    );

    try {

        const formData = new FormData();

        formData.append("file", senderFile);


        // Send file to Python Flask
        const response =
            await fetch("/calculate_crc32", {

                method: "POST",

                body: formData

            });


        const data =
            await response.json();


        if (!data.success) {

            alert(
                "CRC calculation failed: "
                + data.error
            );

            setStatus(
                "🔴 CRC calculation failed",
                "status-error"
            );

            return;
        }


        // Receive CRC from Python
        referenceCRC = data.crc32;


        // Display CRC
        referenceCRCElement.textContent =
            referenceCRC;


        setStatus(
            "🟢 Reference CRC-32 generated",
            "status-success"
        );

    }

    catch (error) {

        console.error(error);

        alert(
            "Could not connect to Python Flask server."
        );

        setStatus(
            "🔴 Backend connection error",
            "status-error"
        );
    }
}


// ==========================================
// TRANSFER FILE TO RECEIVER
// ==========================================

function transferFile() {

    if (!senderFile) {

        alert("Please select a file first.");

        return;
    }


    if (!referenceCRC) {

        alert(
            "Please generate the Reference CRC-32 first."
        );

        return;
    }


    // Create a copy of the file
    const fileReader =
        new FileReader();


    fileReader.onload = function () {

        const originalData =
            new Uint8Array(
                fileReader.result
            );


        // Copy original data
        let transferredData =
            new Uint8Array(originalData);


        // Check error simulation
        if (simulateError.checked) {

            transferredData =
                simulateTransmissionError(
                    transferredData
                );
        }


        // Create received file
        receiverFile =
            new File(
                [transferredData],
                senderFile.name,
                {
                    type: senderFile.type
                }
            );


        // Display receiver information
        receiverInfo.style.display =
            "block";


        receiverName.textContent =
            receiverFile.name;


        receiverSize.textContent =
            formatFileSize(
                receiverFile.size
            );


        receiverType.textContent =
            receiverFile.type || "Unknown";


        receiverPlaceholder.style.display =
            "none";


        // Reset current CRC
        currentCRC = null;

        currentCRCElement.textContent =
            "Not calculated";


        verificationResult.style.display =
            "none";


        saveButton.disabled = true;


        setStatus(
            "🟣 File transferred — Calculate Current CRC-32",
            "status-transfer"
        );


        alert(
            "File successfully transferred to Receiver."
        );
    };


    fileReader.readAsArrayBuffer(senderFile);
}


// ==========================================
// ERROR SIMULATION
// ==========================================

function simulateTransmissionError(data) {

    const percentage =
        parseInt(errorRate.value);


    const numberOfBytes =
        Math.max(
            1,
            Math.floor(
                data.length *
                percentage /
                100
            )
        );


    const corruptedData =
        new Uint8Array(data);


    for (
        let i = 0;
        i < numberOfBytes;
        i++
    ) {

        const randomIndex =
            Math.floor(
                Math.random() *
                corruptedData.length
            );


        // Change one byte
        corruptedData[randomIndex] =
            corruptedData[randomIndex] ^ 0xFF;
    }


    return corruptedData;
}


// ==========================================
// UPDATE ERROR SIMULATION
// ==========================================

function updateSimulation() {

    if (simulateError.checked) {

        errorControls.style.display =
            "block";

    }

    else {

        errorControls.style.display =
            "none";
    }
}


// ==========================================
// UPDATE ERROR SLIDER VALUE
// ==========================================

function updateErrorValue() {

    errorValue.textContent =
        errorRate.value + "%";
}


// ==========================================
// CALCULATE CURRENT CRC-32
// ==========================================

async function calculateCurrentCRC() {

    if (!receiverFile) {

        alert(
            "Please transfer a file to the Receiver first."
        );

        return;
    }


    setStatus(
        "⏳ Calculating Current CRC-32 using Python...",
        "status-ready"
    );


    try {

        const formData =
            new FormData();


        formData.append(
            "file",
            receiverFile
        );


        // Send RECEIVED file to Python
        const response =
            await fetch(
                "/calculate_crc32",
                {
                    method: "POST",
                    body: formData
                }
            );


        const data =
            await response.json();


        if (!data.success) {

            alert(
                "CRC calculation failed: "
                + data.error
            );

            setStatus(
                "🔴 CRC calculation failed",
                "status-error"
            );

            return;
        }


        // Receive CRC from Python
        currentCRC =
            data.crc32;


        // Display current CRC
        currentCRCElement.textContent =
            currentCRC;


        setStatus(
            "🟢 Current CRC-32 calculated",
            "status-success"
        );

    }

    catch (error) {

        console.error(error);

        alert(
            "Could not connect to Python Flask server."
        );

        setStatus(
            "🔴 Backend connection error",
            "status-error"
        );
    }
}


// ==========================================
// VERIFY FILE
// ==========================================

function verifyFile() {

    if (!referenceCRC) {

        alert(
            "Please generate the Reference CRC-32 first."
        );

        return;
    }


    if (!receiverFile) {

        alert(
            "Please transfer the file first."
        );

        return;
    }


    if (!currentCRC) {

        alert(
            "Please calculate the Current CRC-32 first."
        );

        return;
    }


    // Compare CRC values
    if (
        referenceCRC.toUpperCase() ===
        currentCRC.toUpperCase()
    ) {

        // VALID
        verificationResult.className =
            "result valid";

        verificationResult.innerHTML =
            "✅ REPORT VALID<br>" +
            "<small>" +
            "CRC-32 values match. " +
            "No transmission error detected." +
            "</small>";


        saveButton.disabled = false;


        setStatus(
            "🟢 Report verified — VALID",
            "status-success"
        );

    }

    else {

        // CORRUPTED
        verificationResult.className =
            "result invalid";

        verificationResult.innerHTML =
            "❌ ERROR DETECTED — REPORT CORRUPTED<br>" +
            "<small>" +
            "CRC-32 values do not match." +
            "</small>";


        saveButton.disabled = true;


        setStatus(
            "🔴 Error detected — Report corrupted",
            "status-error"
        );
    }
}


// ==========================================
// SAVE RECEIVED FILE
// ==========================================

function saveFile() {

    if (!receiverFile) {

        alert("No received file available.");

        return;
    }


    if (!currentCRC) {

        alert(
            "Please calculate the Current CRC-32 first."
        );

        return;
    }


    if (
        referenceCRC.toUpperCase() !==
        currentCRC.toUpperCase()
    ) {

        alert(
            "File cannot be saved because verification failed."
        );

        return;
    }


    // Create download URL
    const url =
        URL.createObjectURL(receiverFile);


    const link =
        document.createElement("a");


    link.href = url;

    link.download =
        receiverFile.name;


    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);


    URL.revokeObjectURL(url);
}