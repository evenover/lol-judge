import { useState, useEffect } from "react";
import Socket from "../socket.js";

type PictureFrameProps = {
    picture: string;
    view: boolean;
    index: any;
};

export default function PictureFrame({ picture, view, index }: PictureFrameProps) {
    const [isYellow, setIsYellow] = useState(false);
    const [isRed, setIsRed] = useState(false);
    const [isBlack, setisBlack] = useState(false);
    const [isWhite, setisWhite] = useState(false);
    const [isOrange1, setisOrange1] = useState(false);
    const [isOrange2, setisOrange2] = useState(false);
    const [currentPicture, setCurrentPicture] = useState(picture);

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
        Socket.emit("black", {index, isBlack: isBlack});
    }

    const handleisWhite = () => {
        setisWhite(!isWhite)
        Socket.emit("white", {index, isWhite: !isWhite})
    }
    const handleisOrange1 = () => {
        setisOrange1(!isOrange1)
        Socket.emit("orange1", {index, isOrange1: !isOrange1})
    }
    const handleisOrange2 = () => {
        setisOrange2(!isOrange2)
        Socket.emit("orange2", {index, isOrange2: !isOrange2})
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
                    setIsRed(data.isBlack);
                }
                if (data.isWhite !== undefined) {
                    setIsRed(data.isWhite);
                }
                if (data.isOrange1 !== undefined) {
                    setIsRed(data.isOrange1);
                }
                if (data.isOrange2 !== undefined) {
                    setIsRed(data.isOrange2);
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
            setisOrange1(false);
            setisOrange2(false);

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
            
                {isYellow ? <div className="yellow-card"></div> : null}
                {isRed ? <div className="red-card"></div> : null}
                {isBlack ? <div className="black-card"></div> : null}
                {isWhite ? <div className="white-card"></div> : null}
                {isOrange1 ? <div className="oarange1-card">1</div> : null}
                {isOrange2 ? <div className="orange2-card">2</div> : null}
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
            
                {isYellow ? <div className="yellow-card"></div> : null}
                {isRed ? <div className="red-card"></div> : null}
                {isBlack ? <div className="black-card"></div> : null}
                {isWhite ? <div className="white-card"></div> : null}
                {isOrange1 ? <div className="oarange1-card">1</div> : null}
                {isOrange2 ? <div className="orange2-card">2</div> : null}
                
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
                        className={`orange1-button ${isOrange1 ? "active" : ""}`}
                        onClick={handleisOrange1}
                    >
                        {isOrange1 ? "Orange 1" : "Orange 1"}
                    </button>
                    <button
                        className={`orange2-button ${isOrange2 ? "active" : ""}`}
                        onClick={handleisOrange2}
                    >
                        {isOrange2 ? "Orange 2" : "Orange 2"}
                    </button>
                </div>
            )}
        </div>
    );
}