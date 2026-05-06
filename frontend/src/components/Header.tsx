type HeaderProps = {
  onOpenSettings: () => void;
  onResetClick: () => void;
  onLaughCountClick: () => void;
  onPressLogClick: () => void;
  isLaughCounter: boolean;
  view: boolean;
};

export default function Header({
  view,
  onOpenSettings,
  onResetClick,
  onLaughCountClick,
  onPressLogClick,
  isLaughCounter,
}: HeaderProps) {
  return (
    <header className="App-header">
      {view ? null : (
        <div className="header-buttons">
          <button onClick={onOpenSettings}>Settings</button>
          <button onClick={onLaughCountClick}>{isLaughCounter ? "LaughCount: On" : "LaughCount: Off"}</button>
          <button onClick={onPressLogClick}>Card Press Log</button>
          <button onClick={onResetClick}>Reset</button>
        </div>
      )}

      <div className="header-title">
        <h1>LOL Judge</h1>
        <img src="./logo.png" alt="LOL Judge Logo" className="header-logo" />
        <img src="./prime.png" alt="Prime Logo" className="header-logo" />
      </div>
    </header>
  );
}
