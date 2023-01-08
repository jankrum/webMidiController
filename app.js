function success(midi) {
    let selectMidiIn = document.querySelector("#midiIn");
    let selectMidiOut = document.querySelector("#midiOut");

    let buttonApply = document.querySelector("button");

    let inputs = midi.inputs;
    let outputs = midi.outputs;

    loadSelect(selectMidiIn, inputs);
    loadSelect(selectMidiOut, outputs);

    if (inputs.size === 0 || outputs.size === 0) {
        buttonApply.disabled = true;
    }
}

function loadSelect(selectElement, midiMap) {
    if (midiMap.size === 0) {
        const option = document.createElement("option");
        option.text = "No Options";
        selectElement.add(option);
        selectElement.disabled = true;
    } else {
        for (let item of midiMap) {
            const option = document.createElement("option");
            option.text = item[1].name;
            selectElement.add(option);
        }
    }
}

if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess()
        .then(success, alert);
}