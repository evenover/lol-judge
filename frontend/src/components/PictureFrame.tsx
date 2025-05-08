import { useState, useEffect } from "react";
import Socket from "../socket.js";

type PictureFrameProps = {
    picture: string;
    view: boolean;
    laughtercount: boolean;
    index: any;
};

export default function PictureFrame({ picture, view, index, laughtercount }: PictureFrameProps) {
    const [isYellow, setIsYellow] = useState(false);
    const [isRed, setIsRed] = useState(false);
    const [isBlack, setisBlack] = useState(false);
    const [isWhite, setisWhite] = useState(false);
    const [laughCounter, setlaughCounter] = useState(0)
    const [currentPicture, setCurrentPicture] = useState(picture);
    const [label, setLabel] = useState("")

    const handleisYellow = () => {
        setIsYellow(!isYellow);
        Socket.emit("yellow", { index, isYellow: !isYellow });
    };

    const handleisRed = () => {
        setIsRed(!isRed);
        Socket.emit("red", { index, isRed: !isRed });
    };

    const handleisBlack = () => {
        setisBlack(!isBlack)
        Socket.emit("black", {index, isBlack: !isBlack});
    }

    const handleisWhite = () => {
        setisWhite(!isWhite)
        Socket.emit("white", {index, isWhite: !isWhite})
    }
    const handlelaughCounter = () => {
        setlaughCounter(laughCounter+1)
        Socket.emit("laughcounter", {index, laughCounter: laughCounter+1})
    }

    const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
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

        if (file.size > 500 * 1024) { // If file exceeds 500 KB, upload to server
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

                setCurrentPicture(pictureUrl); // Update the picture in the frontend
                Socket.emit("updatepicture", { index, picture: pictureUrl }); // Notify other clients
            } catch (error) {
                console.error("Error uploading picture:", error);
                alert("Failed to upload the picture");
            }
            return;
        }

        // If file is within 500 KB, process it locally
        const reader = new FileReader();
        reader.onload = () => {
            if (reader.result) {
                setCurrentPicture(reader.result as string);
                Socket.emit("updatepicture", { index, picture: reader.result });
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
                if (data.isYellow !== undefined) {
                    setIsYellow(data.isYellow);
                }
                if (data.isRed !== undefined) {
                    setIsRed(data.isRed);
                }
                if (data.isBlack !== undefined) {
                    setisBlack(data.isBlack);
                }
                if (data.isWhite !== undefined) {
                    setisWhite(data.isWhite);
                }
                if (data.laughCounter !== undefined) {
                    setlaughCounter(data.laughCounter);
                }
                if (data.Label !== undefined) {
                    setLabel(data.Label);
                }

                if (data.picture) {
                    setCurrentPicture(data.picture);
                }
            }
        };

        const handleResetStats = () => {
            setIsYellow(false);
            setIsRed(false);
            setisBlack(false);
            setisWhite(false);
            setlaughCounter(0);
            setLabel("");
            setCurrentPicture(picture); // Reset to the original picture
        };

        Socket.on("receiveinfo", handleReceiveInfo);
        Socket.on("resetstats", handleResetStats);

        // Cleanup listeners when the component unmounts
        return () => {
            Socket.off("receiveinfo", handleReceiveInfo);
            Socket.off("resetstats", handleResetStats);
        };
    }, [index, picture]);

    return (
        <div className="picture-frame">
               {view? <div
                    className="picture-frame-inner"
                >
                <div className="cards">
                {isYellow ? <div className="yellow-card"></div> : null}
                {isRed ? <div className="red-card"></div> : null}
                {isBlack ? <div className="black-card"></div> : null}
                {isWhite ? <div className="white-card"></div> : null}
                </div>
                <input
                        type="text"
                        value={label} // Bind the input value to the labelLeft state
                        readOnly={view} // Set read-only based on the view prop
                        className="picture-frame-label"
                        onChange={(e) => setLabel(e.target.value)} // Update labelLeft state on input change
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                Socket.emit("updateLabel", { index, Label: label }); // Emit the labelLeft value
                                console.log("Label sent:", label); // Optional: Log the value
                            }
                        }}
                    />
                    {laughtercount ? <div className="picture-frame-laughcounter">{laughCounter}</div>: null}
                <img
                    src={currentPicture}
                    alt="Placeholder"
                    id={isRed ? "greyscale" : "color"}
                />
            </div>
                :
                <div
                    className="picture-frame-inner"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                >
                <div className="cards">
                {isYellow ? <div className="yellow-card"></div> : null}
                {isRed ? <div className="red-card"></div> : null}
                {isBlack ? <div className="black-card"></div> : null}
                {isWhite ? <div className="white-card"></div> : null}
                </div>
                <input
                        type="text"
                        value={label} // Bind the input value to the labelLeft state
                        readOnly={view} // Set read-only based on the view prop
                        className="picture-frame-label"
                        onChange={(e) => setLabel(e.target.value)} // Update labelLeft state on input change
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                Socket.emit("updateLabel", { index, Label: label }); // Emit the labelLeft value
                                console.log("Label sent:", label); // Optional: Log the value
                            }
                        }}
                    />
                    {laughtercount ? <div className="picture-frame-laughcounter">{laughCounter}</div>: null}
                <img
                    src={currentPicture}
                    alt="Placeholder"
                    id={isRed ? "greyscale" : "color"}
                />
            </div>}
            {view ? null : (
                <div className="picture-frame-buttons">
                    <button
                        className={`yellow-button ${isYellow ? "active" : ""}`}
                        onClick={handleisYellow}
                    >
                        {isYellow ? "Yellow" : "Yellow"}
                    </button>
                    <button
                        className={`red-button ${isRed ? "active" : ""}`}
                        onClick={handleisRed}
                    >
                        {isRed ? "Red" : "Red"}
                    </button>
                    <button
                        className={`black-button ${isBlack ? "active" : ""}`}
                        onClick={handleisBlack}
                    >
                        {isBlack ? "Black" : "Black"}
                    </button>
                    <button
                        className={`white-button ${isWhite ? "active" : ""}`}
                        onClick={handleisWhite}
                    >
                        {isWhite ? "White" : "White"}
                    </button>
                    <button
                        className={`laugh-button}`}
                        onClick={handlelaughCounter}
                    >
                        Laugh
                    </button>
                </div>
            )}
        </div>
    );
}