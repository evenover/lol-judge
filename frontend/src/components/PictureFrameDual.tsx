import { useState, useEffect } from "react";
import Socket from "../socket.js";

type PictureFrameDualProps = {
    pictureleft: string;
    pictureright: string;
    view: boolean;
    laughtercount: boolean;
    index: any;
};

export default function PictureFrameDual({ pictureleft, pictureright, view, index, laughtercount }: PictureFrameDualProps) {
    const [isYellowLeft, setIsYellowLeft] = useState(false);
    const [isRedLeft, setIsRedLeft] = useState(false);
    const [isWhiteLeft, setIsWhiteLeft] = useState(false);
    const [isBlackLeft, setIsBlackLeft] = useState(false);
    const [isYellowRight, setIsYellowRight] = useState(false);
    const [isRedRight, setIsRedRight] = useState(false);
    const [isWhiteRight, setIsWhiteRight] = useState(false);
    const [isBlackRight, setIsBlackRight] = useState(false);
    const [isOrange1, setIsOrange1] = useState(false);
    const [isOrange2, setIsOrange2] = useState(false);
    const [currentPictureLeft, setCurrentPictureLeft] = useState(pictureleft);
    const [currentPictureRight, setCurrentPictureRight] = useState(pictureright);
    const [labelLeft, setLabelLeft] = useState("")
    const [labelRight, setLabelRight] = useState("")
    const [laughCounterLeft, setlaughCounterLeft] = useState(0)
    const [laughCounterRight, setlaughCounterRight] = useState(0)

    const handleisYellowLeft = () => {
        setIsYellowLeft(!isYellowLeft);
        Socket.emit("yellowleft", { index, isYellowLeft: !isYellowLeft });
    };

    const handleisRedLeft = () => {
        setIsRedLeft(!isRedLeft);
        Socket.emit("redleft", { index, isRedLeft: !isRedLeft });
    };
    const handleisBlackLeft = () => {
        setIsBlackLeft(!isBlackLeft);
        Socket.emit("blackleft", { index, isBlackLeft: !isBlackLeft });
    };
    const handleisWhiteLeft = () => {
        setIsWhiteLeft(!isWhiteLeft);
        Socket.emit("whiteleft", { index, isWhiteLeft: !isWhiteLeft });
    };

    const handleisYellowRight = () => {
        setIsYellowRight(!isYellowRight);
        Socket.emit("yellowright", { index, isYellowRight: !isYellowRight });
    };

    const handleisRedRight = () => {
        setIsRedRight(!isRedRight);
        Socket.emit("redright", { index, isRedRight: !isRedRight });
    };
    const handleisBlackRight = () => {
        setIsBlackRight(!isBlackRight);
        Socket.emit("blackright", { index, isBlackRight: !isBlackRight });
    };
    const handleisWhiteRight = () => {
        setIsWhiteRight(!isWhiteRight);
        Socket.emit("whiteright", { index, isWhiteRight: !isWhiteRight });
    };
    const handleisOrange1 = () => {
        setIsOrange1(!isOrange1);
        Socket.emit("orange1", { index, isOrange1: !isOrange1 });
    };
    const handleisOrange2 = () => {
        setIsOrange2(!isOrange2);
        Socket.emit("orange2", { index, isOrange2: !isOrange2 });
    };
    const handlelaughCounterLeft = () => {
        setlaughCounterLeft(laughCounterLeft + 1);
        Socket.emit("laughcounterleft", { index, laughCounterLeft: laughCounterLeft+1 });
    };
    const handlelaughCounterRight = () => {
        setlaughCounterRight(laughCounterRight + 1);
        Socket.emit("laughcounterright", { index, laughCounterRight: laughCounterRight+1 });
    };

    const handleDropLeft = async (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];

        if (!file) {
            alert("No file dropped");
            return;
        }

        if (!file.type.startsWith("image/")) {
            alert("Only image files are allowed");
            return;
        }

        if (file.size > 5 * 1024) { // If file exceeds 5 KB, upload to server
            try {
                const formData = new FormData();
                formData.append("file", file);

                const response = await fetch("/uploadpicture", {
                    method: "POST",
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error("Failed to upload picture");
                }

                const data = await response.json();
                const pictureUrl = data.url; // Assuming the server responds with { url: "uploaded_image_url" }

                setCurrentPictureLeft(pictureUrl);
                Socket.emit("updatepictureleft", { index, picture: pictureUrl });
            } catch (error) {
                console.error("Error uploading picture:", error);
                alert("Failed to upload the picture");
            }
            return;
        }

        // If file is within 5 KB, process it locally
        const reader = new FileReader();
        reader.onload = () => {
            if (reader.result) {
                setCurrentPictureLeft(reader.result as string);
                Socket.emit("updatepictureleft", { index, picture: reader.result });
            }
        };
        reader.onerror = () => {
            console.error("Error reading file:", reader.error);
            alert("Failed to read the file");
        };
        reader.readAsDataURL(file);
    };

    const handleDropRight = async (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];

        if (!file) {
            alert("No file dropped");
            return;
        }

        if (!file.type.startsWith("image/")) {
            alert("Only image files are allowed");
            return;
        }

        if (file.size > 5 * 1024) { // If file exceeds 5 KB, upload to server
            try {
                const formData = new FormData();
                formData.append("file", file);

                const response = await fetch("/uploadpicture", {
                    method: "POST",
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error("Failed to upload picture");
                }

                const data = await response.json();
                const pictureUrl = data.url; // Assuming the server responds with { url: "uploaded_image_url" }

                setCurrentPictureRight(pictureUrl);
                Socket.emit("updatepictureright", { index, picture: pictureUrl });
            } catch (error) {
                console.error("Error uploading picture:", error);
                alert("Failed to upload the picture");
            }
            return;
        }

        // If file is within 5 KB, process it locally
        const reader = new FileReader();
        reader.onload = () => {
            if (reader.result) {
                setCurrentPictureRight(reader.result as string);
                Socket.emit("updatepictureright", { index, picture: reader.result });
            }
        };
        reader.onerror = () => {
            console.error("Error reading file:", reader.error);
            alert("Failed to read the file");
        };
        reader.readAsDataURL(file);
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    };

    useEffect(() => {
        // Emit "getinfo" when the component mounts
        Socket.emit("getinfo", { index });

        // Listen for "receiveinfo" and "resetstats" events
        const handleReceiveInfo = (data: any) => {
            if (data.index === index) {
                if (data.isYellowLeft !== undefined) {
                    setIsYellowLeft(data.isYellowLeft);
                }
                if (data.isYellowRight !== undefined) {
                    setIsYellowRight(data.isYellowRight);
                }
                if (data.isRedLeft !== undefined) {
                    setIsRedLeft(data.isRedLeft);
                }
                if (data.isRedRight !== undefined) {
                    setIsRedRight(data.isRedRight);
                }
                if (data.isBlackLeft !== undefined) {
                    setIsBlackLeft(data.isBlackLeft);
                }
                if (data.isBlackRight !== undefined) {
                    setIsBlackRight(data.isBlackRight);
                }
                if (data.isWhiteLeft !== undefined) {
                    setIsWhiteLeft(data.isWhiteLeft);
                }
                if (data.isWhiteRight !== undefined) {
                    setIsWhiteRight(data.isWhiteRight);
                }
                if (data.isOrange1 !== undefined) {
                    setIsOrange1(data.isOrange1);
                }
                if (data.isOrange2 !== undefined) {
                    setIsOrange2(data.isOrange2);
                }
                if (data.pictureLeft) {
                    setCurrentPictureLeft(data.pictureLeft);
                }
                if (data.pictureRight) {
                    setCurrentPictureRight(data.pictureRight);
                }
                if (data.LabelLeft) {
                    setLabelLeft(data.LabelLeft);
                }
                if (data.LabelRight) {
                    setLabelRight(data.LabelRight);
                }
                if (data.laughCounterLeft !== undefined){
                    setlaughCounterLeft(data.laughCounterLeft)
                }
                if (data.laughCounterRight !== undefined){
                    setlaughCounterRight(data.laughCounterRight)
                }
                }
        };

        const handleResetStats = () => {
            setIsYellowLeft(false);
            setIsYellowRight(false);
            setIsRedLeft(false);
            setIsRedRight(false);
            setIsBlackLeft(false);
            setIsBlackRight(false);
            setIsWhiteLeft(false);
            setIsWhiteRight(false);
            setIsOrange1(false);
            setIsOrange2(false);
            setLabelLeft("")
            setLabelRight("")
            setlaughCounterLeft(0)
            setlaughCounterRight(0)
            setCurrentPictureLeft(pictureleft); // Reset to the original left picture
            setCurrentPictureRight(pictureright); // Reset to the original right picture
        };

        Socket.on("receiveinfo", handleReceiveInfo);
        Socket.on("resetstats", handleResetStats);

        // Cleanup listeners when the component unmounts
        return () => {
            Socket.off("receiveinfo", handleReceiveInfo);
            Socket.off("resetstats", handleResetStats);
        };
    }, [index, pictureleft, pictureright]);

    return (
        <div className="picture-frame-dual">
            <div className="picture-frame-dual-inner">
                <div className="picture-frame-dual-cards">
                    <div className="picture-frame-dual-cards-inner">
                    {isOrange1 ? <div className="orange1-card">1</div>: null}
                    {isOrange2 ? <div className="orange2-card">2</div>: null}
                </div>
                </div>
                {view ? 
                <div className="picture-frame-dual-left">
                    <div className="picture-frame-dual-left-inner">
                    <div className="cards">
                    {isYellowLeft ? <div className="yellow-card"></div> : null}
                    {isRedLeft ? <div className="red-card"></div> : null}
                    {isBlackLeft ? <div className="black-card"></div> : null}
                    {isWhiteLeft ? <div className="white-card"></div> : null}
                    </div>
                    {laughtercount ? <div className="picture-frame-dual-laughcounter-left">{laughCounterLeft}</div> : null}
                    <img
                        className="image-left"
                        src={currentPictureLeft}
                        alt="Placeholder"
                        id={isRedLeft || isRedRight ? "greyscale" : "color"}
                    />
                    <input
                        type="text"
                        value={labelLeft} // Bind the input value to the labelLeft state
                        readOnly={view} // Set read-only based on the view prop
                        className="picture-frame-label"
                        onChange={(e) => setLabelLeft(e.target.value)} // Update labelLeft state on input change
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                Socket.emit("updateLabelLeft", { index, LabelLeft: labelLeft }); // Emit the labelLeft value
                                console.log("Label Left sent:", labelLeft); // Optional: Log the value
                            }
                        }}
                    />
                </div>
                </div>
                :
                <div
                    className="picture-frame-dual-left"
                    onDrop={handleDropLeft}
                    onDragOver={handleDragOver}
                >
                    <div className="picture-frame-dual-left-inner">
                    <div className="cards">
                    {isYellowLeft ? <div className="yellow-card"></div> : null}
                    {isRedLeft ? <div className="red-card"></div> : null}
                    {isBlackLeft ? <div className="black-card"></div> : null}
                    {isWhiteLeft ? <div className="white-card"></div> : null}
                    </div>
                    {laughtercount ? <div className="picture-frame-dual-laughcounter-left">{laughCounterLeft}</div> : null}
                    <img
                        className="image-left"
                        src={currentPictureLeft}
                        alt="Placeholder"
                        id={isRedLeft || isRedRight ? "greyscale" : "color"}
                    />
                    <input
                        type="text"
                        value={labelLeft} // Bind the input value to the labelLeft state
                        readOnly={view} // Set read-only based on the view prop
                        className="picture-frame-label"
                        onChange={(e) => setLabelLeft(e.target.value)} // Update labelLeft state on input change
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                Socket.emit("updateLabelLeft", { index, LabelLeft: labelLeft }); // Emit the labelLeft value
                                console.log("Label Left sent:", labelLeft); // Optional: Log the value
                            }
                        }}
                    />
                        </div>
                        <div className="picture-frame-buttons">
                            <button
                                className={`yellow-button ${isYellowLeft ? "active" : ""}`}
                                onClick={handleisYellowLeft}
                            >
                                {isYellowLeft ? "Yellow" : "Yellow"}
                            </button>
                            <button
                                className={`red-button ${isRedLeft ? "active" : ""}`}
                                onClick={handleisRedLeft}
                            >
                                {isRedLeft ? "Red" : "Red"}
                            </button>
                            <button
                                className={`black-button ${isBlackLeft ? "active" : ""}`}
                                onClick={handleisBlackLeft}
                            >
                                {isBlackLeft ? "Black" : "Black"}
                            </button>
                            <button
                                className={`white-button ${isWhiteLeft ? "active" : ""}`}
                                onClick={handleisWhiteLeft}
                            >
                                {isWhiteLeft ? "White" : "White"}
                            </button>
                            <button
                                className={`laugh-button}`}
                                onClick={handlelaughCounterLeft}
                            >
                                Laugh
                            </button>
                        </div>
                </div>}
                {view ?
                <div className="picture-frame-dual-right">
                    <div className="picture-frame-dual-right-inner">
                <div className="cards">
                {isYellowRight ? <div className="yellow-card"></div> : null}
                {isRedRight ? <div className="red-card"></div> : null}
                {isBlackRight ? <div className="black-card"></div> : null}
                {isWhiteRight ? <div className="white-card"></div> : null}
                </div>
                {laughtercount ? <div className="picture-frame-dual-laughcounter-right">{laughCounterRight}</div> : null}
                <img
                    className="image-right"
                    src={currentPictureRight}
                    alt="Placeholder"
                    id={isRedLeft || isRedRight ? "greyscale" : "color"}
                />
                <input
                    type="text"
                    value={labelRight} // Bind the input value to the labelRight state
                    readOnly={view} // Set read-only based on the view prop
                    className="picture-frame-label"
                    onChange={(e) => setLabelRight(e.target.value)} // Update labelRight state on input change
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            Socket.emit("updateLabelRight", { index, LabelRight: labelRight }); // Emit the labelRight value
                            console.log("Label Right sent:", labelRight); // Optional: Log the value
                        }
                    }}
                />
            </div>
            </div>
                :
                <div
                    className="picture-frame-dual-right"
                    onDrop={handleDropRight}
                    onDragOver={handleDragOver}
                >
                    <div className="picture-frame-dual-right-inner">
                    <div className="cards">
                    {isYellowRight ? <div className="yellow-card"></div> : null}
                    {isRedRight ? <div className="red-card"></div> : null}
                    {isBlackRight ? <div className="black-card"></div> : null}
                    {isWhiteRight ? <div className="white-card"></div> : null}
                    </div>
                    {laughtercount ? <div className="picture-frame-dual-laughcounter-right">{laughCounterRight}</div> : null}
                    <img
                        className="image-right"
                        src={currentPictureRight}
                        alt="Placeholder"
                        id={isRedLeft || isRedRight ? "greyscale" : "color"}
                    />
                    <input
                    type="text"
                    value={labelRight} // Bind the input value to the labelRight state
                    readOnly={view} // Set read-only based on the view prop
                    className="picture-frame-label"
                    onChange={(e) => setLabelRight(e.target.value)} // Update labelRight state on input change
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            Socket.emit("updateLabelRight", { index, LabelRight: labelRight }); // Emit the labelRight value
                            console.log("Label Right sent:", labelRight); // Optional: Log the value
                        }
                    }}
                />
                    </div>
                        <div className="picture-frame-buttons">
                            <button
                                className={`yellow-button ${isYellowRight ? "active" : ""}`}
                                onClick={handleisYellowRight}
                            >
                                {isYellowRight ? "Yellow" : "Yellow"}
                            </button>
                            <button
                                className={`red-button ${isRedRight ? "active" : ""}`}
                                onClick={handleisRedRight}
                            >
                                {isRedRight ? "Red" : "Red"}
                            </button>
                            <button
                                className={`black-button ${isBlackRight ? "active" : ""}`}
                                onClick={handleisBlackRight}
                            >
                                {isBlackRight ? "Black" : "Black"}
                            </button>
                            <button
                                className={`white-button ${isWhiteRight ? "active" : ""}`}
                                onClick={handleisWhiteRight}
                            >
                                {isWhiteRight ? "White" : "White"}
                            </button>
                            <button
                                className={`laugh-button}`}
                                onClick={handlelaughCounterRight}
                            >
                                Laugh
                            </button>
                        </div>
                        
                </div>}
            </div>
                {view ? "" : 
                <div className="picture-frame-dual-buttons">
                    <button className="orange1-button"onClick={handleisOrange1}>
                        Orange 1
                    </button>
                    <button className="orange2-button" onClick={handleisOrange2}>
                        Orange 2
                    </button>
                </div>
                }
        </div>
    );
}