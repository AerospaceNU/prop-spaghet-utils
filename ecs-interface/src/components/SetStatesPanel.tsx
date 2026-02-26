import { useState, useEffect } from "react";
import valveNamesJSON from "../../../resources/VALVE_NAMES.json";

interface SetStatesPanelProps {
    socket: WebSocket | null;
    valveStates: Record<string, string>;
}

const valveNames: string[] = valveNamesJSON[0].valves;

export default function SetStatesPanel({ socket, valveStates }: SetStatesPanelProps) {
    const [lastSentOverrideAt, setLastSentOverrideAt] = useState("NA");
    const [overrideEnabled, setOverrideEnabled] = useState(false);
    const [selectedStates, setSelectedStates] = useState<Record<string, string>>(
        () => Object.fromEntries(valveNames.map((v) => [v, "CLOSED"]))
    );

    // Sync dropdowns from websocket data when override is not active
    useEffect(() => {
        if (!overrideEnabled && Object.keys(valveStates).length > 0) {
            setSelectedStates((prev) => {
                const updated = { ...prev };
                for (const v of valveNames) {
                    if (valveStates[v] !== undefined) {
                        updated[v] = valveStates[v];
                    }
                }
                return updated;
            });
        }
    }, [valveStates, overrideEnabled]);

    const handleSendOverrideCommand = () => {
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            console.warn("WebSocket not connected. Unable to send override.");
            return;
        }

        const activeElements: Record<string, string> = {};
        for (const v of valveNames) {
            activeElements[v] = selectedStates[v] ?? "CLOSED";
        }

        const payload = {
            command: "SET_ACTIVE_ELEMENTS",
            activeElements,
        };

        socket.send(JSON.stringify(payload));
        setLastSentOverrideAt(new Date().toLocaleTimeString());
    };

    return (
        <div style={{ backgroundColor: "#181F2D" }}>
            <div style={{ display: "flex", flexDirection: "column", padding: "10px" }}>
                <div className="grid-container-overrides">
                    {valveNames.map((v) => (
                        <div key={v} style={{ color: "white", display: "flex", flexDirection: "column" }}>
                            {v}
                            <select
                                className="dropdown"
                                value={selectedStates[v] ?? "CLOSED"}
                                onChange={(e) =>
                                    setSelectedStates((prev) => ({ ...prev, [v]: e.target.value }))
                                }
                                disabled={!overrideEnabled}
                            >
                                <option value="OPEN">OPEN</option>
                                <option value="CLOSED">CLOSED</option>
                            </select>
                        </div>
                    ))}
                </div>
                <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "20px" }}>
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
            </div>
        </div>
    );
}
