import { useEffect, useMemo, useState } from "react";
import Socket from "./socket.js";
import "./App.css";
import Header from "./components/Header.js";
import PictureFrame from "./components/PictureFrame";
import StartMenu from "./components/StartMenu.js";
import SettingsModal from "./components/SettingsModal.js";

type AppSettings = {
  dual: boolean;
  contestants: number;
  isLaughCounter: boolean;
  cardTypes: string[];
  teamCardTypes: string[];
  triumphCards: string[];
};

const DEFAULT_SETTINGS: AppSettings = {
  dual: true,
  contestants: 8,
  isLaughCounter: false,
  cardTypes: ["yellow", "red", "black", "white"],
  teamCardTypes: ["orange1", "orange2"],
  triumphCards: [],
};

type PairState = {
  cards: Record<string, boolean>;
};

type CardPressLogEntry = {
  id: string;
  timestamp: string;
  timeOfDay: string;
  index: number;
  lane: "single" | "left" | "right" | "pair";
  cardType: string;
  player: string;
  label: string;
};

function getLegacyTeamCards(pairData: Record<string, unknown>) {
  return {
    orange1: Boolean(pairData.isOrange1),
    orange2: Boolean(pairData.isOrange2),
  };
}

function getPairState(pairData: Record<string, unknown> | undefined): PairState {
  const safeData = pairData || {};
  const cardsFromData = safeData.cards && typeof safeData.cards === "object" ? (safeData.cards as Record<string, boolean>) : {};

  return {
    cards: {
      ...getLegacyTeamCards(safeData),
      ...cardsFromData,
    },
  };
}

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isStarted, setIsStarted] = useState(true);
  const [isView, setIsView] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pairCards, setPairCards] = useState<Record<number, PairState>>({});
  const [pressLog, setPressLog] = useState<CardPressLogEntry[]>([]);
  const [showPressLog, setShowPressLog] = useState(false);

  useEffect(() => {
    if (!Socket.connected) {
      Socket.connect();
    }

    const currentPath = window.location.pathname;
    if (currentPath === "/view") {
      setIsStarted(false);
      setIsView(true);
    }

    const handleInit = (data: any) => {
      if (data.settings) {
        setSettings((prev) => ({ ...prev, ...data.settings }));
      }

      if (Array.isArray(data.pressLog)) {
        setPressLog(data.pressLog);
      }
    };

    const handleSettingsUpdate = (nextSettings: AppSettings) => {
      setSettings((prev) => ({ ...prev, ...nextSettings }));
    };

    const handlePairUpdate = (data: any) => {
      if (typeof data.index !== "number") {
        return;
      }

      setPairCards((prev) => ({
        ...prev,
        [data.index]: getPairState({
          ...(prev[data.index] || {}),
          ...(data.patch || {}),
          cards: {
            ...((prev[data.index] || { cards: {} }).cards || {}),
            ...((data.patch || {}).cards || {}),
          },
        }),
      }));
    };

    const handleCardState = (data: any) => {
      if (typeof data.index !== "number" || !data.card?.pair) {
        return;
      }

      setPairCards((prev) => ({
        ...prev,
        [data.index]: getPairState({
          ...(prev[data.index] || {}),
          ...(data.card.pair || {}),
          cards: {
            ...((prev[data.index] || { cards: {} }).cards || {}),
            ...((data.card.pair || {}).cards || {}),
          },
        }),
      }));
    };

    const handleCardsReset = () => {
      setPairCards({});
    };

    const handlePressLog = (entries: CardPressLogEntry[]) => {
      if (!Array.isArray(entries)) {
        return;
      }
      setPressLog(entries);
    };

    const handlePressLogUpdate = (entries: CardPressLogEntry[]) => {
      if (!Array.isArray(entries) || entries.length === 0) {
        return;
      }
      setPressLog((prev) => [...entries, ...prev]);
    };

    Socket.on("app:init", handleInit);
    Socket.on("settings:update", handleSettingsUpdate);
    Socket.on("pair:update", handlePairUpdate);
    Socket.on("card:state", handleCardState);
    Socket.on("cards:reset", handleCardsReset);
    Socket.on("card:press-log", handlePressLog);
    Socket.on("card:press-log:update", handlePressLogUpdate);

    return () => {
      Socket.off("app:init", handleInit);
      Socket.off("settings:update", handleSettingsUpdate);
      Socket.off("pair:update", handlePairUpdate);
      Socket.off("card:state", handleCardState);
      Socket.off("cards:reset", handleCardsReset);
      Socket.off("card:press-log", handlePressLog);
      Socket.off("card:press-log:update", handlePressLogUpdate);
      Socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!settings.dual) {
      return;
    }

    const pairs = Math.floor(settings.contestants / 2);
    for (let index = 0; index < pairs; index += 1) {
      Socket.emit("card:get", { index });
    }
  }, [settings.dual, settings.contestants]);

  const handleView = () => {
    setIsStarted(false);
    setIsView(true);
  };

  const handleOperate = () => {
    setIsStarted(false);
    setIsView(false);
  };

  const handleResetStats = () => {
    Socket.emit("resetstats");
  };

  const toggleLaughCounter = () => {
    Socket.emit("settings:update", { isLaughCounter: !settings.isLaughCounter });
  };

  const openPressLog = () => {
    setShowPressLog(true);
    Socket.emit("card:press-log:get");
  };

  const clearPressLog = () => {
    setPressLog([]);
    Socket.emit("card:press-log:clear");
  };

  const saveSettings = async (nextSettings: AppSettings) => {
    const normalizedTeamTypes = [...new Set(nextSettings.teamCardTypes.map((type) => type.toLowerCase()))];
    const normalizedSettings = { ...nextSettings, teamCardTypes: normalizedTeamTypes };

    setSettingsOpen(false);
    Socket.emit("settings:update", normalizedSettings);

    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(normalizedSettings),
      });
    } catch (error) {
      console.error("Failed to persist settings via API, websocket update still applied.", error);
    }
  };

  const singlePictures = useMemo(
    () => Array(settings.contestants).fill("/profileplaceholder.jpg"),
    [settings.contestants],
  );

  const dualPairs = useMemo(() => {
    const pairCount = Math.floor(settings.contestants / 2);
    return Array.from({ length: pairCount }, (_, index) => index);
  }, [settings.contestants]);

  const renderPressLogDescription = (entry: CardPressLogEntry) => {
    const labelPrefix = entry.label ? `${entry.label} - ` : "";
    
    // Extract just the color from the card type (remove @x suffix)
    const cardColor = entry.cardType.split("@")[0].toLowerCase();
    let cardLabel = cardColor;
    
    // Special handling for secondary red card
    if (entry.cardType === "red@secondary") {
      cardLabel = "red (2nd)";
    }
    
    if (entry.lane === "pair") {
      return `${entry.timeOfDay} - ${entry.player}: ${cardLabel.toUpperCase()} team card`;
    }
    return `${entry.timeOfDay} - ${labelPrefix}${entry.player}: ${cardLabel.toUpperCase()} card`;
  };

  return (
    <div className="App">
      {isStarted ? (
        <StartMenu onViewClick={handleView} onOperateClick={handleOperate} />
      ) : (
        <>
          <Header
            onOpenSettings={() => setSettingsOpen(true)}
            onResetClick={handleResetStats}
            onLaughCountClick={toggleLaughCounter}
            onPressLogClick={openPressLog}
            isLaughCounter={settings.isLaughCounter}
            view={isView}
          />

          {!isView && showPressLog ? (
            <div className="press-log-overlay" onClick={() => setShowPressLog(false)}>
              <div className="press-log-modal" onClick={(event) => event.stopPropagation()}>
                <div className="press-log-header">
                  <h2>Card Press Log</h2>
                  <div>
                    {pressLog.length > 0 && (
                      <button onClick={clearPressLog} className="clear-button">
                        Clear
                      </button>
                    )}
                    <button onClick={() => setShowPressLog(false)}>Close</button>
                  </div>
                </div>
                {pressLog.length === 0 ? (
                  <p className="press-log-empty">No card presses registered yet.</p>
                ) : (
                  <ul className="press-log-list">
                    {pressLog.map((entry) => (
                      <li key={entry.id}>{renderPressLogDescription(entry)}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : null}

          <SettingsModal
            open={settingsOpen}
            settings={settings}
            onClose={() => setSettingsOpen(false)}
            onSave={saveSettings}
          />

          <div className={"Canvas" + (settings.dual ? "-dual" : "")}>
            {settings.dual
              ? dualPairs.map((index) => {
                  const pairState = pairCards[index] || { cards: {} };

                  return (
                    <div key={index} className="picture-frame-dual">
                      <div className="picture-frame-dual-inner">
                        <div className="picture-frame-dual-cards">
                          {settings.teamCardTypes.map((teamCardType) =>
                            pairState.cards[teamCardType] ? (
                              <div key={teamCardType} className="team-dynamic-card" title={teamCardType}>
                                {teamCardType.slice(0, 2).toUpperCase()}
                              </div>
                            ) : null,
                          )}
                        </div>

                        <PictureFrame
                          index={index}
                          lane="left"
                          picture="/profileplaceholder.jpg"
                          view={isView}
                          laughtercount={settings.isLaughCounter}
                          enabledCardTypes={settings.cardTypes}
                          triumphCards={settings.triumphCards}
                        />
                        <PictureFrame
                          index={index}
                          lane="right"
                          picture="/profileplaceholder.jpg"
                          view={isView}
                          laughtercount={settings.isLaughCounter}
                          enabledCardTypes={settings.cardTypes}
                          triumphCards={settings.triumphCards}
                        />
                      </div>

                      {isView ? null : (
                        <div className="picture-frame-dual-buttons">
                          {settings.teamCardTypes.map((teamCardType) => {
                            const nextCards = {
                              ...pairState.cards,
                              [teamCardType]: !pairState.cards[teamCardType],
                            };

                            return (
                              <button
                                key={teamCardType}
                                className={pairState.cards[teamCardType] ? "active" : ""}
                                onClick={() =>
                                  Socket.emit("pair:update", {
                                    index,
                                    patch: { cards: nextCards },
                                  })
                                }
                              >
                                {teamCardType}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              : singlePictures.map((picture, index) => (
                  <PictureFrame
                    key={index}
                    picture={picture}
                    view={isView}
                    index={index}
                    laughtercount={settings.isLaughCounter}
                    enabledCardTypes={settings.cardTypes}
                    triumphCards={settings.triumphCards}
                  />
                ))}
          </div>
        </>
      )}
    </div>
  );
}
