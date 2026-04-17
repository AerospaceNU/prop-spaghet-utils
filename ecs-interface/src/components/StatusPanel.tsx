const MIN_SAFE_PNEUMATIC_PRESSURE = 80.0;

// Mass flow constants for mdot = Cd * A * sqrt(2 * rho * deltaP)
// Cd is shared and controlled via the UI — see StatusPanelProps
const A_lox = 0.00001267;  // LOX venturi throat area (m²)
const rho_lox = 1141.0;    // LOX density (kg/m³)
const A_kero = 0.00001267;        // Kero venturi throat area (m²) — placeholder
const rho_kero = 820.0;    // Kerosene density (kg/m³)

interface SensorValue {
    reading: number;
    unit: string;
}

interface StatusPanelProps {
    lastSentCommand: string;
    currentPiState: string;
    lastMessage: string;
    sensorValues: Record<string, SensorValue>;
    handleSendStateCommand: (command: string) => void;
    cd: number;
    onCdChange: (value: number) => void;
}

export default function StatusPanel({
                                        lastSentCommand,
                                        currentPiState,
                                        lastMessage,
                                        sensorValues,
                                        handleSendStateCommand,
                                        cd,
                                        onCdChange,
                                    }: StatusPanelProps) {

    const pneumatic = sensorValues["Pneumatic"];

    const loxVenturi = sensorValues["loxVenturi"];
    const loxVenturi2 = sensorValues["loxVenturi2"];
    const loxMdot = (loxVenturi && loxVenturi2)
        ? cd * A_lox * Math.sqrt(2 * rho_lox * Math.abs(loxVenturi.reading - loxVenturi2.reading) * 6894.76)
        : null;

    const keroVenturi = sensorValues["keroVenturi"];
    const keroVenturi2 = sensorValues["keroVenturi2"];
    const keroMdot = (keroVenturi && keroVenturi2)
        ? cd * A_kero * Math.sqrt(2 * rho_kero * Math.abs(keroVenturi.reading - keroVenturi2.reading) * 6894.76)
        : null;

    return (
        <div className="grid-container-small">
            <div className="grid-item-small" style={{
                flex: 2,
                marginRight: "10px",
                display: "flex",
                flexDirection: "row",
                padding: "10px"
            }}>
                <div style={{flex: 1}}>
                    <p>Last Sent Command: {lastSentCommand}</p>
                    <p>Current Pi State: {currentPiState}</p>
                    <p>Last Message: {lastMessage}</p>
                    {pneumatic && (
                        <p style={{color: pneumatic.reading < MIN_SAFE_PNEUMATIC_PRESSURE ? "red" : "white"}}>
                            {pneumatic.reading < MIN_SAFE_PNEUMATIC_PRESSURE && "LOW "}
                            Available Pneumatic
                            Pressure: {pneumatic.reading.toFixed(4)} {pneumatic.unit}
                        </p>
                    )}
                </div>
                <div style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center"
                }}>
                    <button className="dangerBtn"
                            onClick={() => handleSendStateCommand("ONLINE_SAFE_D")}>
                        ONLINE SAFE
                    </button>
                </div>
            </div>
            <div className="grid-item-small" style={{flex: 3, padding: "10px", color: "white"}}>
                <div style={{display: "grid", gridTemplateColumns: "1fr 1fr 1fr"}}>
                    {Object.entries(sensorValues).map(([key, {reading, unit}]) => (
                        <div key={key} style={{fontSize: "15px"}}>
                            {key}: {reading.toFixed(4)} {unit}
                        </div>
                    ))}
                </div>
                {loxMdot !== null && (
                    <div style={{fontSize: "15px", marginTop: "8px", color: "#4488ff"}}>
                        LOX Mass Flow: {loxMdot.toFixed(4)} kg/s
                    </div>
                )}
                {keroMdot !== null && (
                    <div style={{fontSize: "15px", marginTop: "4px", color: "#ff4444"}}>
                        Kero Mass Flow: {keroMdot.toFixed(4)} kg/s
                    </div>
                )}
                <div style={{
                    fontSize: "15px",
                    marginTop: "6px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                }}>
                    <span>Cd:</span>
                    <input
                        type="number"
                        value={cd}
                        step={0.01}
                        min={0}
                        max={1}
                        onChange={(e) => onCdChange(parseFloat(e.target.value))}
                        style={{
                            width: "70px",
                            background: "#2a2a40",
                            color: "white",
                            border: "1px solid #555",
                            borderRadius: "4px",
                            padding: "2px 4px"
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
