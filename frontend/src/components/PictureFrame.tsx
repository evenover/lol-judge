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
    const [currentPicture, setCurrentPicture] = useState(picture);

    const handleisYellow = () => {
        setIsYellow(!isYellow);
        Socket.emit("yellow", { index, isYellow: !isYellow });
    };

    const handleisRed = () => {
        setIsRed(!isRed);
        Socket.emit("red", { index, isRed: !isRed });
    };

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
                if (data.picture) {
                    setCurrentPicture(data.picture);
                }
            }
        };

        const handleResetStats = () => {
            setIsYellow(false);
            setIsRed(false);
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
                </div>
            )}
        </div>
    );
}