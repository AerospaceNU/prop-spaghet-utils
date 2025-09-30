import { useState, useEffect } from "react";
import "../styles/RaspberryPiSensorData.css"

export default function RaspberryPiSensorData() {
    // -----------------------
    // STATE MANAGEMENT
    // -----------------------
    // const [error, setError] = useState("");
    const [testType, setTestType] = useState("");
    const [batch, setBatch] = useState("");
    const [command, setCommand] = useState("");
    const [lastStateCommandSent, setLastStateCommandSent] = useState("UNKNOWN");
    const [sequence, setSequence] = useState("");
    const [sequenceEnabled, setSequenceEnabled] = useState(false);

    const [currentTestStandState, setCurrentTestStandState] = useState("UNKNOWN");
    const [lastMessage, setLastMessage] = useState("UNKNOWN");
    const [pneumaticSysPress, setPneumaticSysPress] = useState("NA");

    const [overrideEnabled, setOverrideEnabled] = useState(false);
    const [lastSentOverrideAt, setLastSentOverrideAt] = useState("NA");

    const [checkboxes, setCheckboxes] = useState({
        pressureSensors: true,
        loadSensors: true,
        tempSensors: true,
        pressureSensors2: false,
    });

    // -----------------------
    // EVENT HANDLERS
    // -----------------------
    const handleSendStateCommand = () => {
        // Replace with your actual logic
        setLastStateCommandSent(new Date().toLocaleTimeString());
        console.log("SEND COMMAND triggered");
    };

    const handleForceSetOnlineSafe = () => {
        setCurrentTestStandState("ONLINE SAFE");
        console.log("ONLINE SAFE triggered");
    };

    const handleSendSequenceCommand = () => {
        if (sequenceEnabled) {
            console.log("EXECUTE SEQUENCE triggered:", sequence);
        }
    };

    const handleSendOverrideCommand = () => {
        setLastSentOverrideAt(new Date().toLocaleTimeString());
        console.log("SET STATES override sent");
    };

    const toggleCheckbox = (name: string) => {
        console.log(name)
        // setCheckboxes((prev) => ({
        //     ...prev,
        //     [name]: !prev[name],
        // }));
    };

    // -----------------------
    // LIFECYCLE / EFFECTS
    // -----------------------
    useEffect(() => {
        // Example: fetch sensor data from backend or WebSocket
        // Replace with your Raspberry Pi JSON polling
        const interval = setInterval(() => {
            setLastMessage(`Message received at ${new Date().toLocaleTimeString()}`);
            setPneumaticSysPress(Math.floor(Math.random() * 200) + " PSI");
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    // -----------------------
    // JSX
    // -----------------------
    return (
        <div style={{padding: "10px"}}>
            {/*{error && <div className="sensor-value">{error}</div>}*/}

            <div className="box">
                <select value={testType} onChange={(e) => setTestType(e.target.value)}>
                    <option value="">-- Select Test Type --</option>
                    <option value="test1">Test 1</option>
                    <option value="test2">Test 2</option>
                </select>

                <select value={batch} onChange={(e) => setBatch(e.target.value)}>
                    <option value="">-- Select Batch --</option>
                    <option value="batch1">Batch 1</option>
                    <option value="batch2">Batch 2</option>
                </select>

                <select value={command} onChange={(e) => setCommand(e.target.value)}>
                    <option value="">-- Select Command --</option>
                    <option value="cmd1">Command 1</option>
                    <option value="cmd2">Command 2</option>
                </select>

                <p>Last Sent: {lastStateCommandSent}</p>

                <select value={sequence} onChange={(e) => setSequence(e.target.value)}>
                    <option value="">-- Select Sequence --</option>
                    <option value="seq1">Sequence 1</option>
                    <option value="seq2">Sequence 2</option>
                </select>

                <p>
                    Sequences Enabled:{" "}
                    <input
                        type="checkbox"
                        checked={sequenceEnabled}
                        onChange={(e) => setSequenceEnabled(e.target.checked)}
                    />
                </p>
            </div>

            <br />

            <div className="grid-container-small">
                <div className="grid-item-small">
                    <div className="box">
                        <button className="importantBtn" onClick={handleSendStateCommand}>
                            SEND COMMAND
                        </button>
                        <p>Current State: {currentTestStandState}</p>
                        <p>Last Message: {lastMessage}</p>
                        <p>Available Pneumatic Pressure: {pneumaticSysPress}</p>
                        <button className="dangerBtn" onClick={handleForceSetOnlineSafe}>
                            ONLINE SAFE
                        </button>
                        <button
                            className="cautiousBtn"
                            onClick={handleSendSequenceCommand}
                            disabled={!sequenceEnabled}
                        >
                            EXECUTE SEQUENCE
                        </button>
                    </div>
                </div>
                <div className="grid-item-small">
                    <div className="box">
                        <div className="wrapped-container">
                            <div id="sensorContainer" style={{ color: "white" }}>
                                {/* You can render dynamic sensor values here */}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <br />

            <div className="box">
                <div id="override-buttons" className="grid-container-overrides">
                    {/* You could map override controls here */}
                </div>
                <button
                    className="importantBtn"
                    onClick={handleSendOverrideCommand}
                    disabled={!overrideEnabled}
                >
                    SET STATES
                </button>
                <p>Last Sent override at: {lastSentOverrideAt}</p>
                <p>
                    Enable Override:{" "}
                    <input
                        type="checkbox"
                        checked={overrideEnabled}
                        onChange={(e) => setOverrideEnabled(e.target.checked)}
                    />
                </p>
            </div>

            <br />

            <div className="grid-container">
                <div className="grid-item">
                    <div id="chart1"></div>
                    <p>
                        Enable/Disable:{" "}
                        <input
                            type="checkbox"
                            checked={checkboxes.pressureSensors}
                            onChange={() => toggleCheckbox("pressureSensors")}
                        />
                    </p>
                </div>
                <div className="grid-item">
                    <div id="chart3"></div>
                    <p>
                        Enable/Disable:{" "}
                        <input
                            type="checkbox"
                            checked={checkboxes.loadSensors}
                            onChange={() => toggleCheckbox("loadSensors")}
                        />
                    </p>
                </div>
                <div className="grid-item">
                    <div id="chart2"></div>
                    <p>
                        Enable/Disable:{" "}
                        <input
                            type="checkbox"
                            checked={checkboxes.tempSensors}
                            onChange={() => toggleCheckbox("tempSensors")}
                        />
                    </p>
                </div>
                <div className="grid-item">
                    <div id="chart4"></div>
                    <p>
                        Enable/Disable:{" "}
                        <input
                            type="checkbox"
                            checked={checkboxes.pressureSensors2}
                            onChange={() => toggleCheckbox("pressureSensors2")}
                        />
                    </p>
                </div>
            </div>
        </div>
    );
}
