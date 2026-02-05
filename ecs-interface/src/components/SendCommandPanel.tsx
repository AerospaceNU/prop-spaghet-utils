import {useState} from "react";
import stateSetJSON from "../../../resources/STATE_SETS.json";
import CreateSequenceModal, {type Command} from "./CreateSequenceModal.tsx";

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
    const [showModal, setShowModal] = useState(false);

    const [isRunning, setIsRunning] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
    const [nextCommand, setNextCommand] = useState<Command | null>(null);
    const [curRunningSequenceTitle, setCurRunningSequenceTitle] = useState("")


    // Derived data based on selections
    const selectedTestType = stateSetJSON.find((set) => set.name === testType);
    const availableBatches = selectedTestType?.batches ?? [];
    const selectedBatch = availableBatches.find((b) => b.name === batch);
    const availableCommands = selectedBatch?.commands ?? [];

    // WebSocket setup
    const handleSendStateCommand = (command: string) => {
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
        <div style={{backgroundColor: "#181F2D"}}>
            <div className="command-panel">
                {showModal && (
                    <CreateSequenceModal show={showModal} setShow={setShowModal}
                                         handleSendStateCommand={handleSendStateCommand}
                                         setIsRunning={setIsRunning}
                                         setSecondsLeft={setSecondsLeft}
                                         setNextCommand={setNextCommand}
                                         setCurRunningSequenceTitle={setCurRunningSequenceTitle}
                                         curRunningSequenceTitle={curRunningSequenceTitle}

                    />
                )}
                {isRunning && nextCommand && secondsLeft !== null ? (
                    <div
                        style={{
                            color: "white",
                            fontSize: "30px",
                        }}
                    >
                        {"Sequence "}
                        <strong>"{curRunningSequenceTitle}"</strong>
                        {" is currently running. In "}
                        <strong>{secondsLeft}</strong>
                        {" second"}
                        {secondsLeft !== 1 && "s"}
                        {", "}
                        <strong>{nextCommand?.commandName}</strong>
                        {" will execute."}
                    </div>

                ) : (
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
                            <button className="importantBtn"
                                    onClick={() => handleSendStateCommand(command)}>
                                SEND COMMAND
                            </button>
                        </div>
                    </div>
                )}


                <div style={{
                    display: "flex", flexDirection: "row"
                }}>

                    <div style={{
                        flex: 1,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        marginLeft: "10px",
                        marginRight: "10px",
                        color: "white"
                    }}>
                        WebSocket: {status}
                    </div>
                </div>
            </div>
            <div style={{
                padding: "0px 10px 10px 10px",
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
            }}>
                <div style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    marginLeft: "10px",
                    color: "white",
                }}>
                    Last Sent: {lastStateCommandSent}
                </div>
                <button disabled={isRunning && nextCommand !== null && secondsLeft !== null}
                        className="importantBtn" onClick={() => setShowModal(true)}>
                    CREATE SEQUENCE
                </button>
            </div>
        </div>
    );
}
