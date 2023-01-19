const DEVICE_ID = 0x01;
const LOOPBACK_CALL_REQUEST = [0xF3, 0];
const LOOPBACK_CALL = [0xF3, 1];

function buildController() {  // Builds multiple modules of the midi controller, based on the one already in the document
    const moduleCount = 12

    const caseDiv = document.querySelector(".case");
    const originalModule = caseDiv.querySelector("#module1");

    for (let i = 2; i <= moduleCount; i++) {
        const cloneModule = originalModule.cloneNode(true);  // Clone the module that already exists
        const cloneLabel = cloneModule.querySelector("label");  // Grab the clone's label
        const cloneRange = cloneModule.querySelector("input");  // Grab the clone's range input
        cloneModule.setAttribute("id", `module${i}`)  // Rewrite the module's id
        cloneLabel.setAttribute("for", `pot${i}`)  // Rewrite the label's for
        cloneRange.setAttribute("id", `pot${i}`)  // Rewrite the range input's id

        caseDiv.appendChild(cloneModule)  // Add the new module to the case
    }
}


async function getMidiPorts() {  // Populates the input and output select elements
    function populateSelect(midiMap, selectID) {  // Populates a single select
        const select = document.querySelector(selectID);
        const applyButton = document.querySelector("#apply")

        if (midiMap.size > 0) {  // If there is something to connect to
            for (const [key, element] of midiMap) {  // Key is used by the webmidi api, element is read by humans
                const connectionOption = document.createElement("option");
                connectionOption.text = element.name;
                connectionOption.value = key;
                select.appendChild(connectionOption)
            }
        } else {  // If there was nothing to connect to
            const connectionOption = document.createElement("option");
            connectionOption.text = "No Devices";
            select.appendChild(connectionOption)
            select.disabled = true;

            applyButton.disabled = true;
        }
    }

    const inputID = "#midiIn";
    const outputID = "#midiOut";

    const midi = await navigator.requestMIDIAccess();

    populateSelect(midi.inputs, inputID)
    populateSelect(midi.outputs, outputID)
}


async function useMidi() {  // Adds functionality to the midi controller
    function getSelectValue(selectID) {  // Returns the value of the option selected in the select element
        const select = document.querySelector(selectID);
        const connectionIndex = select.selectedIndex;
        const connectionValue = select.options[connectionIndex].value;
        return connectionValue
    }

    const midi = await navigator.requestMIDIAccess({ sysex: true });  // Midi access object with SYSEX enabled

    const caseDiv = document.querySelector(".case");

    let input = midi.inputs.get(getSelectValue("#midiIn"));
    let output = midi.outputs.get(getSelectValue("#midiOut"));

    document.querySelector(".connectionManager").style.display = "none";  // Hides the connection manager
    document.querySelector("hr").style.display = "none";
    caseDiv.style.display = "block";  // Make the controller visible

    input.onmidimessage = e => {  // Callback that handles midi input messages
        function sysexMessage(message) {  // Function that reads sysex messages as a label
            
            const controllerAddress = e.data[2];  // Extracts the address of the module to be edited from the message
            const moduleID = `#module${controllerAddress}`;  // The id of the module
            const module = document.querySelector(moduleID);  // The module itself

            if (module === null) {  // If we couldn't find it, we tell the user
                console.log(`Controller Address ${controllerAddress} not found`)
                return;
            }

            const label = module.querySelector("label");  // Selects the child label of the module
            const range = module.querySelector("input");  // Selects the child input of the module

            const labelBytes = e.data.slice(3, -1);  // Removes the status byte, device id, controller address, and EOE from the message

            const endOfStaticLabel = labelBytes.indexOf(0x00);  // The index representing the end of the static label
            const staticLabelBytes = labelBytes.slice(0, endOfStaticLabel);  // The string of ascii bytes representing the static label
            const staticLabel = String.fromCharCode(...staticLabelBytes);  // The actual text of the static label

            const dynamicLabelBytes = labelBytes.slice(endOfStaticLabel + 1);  // The string of ascii bytes representing the dynamic label
            const dynamicLabel = String.fromCharCode(...dynamicLabelBytes);  // The actual text of the dynamic label

            const colonIndex = dynamicLabel.indexOf(":");  // The index of the colon inside the dynamic label
            const min = parseInt(dynamicLabel.slice(0, colonIndex));  // An int from the text before the colon in the dynamic label
            const max = parseInt(dynamicLabel.slice(colonIndex + 1));  // An int from the text after the colon in the dynamic label

            function changeRange() {
                const regionCount = 1 + max - min;  // The number of regions in the dynamic label
                const regionSize = 128 / regionCount;  // The size of each region if they had to share 128 positions
                const regionsBelow = Math.round(range.value / regionSize);  // The number of regions below the current value of the range
                const adjustedValue = regionsBelow + min;  // The final calculated value of the dynamic label
                label.innerHTML = staticLabel + adjustedValue;  // Write the static and dynamic labels to the label object
            }
            
            changeRange()

            range.addEventListener("input", changeRange)
        }

        switch (e.data[0]) {  // Switch-case for handling midi-in events
            case 0xF0:  // SYSEX
                if (e.data[1] === DEVICE_ID) {  // If it was for us
                    sysexMessage(e.data)  // Read the contents into the label for a controller module
                }
                break;
            case LOOPBACK_CALL[0]:  // If it was a loop call
                console.log("PASSING LOOP CALL")
                output.send(LOOPBACK_CALL)  // respond with loop call
                break;
        }
    }

    output.send(LOOPBACK_CALL_REQUEST)  // Transmit loop call request
}


window.addEventListener("load", buildController)  // Build the controller on load
window.addEventListener("load", getMidiPorts)  // Put the midi ports in the selects on load
document.querySelector("#apply").addEventListener("click", useMidi)  // Enable controller when apply is clicked
