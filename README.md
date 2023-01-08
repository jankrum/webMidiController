# webMidiController
A web implementation of a midi contoller with labels 

YOU MUST LAUNCH LOOPMIDI OR CONNECT MIDI DEVICES PRIOR TO OPENING THIS PAGE

Connect to a midi input and midi output port/device, the labels should auto-populate
Turning a knob will send out midi cc messages that will map to instructions

# Example SYSEX message
[0xF0, 0x01, 0xF2, 0x54, 0x65, 0x6D, 0x70, 0x6F, 0x3A, 0x20, 0x00, 0x34, 0x30, 0x3A, 0x32, 0x32, 0x30, 0xF7]
   SB,  DID,   CA,  "T",  "e",  "m",  "p",  "o",  ":",  " ",  EOS,  "4",  "0",  ":",  "2",  "2",  "0",  EOE

# Defining a control
After the handshake has occured, the sequencer will send SYSEX according to this format:
-SYSEX Status Byte:    0xF0
-100% Legit Device ID: 0x01         // I'm sorry Dave
-Controller Address:   0b0nnn nnnn  // Allows for up to 128 controllers
-ASCII char for label: 0b0nnn nnnn  // Repeat for every char of static label
-End of label message: 0x00         // Terminates static label
-ASCII char for label: 0b0nnn nnnn  // Repeat for every char of min-max or dynamic label
-End of exclusive:     0xF7
SYSEX is parsed according to this:
-Check to see if it is our ID (if it is not, we stop caring)
-Read controller address use it to index controller state in array
-Read following messages into string buffer until null char (then we use string buffer to overwrite controller's static label)
-Read following messages into string buffer until end of ex ()
When a knob is turned, its rotation is read in through an 8-bit ADC. The teensy reads the value and computes its new value according
