import {useEffect, useState} from "react";

export default function SetStatesPanel() {

    const [lastSentOverrideAt, setLastSentOverrideAt] = useState("NA");
    const [overrideEnabled, setOverrideEnabled] = useState(false);
    const [states, setStates] = useState(["State1", "State2", "State3", "State4", "State5", "State6", "State7", "State8", "State9", "State10", "State11", "State12", "State13"]);

    useEffect(() => {
        setStates(["State1", "State2", "State3", "State4", "State5", "State6", "State7", "State8", "State9", "State10", "State11", "State12", "State13"])
    }, [])

    const handleSendOverrideCommand = () => {
        setLastSentOverrideAt(new Date().toLocaleTimeString());
        console.log("SET STATES override sent");
    };

    return (
        <div style={{backgroundColor: "#181F2D"}}>
            <div style={{display: "flex", flexDirection: "column", padding: "10px"}}>
                <div id="override-buttons" className="grid-container-overrides">
                    {states.map((s) => {
                        return (
                            <div style={{color: "white", display: "flex", flexDirection: "column"}}>
                                {s}
                                <select style={{backgroundColor: "#181F2D", color: "white"}}
                                        key={s}>
                                    <option>CLOSED</option>
                                    <option>OPENED</option>
                                </select>
                            </div>
                        )
                    })}
                </div>
                <div style={{display: "flex", flexDirection: "row", alignItems: "center"}}>
                    <button
                        style={{marginRight: "20px"}}
                        className="importantBtn"
                        onClick={handleSendOverrideCommand}
                        disabled={!overrideEnabled}
                    >
                        SET STATES
                    </button>
                    <p style={{marginRight: "30px"}}>Last Sent override at: {lastSentOverrideAt}</p>
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
    )
}