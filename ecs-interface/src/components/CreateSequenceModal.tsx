import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import CommandEntry from "./CommandEntry.tsx";
import { useState } from "react";
import stateSetJSON from "../../../resources/STATE_SETS.json";
import "../styles/CreateSequenceModal.css"
import "../styles/RaspberryPiSensorDataPage.css"

export interface Command {
    type?: "SET_STATE" | "OTHER";
    commandName: string;
    timeUntilExecute?: number;
}

export interface SavedSequence {
    title: string;
    commands: Command[];
}

interface CreateSequenceModalInterface {
    show: boolean;
    setShow: (show: boolean) => void;
    onSave: (seq: SavedSequence) => void;
    onExecute: (seq: SavedSequence) => void;
    initialData?: SavedSequence;
}

export default function CreateSequenceModal({
    show,
    setShow,
    onSave,
    onExecute,
    initialData,
}: CreateSequenceModalInterface) {
    const [title, setTitle] = useState(initialData?.title ?? "");
    const [testType, setTestType] = useState("");
    const [batch, setBatch] = useState("");
    const [curCommand, setCurCommand] = useState<Command>({
        type: "SET_STATE",
        commandName: "",
        timeUntilExecute: 0,
    });
    const [commands, setCommands] = useState<Command[]>(initialData?.commands ?? []);

    const selectedTestType = stateSetJSON.find((set) => set.name === testType);
    const availableBatches = selectedTestType?.batches ?? [];
    const selectedBatch = availableBatches.find((b) => b.name === batch);
    const availableCommands = selectedBatch?.commands ?? [];

    const canSubmit = !!title && commands.length > 0;

    function handleSave() {
        onSave({ title, commands });
        setShow(false);
    }

    function handleExecute() {
        onSave({ title, commands });
        onExecute({ title, commands });
        setShow(false);
    }

    return (
        <Modal show={show} onHide={() => setShow(false)} dialogClassName="create-sequence-modal">
            <Modal.Header closeButton>
                <Modal.Title>Create Sequence</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <div style={{ minHeight: "50vh", maxHeight: "60vh" }}>
                    <div style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 100,
                        paddingBottom: "20px",
                        display: "flex",
                        flexDirection: "column",
                    }}>
                        <div style={{ display: "flex", flexDirection: "row" }}>
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                paddingRight: "10px",
                            }}>
                                Title:
                            </div>
                            <input
                                style={{ display: "flex", flex: 1, minHeight: "5vh" }}
                                type="text"
                                value={title}
                                placeholder="Sequence Title"
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        <div style={{
                            display: "flex",
                            flex: 1,
                            justifyContent: "flex-start",
                            alignItems: "center",
                            gap: "10px",
                            marginTop: "10px",
                        }}>
                            {/* Test Type */}
                            <div className="select-wrapper">
                                <select
                                    value={testType}
                                    onChange={(e) => {
                                        setTestType(e.target.value);
                                        setBatch("");
                                        setCurCommand({ ...curCommand, commandName: "" });
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
                                        setCurCommand({ ...curCommand, commandName: "" });
                                    }}
                                    disabled={!testType}
                                >
                                    <option value="">-- Select Batch --</option>
                                    {availableBatches.map((b) => (
                                        <option key={b.name} value={b.name}>{b.name}</option>
                                    ))}
                                </select>
                                <span className="custom-arrow">▼</span>
                            </div>

                            {/* Command */}
                            <div className="select-wrapper">
                                <select
                                    value={curCommand.commandName}
                                    onChange={(e) =>
                                        setCurCommand({ ...curCommand, type: "SET_STATE", commandName: e.target.value })
                                    }
                                    disabled={!batch}
                                >
                                    <option value="">-- Select Command --</option>
                                    {availableCommands.map((cmd) => (
                                        <option key={cmd.value} value={cmd.value}>{cmd.name}</option>
                                    ))}
                                </select>
                                <span className="custom-arrow">▼</span>
                            </div>

                            {/* Delay */}
                            <div className="select-wrapper">
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="Delay (s)"
                                    onChange={(e) =>
                                        setCurCommand({ ...curCommand, timeUntilExecute: e.target.valueAsNumber })
                                    }
                                />
                            </div>

                            <button
                                onClick={() => setCommands([...commands, curCommand])}
                                disabled={!curCommand.commandName || !curCommand.timeUntilExecute || !curCommand.type}
                            >
                                Add Step
                            </button>
                        </div>
                    </div>

                    <div style={{
                        overflowY: "auto",
                        border: commands.length === 0 ? "" : "1px solid black",
                        minHeight: "10vh",
                        maxHeight: "45vh",
                    }}>
                        {commands.map((command, index) => (
                            <CommandEntry key={index} orderIndex={index + 1} command={command} />
                        ))}
                    </div>
                </div>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={() => setShow(false)}>
                    Close
                </Button>
                <Button variant="success" onClick={handleSave} disabled={!canSubmit}>
                    Save
                </Button>
                <Button variant="primary" onClick={handleExecute} disabled={!canSubmit}>
                    Execute
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
