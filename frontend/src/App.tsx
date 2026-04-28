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
};

const DEFAULT_SETTINGS: AppSettings = {
  dual: true,
  contestants: 8,
  isLaughCounter: false,
  cardTypes: ["yellow", "red", "black", "white"],
  teamCardTypes: ["orange1", "orange2"],
};

type PairState = {
  cards: Record<string, boolean>;
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

    Socket.on("app:init", handleInit);
    Socket.on("settings:update", handleSettingsUpdate);
    Socket.on("pair:update", handlePairUpdate);
    Socket.on("card:state", handleCardState);
    Socket.on("cards:reset", handleCardsReset);

    return () => {
      Socket.off("app:init", handleInit);
      Socket.off("settings:update", handleSettingsUpdate);
      Socket.off("pair:update", handlePairUpdate);
      Socket.off("card:state", handleCardState);
      Socket.off("cards:reset", handleCardsReset);
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

  const saveSettings = async (nextSettings: AppSettings) => {
    const normalizedTypes = [...new Set(["yellow", "red", ...nextSettings.cardTypes.map((type) => type.toLowerCase())])];
    const normalizedTeamTypes = [...new Set(nextSettings.teamCardTypes.map((type) => type.toLowerCase()))];
    const normalizedSettings = { ...nextSettings, cardTypes: normalizedTypes, teamCardTypes: normalizedTeamTypes };

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
            isLaughCounter={settings.isLaughCounter}
            view={isView}
          />

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
                        />
                        <PictureFrame
                          index={index}
                          lane="right"
                          picture="/profileplaceholder.jpg"
                          view={isView}
                          laughtercount={settings.isLaughCounter}
                          enabledCardTypes={settings.cardTypes}
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
                  />
                ))}
          </div>
        </>
      )}
    </div>
  );
}
