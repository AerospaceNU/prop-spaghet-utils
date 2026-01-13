import {useEffect, useState} from "react";

export default function NewSequencePanel() {

    const [currentTestStandState, setCurrentTestStandState] = useState("UNKNOWN");
    const [lastMessage, setLastMessage] = useState("UNKNOWN");
    const [pneumaticSysPress, setPneumaticSysPress] = useState("NA");
    // const [sequenceEnabled, setSequenceEnabled] = useState(false);
    // const [sequence, setSequence] = useState("");

    useEffect(() => {
        setLastMessage("UNKNOWN")
        setPneumaticSysPress("NA")
    }, [])
    const handleForceSetOnlineSafe = () => {
        setCurrentTestStandState("ONLINE SAFE");
        console.log("ONLINE SAFE triggered");
    };

    // const handleSendSequenceCommand = () => {
    //     if (sequenceEnabled) {
    //         console.log("EXECUTE SEQUENCE triggered:", sequence);
    //     }
    // };

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
                    <p>Current State: {currentTestStandState}</p>
                    <p>Last Message: {lastMessage}</p>
                    <p>Available Pneumatic Pressure: {pneumaticSysPress}</p>
                </div>
                <div style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center"
                }}>
                    <div style={{marginBottom: "10px"}}>
                        <button className="dangerBtn" onClick={handleForceSetOnlineSafe}>
                            ONLINE SAFE
                        </button>
                    </div>
                    <button
                        className="cautiousBtn"
                        // onClick={handleSendSequenceCommand}
                        // disabled={!sequenceEnabled}
                    >
                        EXECUTE SEQUENCE
                    </button>
                </div>
            </div>
            <div className="grid-item-small"
                 style={{flex: 3, padding: "10px", color: "white"}}>
                Fake Data...
            </div>
        </div>
    )
}