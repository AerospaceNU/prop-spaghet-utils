import {useEffect, useRef, useState} from "react";
import Plot from "react-plotly.js";
import Plotly from "plotly.js-dist-min";
import SendCommandPanel from "./components/SendCommandPanel.tsx";
import NewSequencePanel from "./components/NewSequencePanel.tsx";
import SetStatesPanel from "./components/SetStatesPanel.tsx";
import "./styles/RaspberryPiSensorDataPage.css";

type WebSocketStatus = "Disconnected" | "Connecting" | "Connected" | "Error";

type SensorSample = {
    timeStamp: number;
    sensorReading: number;
};

export default function RaspberryPiSensorDataPage() {
    /* ------------------ Refs ------------------ */
    const plotRefs = useRef<Record<string, any>>({});
    const wsRef = useRef<WebSocket | null>(null);
    const bufferRef = useRef<Record<string, SensorSample>>({});
    const sensorNamesRef = useRef<string[]>([]);
    const initializedRef = useRef(false);

    /* ------------------ State ------------------ */
    const [sensorNames, setSensorNames] = useState<string[]>([]);
    const [status, setStatus] = useState<WebSocketStatus>("Disconnected");

    const MAX_POINTS = 50;

    /* ------------------ WebSocket lifecycle (RUN ONCE) ------------------ */
    useEffect(() => {
        setStatus("Connecting");

        const ws = new WebSocket("ws://localhost:9002/ws");
        wsRef.current = ws;

        ws.addEventListener("open", () => setStatus("Connected"));
        ws.addEventListener("open", () => {
            setStatus("Connected");

            ws.send(JSON.stringify({
                type: "PING",
                time: Date.now()
            }));
        });
        ws.addEventListener("open", () => {
            console.log("WS open — sending test");
            ws.send(JSON.stringify({
                type: "PING",
                time: Date.now()
            }));
        });


        ws.addEventListener("close", () => setStatus("Disconnected"));
        ws.addEventListener("error", () => setStatus("Error"));

        ws.onmessage = (event) => {
            const incoming = JSON.parse(event.data);
            const parsedData = incoming.data.pressureSensors;

            Object.entries(parsedData).forEach(([sensorName, sensorObj]: any) => {
                bufferRef.current[sensorName] = {
                    timeStamp: sensorObj.timeStamp,
                    sensorReading: sensorObj.sensorReading,
                };
            });

            // Initialize sensor names exactly once
            if (!initializedRef.current) {
                const names = Object.keys(parsedData);
                sensorNamesRef.current = names;
                setSensorNames(names);
                initializedRef.current = true;
            }
        };

        const interval = setInterval(() => {
            const bufferedData = {...bufferRef.current};
            if (Object.keys(bufferedData).length === 0) return;

            Object.entries(plotRefs.current).forEach(([_, plotEl]) => {
                if (!plotEl) return;

                const xUpdate: any[] = [];
                const yUpdate: any[] = [];
                const traceIndices: number[] = [];

                Object.entries(bufferedData).forEach(
                    ([sensorName, {timeStamp, sensorReading}]) => {
                        const traceIndex =
                            sensorNamesRef.current.indexOf(sensorName);
                        if (traceIndex === -1) return;

                        traceIndices.push(traceIndex);
                        xUpdate.push([timeStamp]);
                        yUpdate.push([sensorReading]);
                    }
                );

                if (traceIndices.length > 0) {
                    Plotly.extendTraces(
                        plotEl.el,
                        {x: xUpdate, y: yUpdate},
                        traceIndices,
                        MAX_POINTS
                    );
                }
            });
        }, 300);

        return () => {
            clearInterval(interval);
            ws.close();
        };
    }, []);

    /* ------------------ Initial empty traces ------------------ */
    const traces = sensorNames.map((sensorName) => ({
        x: [],
        y: [],
        type: "scatter",
        mode: "lines",
        name: sensorName,
    }));

    const [checkboxes] = useState({
        pressureSensors: true,
        loadSensors: true,
        tempSensors: true,
        pressureSensors2: false,
    });

    return (
        <div style={{display: "flex", flexDirection: "column"}}>
            <div style={{marginBottom: "10px"}}>
                <SendCommandPanel status={status} socket={wsRef.current}/>
            </div>

            <div style={{marginBottom: "10px"}}>
                <NewSequencePanel/>
            </div>

            <div style={{marginBottom: "10px"}}>
                <SetStatesPanel/>
            </div>

            <div className="grid-container">
                {Object.keys(checkboxes).map((sensorGroup) => (
                    <Plot
                        key={sensorGroup}
                        ref={(el) => (plotRefs.current[sensorGroup] = el)}
                        data={traces}
                        layout={{
                            title: {
                                text: "Live Sensor Data for " + sensorGroup,
                                font: {size: 18, color: "white"},
                                x: 0.5,
                                xanchor: "center",
                            },
                            paper_bgcolor: "#1e1e2f",
                            plot_bgcolor: "#2a2a40",
                            font: {color: "white"},
                            xaxis: {title: "Time", gridcolor: "#444"},
                            yaxis: {
                                title: "Sensor Reading (psi)",
                                gridcolor: "#444",
                            },
                            margin: {t: 60, r: 20, l: 50, b: 80},
                            legend: {
                                orientation: "h",
                                yanchor: "top",
                                y: -0.2,
                                xanchor: "center",
                                x: 0.5,
                                font: {color: "white"},
                            },
                        }}
                        config={{responsive: true}}
                    />
                ))}
            </div>
        </div>
    );
}
