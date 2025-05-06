

type StartMenuProps = {
    onViewClick: () => void;
    onOperateClick: () => void;
}

export default function StartMenu({onViewClick, onOperateClick}: StartMenuProps) {
    return (
        <div className="start-menu">
        <div className="start-menu-title">
        <h1>LOL Judge</h1>
        </div>
        <div className="start-menu-logos">
        <img src="./logo.png" alt="LOL Judge Logo" className="header-logo" />
        <img src="./prime.png" alt="Prime Logo" className="header-logo" />
        </div>
        <div className="start-menu-buttons">
        <button className="view-button" onClick={onViewClick}>View</button>
        <button className="view-button" onClick={onOperateClick}>Operate</button>
        </div>
        </div>
    )
    }