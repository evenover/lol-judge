import PictureFrame from "./PictureFrame.js";

type PictureFrameDualProps = {
    pictureleft: string;
    pictureright: string;
    view: boolean;
    laughtercount: boolean;
    index: any;
    onCardButtonClick: (name: string) => void;
};

export default function PictureFrameDual({ pictureleft, pictureright, view, index, laughtercount, onCardButtonClick }: PictureFrameDualProps) {
  

    const testing = [
        { name: "yellow", value: false, color: "yellow" },
        { name: "red", value: false, color: "red" },
        { name: "black", value: false, color: "black" },
        { name: "white", value: false, color: "white" },
        { name: "orange1", value: false, color: "orange" },
        { name: "orange2", value: false, color: "orange" },
    ]


    return (
        <div className="picture-frame-dual">
            <div className="picture-frame-dual-inner">
                <div className="picture-frame-dual-cards">
                    <div className="picture-frame-dual-cards-inner">
                    {testing.map((card) => {
                        const isCardActive = card.value;
                        return (
                            <div
                                key={card.name}
                                className={`card ${card.color}-card ${isCardActive ? "active" : ""}`}
                                id="card"
                            ></div>
                        );
                    })}
                        <div className="picture-frame-dual-cards-inner-left">
                            <PictureFrame
                                picture={pictureleft}
                                view={view}
                                index={index}
                                laughtercount={laughtercount}
                            />    
                </div>
                    <div className="picture-frame-dual-cards-inner-right">
                            <PictureFrame
                                picture={pictureright}
                                view={view}
                                index={index}
                                laughtercount={laughtercount}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div className="picture-frame-dual-buttons">
                {testing.map((button) => {
                    return (
                        <button
                            key={button.name}
                            className={`button ${button.color}-button}`}
                            onClick={() => {
                                onCardButtonClick(button.name);
                            }}
                    >
                    {button.name}
                    </button>);
                }
                )}
                </div>
        </div>
    );
}