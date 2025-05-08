type HeaderProps = {
    onDualClick: () => void;
    onContestantsChange?: (newContestants: number) => void;
    onResetClick: () => void;
    onLaughCountClick: () => void;
    dual: boolean;
    view: boolean;
}
export default function Header({ view, dual, onDualClick, onContestantsChange, onResetClick, onLaughCountClick }: HeaderProps) {
    

    return (
        <header className="App-header">
          {view ? "" :  <div className="header-buttons">
        <button onClick={onDualClick}>{dual ? "Halloween" : "Standard"}</button>
        {dual ? null : <>
        <button onClick={() => onContestantsChange && onContestantsChange(10)}>10</button>
        <button onClick={() => onContestantsChange && onContestantsChange(11)}>11</button>
        </>
        }
        <button onClick={onLaughCountClick}>LaughCount</button>
        <button onClick={onResetClick}>Reset</button>
        </div>
        }
        
        <div className="header-title">
        <h1>LOL Judge</h1>
        <img src="./logo.png" alt="LOL Judge Logo" className="header-logo" />
        <img src="./prime.png" alt="Prime Logo" className="header-logo" />
        </div>
        </header>
    )
    }