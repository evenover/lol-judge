
type PictureFramePuttonProps = {
    classname: string;
    label: string;
    active: boolean;
    onCardButtonClick: () => void;
}

export default function PictureFramePutton({classname, label, active, onCardButtonClick} : PictureFramePuttonProps) {
    <button
        className={`${classname} ${active ? "active" : ""}`}
        onClick={onCardButtonClick}
        >
            {label}
    </button>

}