// Example SYSEX message: [0xF0, 0x01, 0x09, 0x54, 0x65, 0x6D, 0x70, 0x6F, 0x3A, 0x20, 0x00, 0x34, 0x30, 0x3A, 0x32, 0x32, 0x30, 0xF7]

function buildController() {
    const moduleCount = 12

    const caseDiv = document.querySelector(".case");
    const originalModule = caseDiv.querySelector("#module1");

    for (let i = 2; i <= moduleCount; i++) {
        const cloneModule = originalModule.cloneNode(true);
        const cloneLabel = cloneModule.querySelector("label");
        const cloneRange = cloneModule.querySelector("input");
        cloneModule.setAttribute("id", `module${i}`)
        cloneLabel.setAttribute("for", `pot${i}`)
        cloneRange.setAttribute("id", `pot${i}`)

        caseDiv.appendChild(cloneModule)
    }
}

async function getMidi() {
    function populateSelect(midiMap, selectID) {
        const applyButtonID = "#apply"

        const select = document.querySelector(selectID);
        const applyButton = document.querySelector(applyButtonID)

        if (midiMap.size > 0) {
            for (const [key, element] of midiMap) {
                const connectionOption = document.createElement("option");
                connectionOption.text = element.name;
                connectionOption.value = key;
                select.appendChild(connectionOption)
            }
        } else {
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

async function useMidi() {
    function getSelectValue(selectID) {
        const select = document.querySelector(selectID);
        const connectionIndex = select.selectedIndex;
        const connectionValue = select.options[connectionIndex].value;
        return connectionValue
    }

    const midi = await navigator.requestMIDIAccess({ sysex: true });

    const caseDiv = document.querySelector(".case");

    let input = midi.inputs.get(getSelectValue("#midiIn"));
    let output = midi.outputs.get(getSelectValue("#midiOut"));

    document.querySelector(".connectionManager").style.display = "none";
    document.querySelector("hr").style.display = "none";

    caseDiv.style.display = "block";

    input.onmidimessage = e => {
        if (e.data[0] === 0xF0 && e.data[1] === 0x01) {
            const controllerAddress = e.data[2];
            const moduleID = `#module${controllerAddress}`;
            const module = document.querySelector(moduleID);

            if (module === null) {
                console.log(`Controller Address ${controllerAddress} not found:(`)
                return;
            }

            const label = module.querySelector("label");

            const messageBytes = e.data.slice(3, -1);

            const endOfStaticLabel = messageBytes.indexOf(0x00);
            const staticLabelBytes = messageBytes.slice(0, endOfStaticLabel);
            const staticLabel = String.fromCharCode(...staticLabelBytes);

            label.innerHTML = staticLabel;

            const startOfDynamicLabel = messageBytes.indexOf(0x00) + 1;
            const dynamicLabelBytes = messageBytes.slice(startOfDynamicLabel);
            const dynamicLabel = String.fromCharCode(...dynamicLabelBytes);
            console.log(dynamicLabel)
        }
    }
}

window.addEventListener("load", buildController)
window.addEventListener("load", getMidi)
document.querySelector("#apply").addEventListener("click", useMidi)
