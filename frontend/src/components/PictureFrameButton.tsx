
type PictureFrameButtonProps = {
    classname: string;
    label: string;
    active: boolean;
    onCardButtonClick: () => void;
}

export default function PictureFrameButton({classname, label, active, onCardButtonClick} : PictureFrameButtonProps) {
    <button
        className={`${classname} ${active ? "active" : ""}`}
        onClick={onCardButtonClick}
        >
            {label}
    </button>

}