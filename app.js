async function getMidi() {
    const inputSelect = document.querySelector("#midiIn")
    const outputSelect = document.querySelector("#midiOut")

    const applyButton = document.querySelector("#apply")

    const midi = await navigator.requestMIDIAccess();

    for (const [key, input] of midi.inputs) {
        const connectionOption = document.createElement("option");
        connectionOption.text = input.name
        connectionOption.value = key
        inputSelect.appendChild(connectionOption)
    }

    for (const [key, output] of midi.outputs) {
        const connectionOption = document.createElement("option");
        connectionOption.text = output.name
        connectionOption.value = key
        outputSelect.appendChild(connectionOption)
    }

    if (midi.inputs.size < 1 || midi.outputs.size < 1) {
        applyButton.disabled = true;
    }
}

async function useMidi() {
    const midi = await navigator.requestMIDIAccess();

    const inputSelect = document.querySelector("#midiIn")
    const outputSelect = document.querySelector("#midiOut")

    // const connectionManager = document.querySelector(".connectionManager")
    const caseDiv = document.querySelector(".case")

    console.log(inputSelect.options[inputSelect.selectedIndex].value)
    let input = midi.inputs.get(inputSelect.options[inputSelect.selectedIndex].value)

    console.log(outputSelect.options[outputSelect.selectedIndex].value)
    let output = midi.outputs.get(outputSelect.options[outputSelect.selectedIndex].value)

    // connectionManager.style.display = "none"
    // document.querySelector("hr").style.display = "none"
    caseDiv.style.display = "block"

    input.onmidimessage = e => {
        const noteOnMessage = [0x90, 60, 0x7F]
        const noteOffMessage = [0x80, 60, 0x00]

        if (e.data[0] === 0x90) {
            output.send(noteOnMessage)
        }
        else if (e.data[0] === 0x80) {
            output.send(noteOffMessage)
        }
    }
}

window.addEventListener("load", getMidi)
document.querySelector("#apply").addEventListener("click", useMidi)
