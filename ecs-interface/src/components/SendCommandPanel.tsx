import { useEffect, useState } from "react";
import stateSetJSON from "../../../resources/STATE_SETS.json";
import sequenceNamesJSON from "../../../resources/SEQUENCE_NAMES.json";
import CreateSequenceModal, { type Command, type SavedSequence } from "./CreateSequenceModal.tsx";
import "../styles/SendCommandPanel.css";

const STORAGE_KEY = "savedSequences";

interface SendCommandPanelInterface {
    status: string;
    lastStateCommandSentTime: string;
    handleSendStateCommand: (command: string) => void;
    handleSendSequenceCommand: () => void;
    onDownloadJSON: () => void;
    commandOrSequence: string;
    setCommandOrSequence: (commandOrSequence: string) => void;
}

export default function SendCommandPanel({
    status,
    lastStateCommandSentTime,
    handleSendStateCommand,
    handleSendSequenceCommand,
    onDownloadJSON,
    commandOrSequence,
    setCommandOrSequence,
}: SendCommandPanelInterface) {
    const [testType, setTestType] = useState("");
    const [batch, setBatch] = useState("");
    const [showModal, setShowModal] = useState(false);

    const [isRunning, setIsRunning] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
    const [nextCommand, setNextCommand] = useState<Command | null>(null);
    const [curRunningSequenceTitle, setCurRunningSequenceTitle] = useState("");
    const [editingSequence, setEditingSequence] = useState<SavedSequence | null>(null);

    const [savedSequences, setSavedSequences] = useState<SavedSequence[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? (JSON.parse(stored) as SavedSequence[]) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedSequences));
    }, [savedSequences]);

    // Derived data based on selections
    const selectedTestType = stateSetJSON.find((set) => set.name === testType);
    const availableBatches = selectedTestType?.batches ?? [];
    const sequences = sequenceNamesJSON[0]?.sequences ?? [];
    const batchesWithSequences = [...availableBatches, { name: "ALL_SEQUENCES" }];
    const selectedBatch = availableBatches.find((b) => b.name === batch);
    const availableCommands =
        batch === "ALL_SEQUENCES"
            ? sequences.map((seq) => ({ name: seq, value: seq }))
            : selectedBatch?.commands ?? [];

    function countdown(seconds: number) {
        return new Promise<void>((resolve) => {
            setSecondsLeft(seconds);
            const interval = setInterval(() => {
                setSecondsLeft((prev) => {
                    if (prev === null || prev <= 1) {
                        clearInterval(interval);
                        return null;
                    }
                    return prev - 1;
                });
            }, 1000);
            setTimeout(() => {
                clearInterval(interval);
                setSecondsLeft(null);
                resolve();
            }, seconds * 1000);
        });
    }

    async function executeSequence(seq: SavedSequence) {
        setIsRunning(true);
        setCurRunningSequenceTitle(seq.title);

        for (const cmd of seq.commands) {
            setNextCommand(cmd);
            if (cmd.timeUntilExecute && cmd.timeUntilExecute > 0) {
                await countdown(cmd.timeUntilExecute);
            }
            handleSendStateCommand(cmd.commandName);
        }

        setIsRunning(false);
        setNextCommand(null);
    }

    function saveSequence(seq: SavedSequence) {
        setSavedSequences((prev) => [...prev, seq]);
    }

    function deleteSequence(index: number) {
        setSavedSequences((prev) => prev.filter((_, i) => i !== index));
    }

    return (
        <div style={{ backgroundColor: "#181F2D" }}>
            <div className="command-panel">
                {showModal && (
                    <CreateSequenceModal
                        show={showModal}
                        setShow={(v) => { setShowModal(v); if (!v) setEditingSequence(null); }}
                        onSave={saveSequence}
                        onExecute={executeSequence}
                        initialData={editingSequence ?? undefined}
                    />
                )}
                {isRunning && nextCommand && secondsLeft !== null ? (
                    <div className="rotating-border">
                        {"Sequence "}
                        <strong>"{curRunningSequenceTitle}"</strong>
                        {" is currently running. In "}
                        <strong>{secondsLeft}</strong>
                        {" second"}
                        {secondsLeft !== 1 && "s"}
                        {", "}
                        <strong>{nextCommand.commandName}</strong>
                        {" will execute."}
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "row" }}>
                        <div style={{
                            display: "flex",
                            justifyContent: "flex-start",
                            alignItems: "center",
                            marginLeft: "10px",
                            marginRight: "10px",
                            gap: "10px",
                        }}>
                            {/* Test Type */}
                            <div className="select-wrapper">
                                <select
                                    value={testType}
                                    onChange={(e) => {
                                        setTestType(e.target.value);
                                        setBatch("");
                                        setCommandOrSequence("");
                                    }}
                                >
                                    <option value="">-- Select Test Type --</option>
                                    {stateSetJSON.map((set) => (
                                        <option key={set.name} value={set.name}>{set.name}</option>
                                    ))}
                                </select>
                                <span className="custom-arrow">▼</span>
                            </div>

                            {/* Batch */}
                            <div className="select-wrapper">
                                <select
                                    value={batch}
                                    onChange={(e) => {
                                        setBatch(e.target.value);
                                        setCommandOrSequence("");
                                    }}
                                    disabled={!testType}
                                >
                                    <option value="">-- Select Batch --</option>
                                    {batchesWithSequences.map((b) => (
                                        <option key={b.name} value={b.name}>{b.name}</option>
                                    ))}
                                </select>
                                <span className="custom-arrow">▼</span>
                            </div>

                            {/* Command */}
                            <div className="select-wrapper">
                                <select
                                    value={commandOrSequence}
                                    onChange={(e) => setCommandOrSequence(e.target.value)}
                                    disabled={!batch}
                                >
                                    {batch === "ALL_STATES"
                                        ? <option value="">-- Select Command --</option>
                                        : <option value="">-- Select Sequence --</option>}
                                    {availableCommands.map((cmd) => (
                                        <option key={cmd.value} value={cmd.value}>{cmd.name}</option>
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
                            marginRight: "10px",
                        }}>
                            {batch === "ALL_SEQUENCES" ? (
                                <button
                                    className="cautiousBtn"
                                    onClick={handleSendSequenceCommand}
                                    disabled={!commandOrSequence}
                                >
                                    EXECUTE SEQUENCE
                                </button>
                            ) : (
                                <button
                                    className="importantBtn"
                                    onClick={() => handleSendStateCommand(commandOrSequence)}
                                    disabled={batch !== "ALL_STATES" || !commandOrSequence}
                                >
                                    SEND COMMAND
                                </button>
                            )}
                        </div>
                    </div>
                )}

                <div style={{ display: "flex", flexDirection: "row" }}>
                    <div style={{
                        flex: 1,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        marginLeft: "10px",
                        marginRight: "10px",
                        color: "white",
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
                    Last Sent: {lastStateCommandSentTime}
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button className="importantBtn" onClick={onDownloadJSON}>
                        DOWNLOAD JSON
                    </button>
                    <button
                        disabled={isRunning}
                        className="importantBtn"
                        onClick={() => { setEditingSequence(null); setShowModal(true); }}
                    >
                        CREATE SEQUENCE
                    </button>
                </div>
            </div>

            {savedSequences.length > 0 && (
                <div className="saved-sequences">
                    <p className="saved-sequences-title">Saved Sequences</p>
                    <div className="saved-sequences-list">
                        {savedSequences.map((seq, i) => (
                            <div key={i} className="saved-sequence-row">
                                <button
                                    className="saved-sequence-name"
                                    onClick={() => { setEditingSequence(seq); setShowModal(true); }}
                                >
                                    {seq.title}
                                    <span className="saved-sequence-steps">
                                        {seq.commands.length} step{seq.commands.length !== 1 && "s"}
                                    </span>
                                </button>
                                <div className="saved-sequence-actions">
                                    <button
                                        className="seq-execute-btn"
                                        disabled={isRunning}
                                        onClick={() => executeSequence(seq)}
                                    >
                                        Execute
                                    </button>
                                    <button
                                        className="seq-delete-btn"
                                        onClick={() => deleteSequence(i)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
