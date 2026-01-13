import {useState} from "react";
import stateSetJSON from "../../../resources/STATE_SETS.json";

interface CommandPayload {
    command: string;
    newState: string;
}

interface SendCommandPanelInterface {
    status: string
    socket: any
}


export default function SendCommandPanel({status, socket}: SendCommandPanelInterface) {
    const [testType, setTestType] = useState("");
    const [batch, setBatch] = useState("");
    const [command, setCommand] = useState("");
    const [lastStateCommandSent, setLastStateCommandSent] = useState("UNKNOWN");


    // 🧠 Derived data based on selections
    const selectedTestType = stateSetJSON.find((set) => set.name === testType);
    const availableBatches = selectedTestType?.batches ?? [];
    const selectedBatch = availableBatches.find((b) => b.name === batch);
    const availableCommands = selectedBatch?.commands ?? [];

    // 🔁 WebSocket setup


    const handleSendStateCommand = () => {
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            console.warn("WebSocket not connected. Unable to send command.");
            return;
        }

        const payload: CommandPayload = {
            command: "SET_STATE",
            newState: command
        };

        socket.send(JSON.stringify(payload));
        setLastStateCommandSent(new Date().toLocaleTimeString());
        console.log("📤 Sent command:", payload);
    };

    return (
        <div className="command-panel">
            <div style={{
                display: "flex",
                flexDirection: "row",
            }}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "flex-start",
                        alignItems: "center",
                        marginLeft: "10px",
                        marginRight: "10px",
                        gap: "10px",
                    }}
                >
                    {/* --- Test Type --- */}
                    <div className="select-wrapper">
                        <select
                            value={testType}
                            onChange={(e) => {
                                setTestType(e.target.value);
                                setBatch("");
                                setCommand("");
                            }}
                        >
                            <option value="">-- Select Test Type --</option>
                            {stateSetJSON.map((set) => (
                                <option key={set.name} value={set.name}>
                                    {set.name}
                                </option>
                            ))}
                        </select>
                        <span className="custom-arrow">▼</span>
                    </div>

                    {/* --- Batch --- */}
                    <div className="select-wrapper">
                        <select
                            value={batch}
                            onChange={(e) => {
                                setBatch(e.target.value);
                                setCommand("");
                            }}
                            disabled={!testType}
                        >
                            <option value="">-- Select Batch --</option>
                            {availableBatches.map((b) => (
                                <option key={b.name} value={b.name}>
                                    {b.name}
                                </option>
                            ))}
                        </select>
                        <span className="custom-arrow">▼</span>
                    </div>

                    {/* --- Command --- */}
                    <div className="select-wrapper">
                        <select
                            value={command}
                            onChange={(e) => setCommand(e.target.value)}
                            disabled={!batch}
                        >
                            <option value="">-- Select Command --</option>
                            {availableCommands.map((cmd) => (
                                <option key={cmd.value} value={cmd.value}>
                                    {cmd.name}
                                </option>
                            ))}
                        </select>
                        <span className="custom-arrow">▼</span>
                    </div>
                </div>


                <div style={{
                    display: "flex",
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    marginLeft: "10px",
                    marginRight: "10px"
                }}>
                    <p>Last Sent: {lastStateCommandSent}</p>
                </div>

                <div style={{
                    display: "flex",
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    marginLeft: "10px",
                    marginRight: "10px"
                }}>
                    <button className="importantBtn" onClick={handleSendStateCommand}>
                        SEND COMMAND
                    </button>
                </div>
            </div>

            <div style={{
                display: "flex", flexDirection: "row"
            }}>

                <div style={{
                    flex: 1,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    marginLeft: "10px",
                    marginRight: "10px"
                }}>
            <pre
                style={{
                    maxHeight: "150px",
                    overflow: "auto",
                    background: "#eee",
                    padding: "8px",

                }}
            >
                WebSocket: {status}
            </pre>
                </div>
            </div>
        </div>
    );
}
