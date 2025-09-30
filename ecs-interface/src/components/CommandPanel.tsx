import {useState} from "react";

export default function CommandPanel() {
    const [testType, setTestType] = useState("");
    const [batch, setBatch] = useState("");
    const [command, setCommand] = useState("");
    const [lastStateCommandSent, setLastStateCommandSent] = useState("UNKNOWN");

    const handleSendStateCommand = () => {
        // Replace with your actual logic
        setLastStateCommandSent(new Date().toLocaleTimeString());
        console.log("SEND COMMAND triggered");
    };

    return (
        <div className="command-panel">
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

            {/*<select value={sequence} onChange={(e) => setSequence(e.target.value)}>*/}
            {/*    <option value="">-- Select Sequence --</option>*/}
            {/*    <option value="seq1">Sequence 1</option>*/}
            {/*    <option value="seq2">Sequence 2</option>*/}
            {/*</select>*/}

            <p>
                Sequences Enabled:{" "}
                {/*<input*/}
                {/*    type="checkbox"*/}
                {/*    checked={sequenceEnabled}*/}
                {/*    onChange={(e) => setSequenceEnabled(e.target.checked)}*/}
                {/*/>*/}
            </p>

            <button className="importantBtn" onClick={handleSendStateCommand}>
                SEND COMMAND
            </button>
        </div>
    )
}