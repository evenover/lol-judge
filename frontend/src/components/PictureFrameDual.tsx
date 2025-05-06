import { useState, useEffect } from "react";
import Socket from "../socket.js";

type PictureFrameDualProps = {
    pictureleft: string;
    pictureright: string;
    view: boolean;
    index: any;
};

export default function PictureFrameDual({ pictureleft, pictureright, view, index }: PictureFrameDualProps) {
    const [isYellowLeft, setIsYellowLeft] = useState(false);
    const [isRedLeft, setIsRedLeft] = useState(false);
    const [isYellowRight, setIsYellowRight] = useState(false);
    const [isRedRight, setIsRedRight] = useState(false);
    const [currentPictureLeft, setCurrentPictureLeft] = useState(pictureleft);
    const [currentPictureRight, setCurrentPictureRight] = useState(pictureright);

    const handleisYellowLeft = () => {
        setIsYellowLeft(!isYellowLeft);
        Socket.emit("yellowleft", { index, isYellowLeft: !isYellowLeft });
    };

    const handleisRedLeft = () => {
        setIsRedLeft(!isRedLeft);
        Socket.emit("redleft", { index, isRedLeft: !isRedLeft });
    };

    const handleisYellowRight = () => {
        setIsYellowRight(!isYellowRight);
        Socket.emit("yellowright", { index, isYellowRight: !isYellowRight });
    };

    const handleisRedRight = () => {
        setIsRedRight(!isRedRight);
        Socket.emit("redright", { index, isRedRight: !isRedRight });
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
                if (data.pictureLeft) {
                    setCurrentPictureLeft(data.pictureLeft);
                }
                if (data.pictureRight) {
                    setCurrentPictureRight(data.pictureRight);
                }
            }
        };

        const handleResetStats = () => {
            setIsYellowLeft(false);
            setIsYellowRight(false);
            setIsRedLeft(false);
            setIsRedRight(false);
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
                {view ? 
                <div className="picture-frame-dual-left">
                    {isYellowLeft ? <div className="yellow-card"></div> : null}
                    {isRedLeft ? <div className="red-card"></div> : null}
                    <img
                        className="image-left"
                        src={currentPictureLeft}
                        alt="Placeholder"
                        id={isRedLeft ? "greyscale" : "color"}
                    />
                </div>
                :
                <div
                    className="picture-frame-dual-left"
                    onDrop={handleDropLeft}
                    onDragOver={handleDragOver}
                >
                    {isYellowLeft ? <div className="yellow-card"></div> : null}
                    {isRedLeft ? <div className="red-card"></div> : null}
                    <img
                        className="image-left"
                        src={currentPictureLeft}
                        alt="Placeholder"
                        id={isRedLeft ? "greyscale" : "color"}
                    />
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
                        </div>
                </div>}
                {view ?
                <div className="picture-frame-dual-right">
                {isYellowRight ? <div className="yellow-card"></div> : null}
                {isRedRight ? <div className="red-card"></div> : null}
                <img
                    className="image-right"
                    src={currentPictureRight}
                    alt="Placeholder"
                    id={isRedRight ? "greyscale" : "color"}
                />
            </div>
                :
                <div
                    className="picture-frame-dual-right"
                    onDrop={handleDropRight}
                    onDragOver={handleDragOver}
                >
                    {isYellowRight ? <div className="yellow-card"></div> : null}
                    {isRedRight ? <div className="red-card"></div> : null}
                    <img
                        className="image-right"
                        src={currentPictureRight}
                        alt="Placeholder"
                        id={isRedRight ? "greyscale" : "color"}
                    />
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
                        </div>
                </div>}
            </div>
        </div>
    );
}