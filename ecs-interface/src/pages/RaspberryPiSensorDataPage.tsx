import {useEffect, useMemo, useRef, useState} from "react";
import Plot from "react-plotly.js";
import Plotly from "plotly.js-dist-min";
import SendCommandPanel from "../components/SendCommandPanel.tsx";
import StatusPanel from "../components/StatusPanel.tsx";
import SetStatesPanel from "../components/SetStatesPanel.tsx";
import "../styles/RaspberryPiSensorDataPage.css";

type WebSocketStatus = "Disconnected" | "Connecting" | "Connected" | "Error";

type SensorSample = {
    timeStamp: number;
    sensorReading: number;
};

type SensorValue = {
    reading: number;
    unit: string;
};

type RawSensorObj = {
    sensorReading: number;
    timeStamp: number;
    unit?: string;
};

type RawValveObj = { valveState: string };

const SENSOR_GROUPS = ["pressureSensors", "loadCellSensors", "tempSensors", "pressureSensors2"];

// Multiply raw load cell readings by this factor to convert to lbf.
// Update this value to match the specific sensor's calibration.
const LOAD_CELL_LBF_FACTOR = 144;

export default function RaspberryPiSensorDataPage() {
    /* ------------------ Refs ------------------ */
    const plotRefs = useRef<Record<string, Plot | null>>({});
    const sensorNamesRef = useRef<Record<string, string[]>>({});
    const wsRef = useRef<WebSocket | null>(null);
    const bufferRef = useRef<Record<string, Record<string, SensorSample>>>({});
    const initializedRef = useRef(false);
    const latestRawDataRef = useRef<unknown>(null);
    const lastSensorPanelUpdateRef = useRef(0);

    /* ------------------ State ------------------ */
    const [sensorNames, setSensorNames] = useState<Record<string, string[]>>({});
    const [status, setStatus] = useState<WebSocketStatus>("Disconnected");
    const [lastSentCommand, setLastSentCommand] = useState("UNKNOWN");
    const [lastStateCommandSentTime, setLastStateCommandSentTime] = useState("N/A");
    const [currentPiState, setCurrentPiState] = useState("UNKNOWN");
    const [lastMessage, setLastMessage] = useState("UNKNOWN");
    const [commandOrSequence, setCommandOrSequence] = useState("");
    const [latestSensorValues, setLatestSensorValues] = useState<Record<string, SensorValue>>({});
    const [valveStates, setValveStates] = useState<Record<string, string>>({});

    const MAX_POINTS = 30;
    const INTERVAL_MS = 500;

    /* ------------------ WebSocket lifecycle (RUN ONCE) ------------------ */
    useEffect(() => {
        setStatus("Connecting");

        const ws = new WebSocket("ws://localhost:9002/ws");
        wsRef.current = ws;

        ws.addEventListener("open", () => {
            setStatus("Connected");
            ws.send(JSON.stringify({type: "PING", time: Date.now()}));
        });

        ws.addEventListener("close", () => setStatus("Disconnected"));

        ws.addEventListener("error", () => setStatus("Error"));

        ws.onmessage = (event) => {
            const incoming = JSON.parse(event.data);
            latestRawDataRef.current = incoming;

            if (incoming.command === "MESSAGE") {
                setLastMessage(incoming.statement ?? "");
                return;
            }

            if (incoming.command === "STATE_TRANSITION") {
                setCurrentPiState(`${incoming.newState} at time ${incoming.newStand}`);
                return;
            }

            // DATA (and unrecognized commands)
            // The pi includes currentState in every DATA packet
            if (incoming.currentState) {
                setCurrentPiState(incoming.currentState as string);
            }

            const allData = incoming.data;
            if (!allData) return;

            // Extract valve states for override panel sync
            if (allData.valves) {
                const vs: Record<string, string> = {};
                for (const [name, valve] of Object.entries(allData.valves as Record<string, RawValveObj>)) {
                    vs[name] = valve.valveState;
                }
                setValveStates(vs);
            }

            const sensorData = allData as Record<string, Record<string, RawSensorObj>>;

            Object.entries(sensorData).forEach(([groupName, groupData]) => {
                const targetGroups =
                    groupName === "pressureSensors"
                        ? ["pressureSensors", "pressureSensors2"]
                        : [groupName];

                targetGroups.forEach((targetGroup) => {
                    if (!bufferRef.current[targetGroup]) {
                        bufferRef.current[targetGroup] = {};
                    }

                    Object.entries(groupData).forEach(([sensorName, sensorObj]) => {
                        if (sensorObj.sensorReading === undefined) return;

                        const isLoadCell = groupName === "loadCellSensors";
                        bufferRef.current[targetGroup][sensorName] = {
                            timeStamp: sensorObj.timeStamp,
                            sensorReading: isLoadCell
                                ? sensorObj.sensorReading * LOAD_CELL_LBF_FACTOR
                                : sensorObj.sensorReading,
                        };
                    });
                });
            });

            // Build flat snapshot of latest sensor readings — throttled to avoid flooding the panel
            const now = Date.now();
            if (now - lastSensorPanelUpdateRef.current >= 2000) {
                const flatSnapshot: Record<string, SensorValue> = {};
                Object.entries(sensorData).forEach(([groupName, groupData]) => {
                    const isLoadCell = groupName === "loadCellSensors";
                    Object.entries(groupData).forEach(([sensorName, sensorObj]) => {
                        if (sensorObj.sensorReading === undefined) return;
                        flatSnapshot[sensorName] = {
                            reading: isLoadCell
                                ? sensorObj.sensorReading * LOAD_CELL_LBF_FACTOR
                                : sensorObj.sensorReading,
                            unit: isLoadCell ? "lbf" : (sensorObj.unit ?? "?"),
                        };
                    });
                });
                setLatestSensorValues(flatSnapshot);
                lastSensorPanelUpdateRef.current = now;
            }

            // Initialize sensor names (trace labels) once — changing this reinits charts
            if (!initializedRef.current) {
                const namesPerGroup: Record<string, string[]> = {};
                Object.entries(sensorData).forEach(([groupName, groupData]) => {
                    if (groupName === "pressureSensors") {
                        namesPerGroup["pressureSensors"] = Object.keys(groupData);
                        namesPerGroup["pressureSensors2"] = Object.keys(groupData);
                    } else {
                        namesPerGroup[groupName] = Object.keys(groupData);
                    }
                });

                setSensorNames(namesPerGroup);
                sensorNamesRef.current = namesPerGroup;
                initializedRef.current = true;
            }
        };

        const interval = setInterval(() => {
            if (Object.keys(bufferRef.current).length === 0) return;

            Object.entries(plotRefs.current).forEach(([groupName, plotEl]) => {
                if (!plotEl) return;

                const groupBuffer = bufferRef.current[groupName];
                if (!groupBuffer) return;

                const xUpdate: number[][] = [];
                const yUpdate: number[][] = [];
                const traceIndices: number[] = [];
                let latestTimestamp = -Infinity;

                Object.entries(groupBuffer).forEach(([sensorName, {timeStamp, sensorReading}]) => {
                    const traceIndex = (sensorNamesRef.current[groupName] || []).indexOf(sensorName);
                    if (traceIndex === -1) return;
                    traceIndices.push(traceIndex);
                    xUpdate.push([timeStamp]);
                    yUpdate.push([sensorReading]);
                    if (timeStamp > latestTimestamp) latestTimestamp = timeStamp;
                });

                if (traceIndices.length > 0) {
                    Plotly.extendTraces(plotEl.el, {
                        x: xUpdate,
                        y: yUpdate
                    }, traceIndices, MAX_POINTS);
                    // Keep a fixed rolling window so the data doesn't fly by
                    if (latestTimestamp !== -Infinity) {
                        Plotly.relayout(plotEl.el, {
                            "xaxis.range": [latestTimestamp - MAX_POINTS * INTERVAL_MS, latestTimestamp],
                        });
                    }
                }
            });
        }, INTERVAL_MS);

        return () => {
            clearInterval(interval);
            ws.close();
        };
    }, []);

    // Memoize data, layout, and config so react-plotly.js sees stable prop references and
    // doesn't call Plotly.react() on every re-render. Plotly.extendTraces() adds points
    // imperatively — any prop change that triggers Plotly.react() wipes that data and causes
    // the page to scroll-jump as the charts resize.
    const plotDataByGroup = useMemo(
        () =>
            Object.fromEntries(
                SENSOR_GROUPS.map((group) => [
                    group,
                    (sensorNames[group] || []).map((name) => ({
                        x: [] as number[],
                        y: [] as number[],
                        type: "scatter" as const,
                        mode: "lines" as const,
                        name,
                    })),
                ])
            ),
        [sensorNames]  // only changes once, at init
    );

    const plotLayoutByGroup = useMemo(
        () =>
            Object.fromEntries(
                SENSOR_GROUPS.map((group) => [
                    group,
                    {
                        title: {
                            text: "Live Sensor Data — " + group,
                            font: {size: 18, color: "white"},
                            x: 0.5,
                            xanchor: "center",
                        },
                        paper_bgcolor: "#1e1e2f",
                        plot_bgcolor: "#2a2a40",
                        font: {color: "white"},
                        xaxis: {title: "Time", gridcolor: "#444"},
                        yaxis: {title: "Sensor Reading", gridcolor: "#444"},
                        margin: {t: 60, r: 20, l: 50, b: 80},
                        legend: {
                            orientation: "h",
                            yanchor: "top",
                            y: -0.2,
                            xanchor: "center",
                            x: 0.5,
                            font: {color: "white"},
                        },
                    },
                ])
            ),
        []  // static, never changes
    );

    const plotConfig = useMemo(() => ({responsive: true}), []);

    const handleSendStateCommand = (command: string) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            console.warn("WebSocket not connected. Unable to send command.");
            return;
        }

        wsRef.current.send(JSON.stringify({command: "SET_STATE", newState: command}));
        setLastSentCommand(command);
        setLastStateCommandSentTime(new Date().toLocaleTimeString());
    };

    const handleSendSequenceCommand = () => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            console.warn("WebSocket not connected. Unable to send sequence.");
            return;
        }

        wsRef.current.send(JSON.stringify({
            command: "START_SEQUENCE",
            sequence: commandOrSequence
        }));
        setLastStateCommandSentTime(new Date().toLocaleTimeString());
    };

    const downloadJSON = () => {
        if (!latestRawDataRef.current) return;
        const json = JSON.stringify(latestRawDataRef.current, null, 2);
        const blob = new Blob([json], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "curr_json.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div style={{display: "flex", flexDirection: "column"}}>
            <div style={{marginBottom: "10px"}}>
                <SendCommandPanel
                    status={status}
                    lastStateCommandSentTime={lastStateCommandSentTime}
                    handleSendStateCommand={handleSendStateCommand}
                    handleSendSequenceCommand={handleSendSequenceCommand}
                    onDownloadJSON={downloadJSON}
                    commandOrSequence={commandOrSequence}
                    setCommandOrSequence={setCommandOrSequence}
                />
            </div>

            <div style={{marginBottom: "10px"}}>
                <StatusPanel
                    lastSentCommand={lastSentCommand}
                    currentPiState={currentPiState}
                    lastMessage={lastMessage}
                    sensorValues={latestSensorValues}
                    handleSendStateCommand={handleSendStateCommand}
                />
            </div>

            <div style={{marginBottom: "10px"}}>
                <SetStatesPanel socket={wsRef.current} valveStates={valveStates}/>
            </div>

            <div className="grid-container">
                {SENSOR_GROUPS.map((sensorGroup) => (
                    <Plot
                        key={sensorGroup}
                        ref={(el) => (plotRefs.current[sensorGroup] = el)}
                        data={plotDataByGroup[sensorGroup] ?? []}
                        layout={plotLayoutByGroup[sensorGroup]}
                        config={plotConfig}
                    />
                ))}
            </div>
        </div>
    );
}
