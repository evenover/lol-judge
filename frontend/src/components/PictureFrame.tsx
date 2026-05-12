import { useEffect, useMemo, useRef, useState } from "react";
import Socket from "../socket.js";

type Lane = "single" | "left" | "right";

type PictureFrameProps = {
  index: number;
  lane?: Lane;
  picture: string;
  view: boolean;
  laughtercount: boolean;
  enabledCardTypes: string[];
  triumphCards: string[];
};

type FrameState = {
  cards: Record<string, boolean>;
  laughCounter: number;
  label: string;
  picture: string;
};

const EMPTY_STATE: FrameState = {
  cards: {},
  laughCounter: 0,
  label: "",
  picture: "/profileplaceholder.jpg",
};

function buildKeys(lane: Lane) {
  if (lane === "single") {
    return {
      laughCounter: "laughCounter",
      label: "Label",
      picture: "picture",
    };
  }

  const suffix = lane === "left" ? "Left" : "Right";
  return {
    laughCounter: `laughCounter${suffix}`,
    label: `Label${suffix}`,
    picture: `picture${suffix}`,
  };
}

function normalizeCardType(type: string) {
  return type.trim().toLowerCase();
}

function isValidCssColor(input: string) {
  if (typeof CSS === "undefined" || typeof CSS.supports !== "function") {
    return /^[a-z][a-z0-9-]{1,23}$/i.test(input);
  }
  return CSS.supports("color", input);
}

function getTextColorForBackground(colorName: string) {
  const lightColors = new Set(["yellow", "white", "lime", "orange", "cyan", "gold", "pink"]);
  return lightColors.has(colorName) ? "#111" : "#fff";
}

export default function PictureFrame({
  index,
  lane = "single",
  picture,
  view,
  laughtercount,
  enabledCardTypes,
  triumphCards,
}: PictureFrameProps) {
  const [state, setState] = useState<FrameState>({ ...EMPTY_STATE, picture });
  const [pairRed, setPairRed] = useState(false);
  const keys = useMemo(() => buildKeys(lane), [lane]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const enabledTypes = useMemo(
    () => enabledCardTypes.map(normalizeCardType),
    [enabledCardTypes],
  );

  const emitPatch = (patch: Record<string, unknown>) => {
    Socket.emit("card:update", { index, lane, patch });
  };

  const setCardToggle = (cardType: string, cardIndex: number) => {
    const type = normalizeCardType(cardType);
    const cardKey = `${type}@${cardIndex}`;
    setState((prev) => {
      const nextValue = !Boolean(prev.cards[cardKey]);
      const nextCards = { ...prev.cards, [cardKey]: nextValue };
      emitPatch({ cards: nextCards });
      return { ...prev, cards: nextCards };
    });
  };

  const updateLaughCounter = (delta: number) => {
    setState((prev) => {
      const nextValue = Math.max(0, prev.laughCounter + delta);
      emitPatch({ [keys.laughCounter]: nextValue });
      return { ...prev, laughCounter: nextValue };
    });
  };

  const saveLabel = () => {
    emitPatch({ [keys.label]: state.label });
  };

  const applyPicture = (nextPicture: string) => {
    setState((prev) => ({ ...prev, picture: nextPicture }));
    emitPatch({ [keys.picture]: nextPicture });
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Only image files are allowed");
      return;
    }

    if (file.size > 500 * 1024) {
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
        applyPicture(data.url);
      } catch (error) {
        console.error("Error uploading picture:", error);
        alert("Failed to upload the picture");
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        applyPicture(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (!file) {
      return;
    }

    await processFile(file);
  };

  const hydrateCards = (laneData: Record<string, any>, previousCards: Record<string, boolean>) => {
    if (laneData.cards && typeof laneData.cards === "object") {
      return laneData.cards as Record<string, boolean>;
    }

    const legacyMap: Record<string, string> = {
      yellow: lane === "single" ? "isYellow" : lane === "left" ? "isYellowLeft" : "isYellowRight",
      red: lane === "single" ? "isRed" : lane === "left" ? "isRedLeft" : "isRedRight",
      black: lane === "single" ? "isBlack" : lane === "left" ? "isBlackLeft" : "isBlackRight",
      white: lane === "single" ? "isWhite" : lane === "left" ? "isWhiteLeft" : "isWhiteRight",
    };

    const mergedCards = { ...previousCards };
    for (const [type, legacyKey] of Object.entries(legacyMap)) {
      if (laneData[legacyKey] !== undefined) {
        mergedCards[type] = Boolean(laneData[legacyKey]);
      }
    }

    return mergedCards;
  };

  const hydrateFromLaneData = (laneData: Record<string, unknown>) => {
    setState((prev) => {
      const nextCards = hydrateCards(laneData as Record<string, any>, prev.cards);
      return {
        ...prev,
        cards: nextCards,
        laughCounter: Number(laneData[keys.laughCounter] ?? prev.laughCounter),
        label: String(laneData[keys.label] ?? prev.label),
        picture: String(laneData[keys.picture] ?? prev.picture),
      };
    });
  };

  useEffect(() => {
    setState({ ...EMPTY_STATE, picture });
    setPairRed(false);

    const onCardState = (data: any) => {
      if (data.index !== index || !data.card) {
        return;
      }

      const laneData = data.card[lane] || {};
      hydrateFromLaneData(laneData);

      if (lane !== "single") {
        const leftRedCards = data.card.left?.cards || {};
        const rightRedCards = data.card.right?.cards || {};
        const leftRed = Object.keys(leftRedCards).some(key => key.startsWith("red@") && leftRedCards[key]) || Boolean(data.card.left?.isRedLeft);
        const rightRed = Object.keys(rightRedCards).some(key => key.startsWith("red@") && rightRedCards[key]) || Boolean(data.card.right?.isRedRight);
        setPairRed(leftRed || rightRed);
      }
    };

    const onCardUpdate = (data: any) => {
      if (data.index !== index || data.lane !== lane) {
        return;
      }
      hydrateFromLaneData(data.patch || {});
    };

    const onCardsReset = () => {
      setState({ ...EMPTY_STATE, picture });
      setPairRed(false);
    };

    Socket.on("card:state", onCardState);
    Socket.on("card:update", onCardUpdate);
    Socket.on("cards:reset", onCardsReset);

    Socket.emit("card:get", { index });

    return () => {
      Socket.off("card:state", onCardState);
      Socket.off("card:update", onCardUpdate);
      Socket.off("cards:reset", onCardsReset);
    };
  }, [index, lane, picture]);

  useEffect(() => {
    const onCardUpdate = (data: any) => {
      if (data.index !== index || lane === "single") {
        return;
      }

      if (data.lane === "left" || data.lane === "right") {
        Socket.emit("card:get", { index });
      }
    };

    Socket.on("card:update", onCardUpdate);
    return () => {
      Socket.off("card:update", onCardUpdate);
    };
  }, [index, lane]);

  const hasActiveTriumphCard = triumphCards.some((cardType) => {
    const normalizedType = normalizeCardType(cardType);
    return enabledCardTypes.some((enabled, idx) => {
      const enabledNormalized = normalizeCardType(enabled);
      const cardKey = `${enabledNormalized}@${idx}`;
      return enabledNormalized === normalizedType && state.cards[cardKey];
    });
  });

  const primaryRedCount = Object.keys(state.cards).filter(key => key.startsWith("red@") && key !== "red@secondary" && state.cards[key]).length;
  const secondaryRedActive = state.cards["red@secondary"];
  const totalRedCount = primaryRedCount + (secondaryRedActive ? 1 : 0);
  
  const effectiveRed = lane === "single" 
    ? totalRedCount >= 2 ? true : (hasActiveTriumphCard ? false : primaryRedCount > 0)
    : pairRed;
  const isPlaceholderPicture = !state.picture || state.picture === "/profileplaceholder.jpg";
  const laughCounterClassName =
    lane === "single"
      ? "picture-frame-laughcounter"
      : lane === "right"
        ? "picture-frame-dual-laughcounter-right"
        : "picture-frame-dual-laughcounter-left";

  return (
    <div className="picture-frame">
      <div
        className="picture-frame-inner"
        onDrop={view ? undefined : handleDrop}
        onDragOver={(event) => event.preventDefault()}
      >
        <div className="cards">
          {enabledTypes.map((cardType, idx) => {
            const cardKey = `${normalizeCardType(cardType)}@${idx}`;
            if (!state.cards[cardKey]) {
              return null;
            }

            const normalizedType = normalizeCardType(cardType);
            const backgroundColor = isValidCssColor(normalizedType) ? normalizedType : "#888";
            return (
              <div
                key={cardKey}
                className="dynamic-card"
                style={{ backgroundColor, color: getTextColorForBackground(normalizedType) }}
                title={normalizedType}
              >
                {normalizedType.slice(0, 1).toUpperCase()}
              </div>
            );
          })}
          {secondaryRedActive ? (
            <div
              className="dynamic-card"
              style={{ backgroundColor: "red", color: getTextColorForBackground("red") }}
              title="red (2nd)"
            >
              R
            </div>
          ) : null}
        </div>

        {laughtercount ? <div className={laughCounterClassName}>{state.laughCounter}</div> : null}

        <img
          src={state.picture}
          alt="Contestant"
          id={effectiveRed ? "greyscale" : "color"}
          className={!view && isPlaceholderPicture ? "uploadable-placeholder" : ""}
          onClick={() => {
            if (!view && isPlaceholderPicture) {
              fileInputRef.current?.click();
            }
          }}
        />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden-file-input"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void processFile(file);
            }
            event.target.value = "";
          }}
        />

        <input
          type="text"
          value={state.label}
          readOnly={view}
          className="picture-frame-label"
          onChange={(e) => setState((prev) => ({ ...prev, label: e.target.value }))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              saveLabel();
            }
          }}
        />
      </div>

      {view ? null : (
        <div className="picture-frame-buttons">
          {enabledTypes.map((cardType, idx) => {
            const normalizedType = normalizeCardType(cardType);
            const cardKey = `${normalizedType}@${idx}`;
            return (
              <button
                key={cardKey}
                className={state.cards[cardKey] ? "active" : ""}
                onClick={() => setCardToggle(cardType, idx)}
                title={`${normalizedType}: ${state.cards[cardKey] ? "on" : "off"}`}
              >
                {normalizedType}
              </button>
            );
          })}
          {hasActiveTriumphCard && primaryRedCount >= 1 && (primaryRedCount === 1 || secondaryRedActive) ? (
            <button
              className={`second-red-button${secondaryRedActive ? " active" : ""}`}
              onClick={() => {
                setState((prev) => {
                  const nextCards = { ...prev.cards, "red@secondary": !prev.cards["red@secondary"] };
                  emitPatch({ cards: nextCards });
                  return { ...prev, cards: nextCards };
                });
              }}
              title={secondaryRedActive ? "Remove second red card" : "Add second red card"}
            >
              Red (2nd)
            </button>
          ) : null}
          {laughtercount ? (
            <div className="laugh-controls">
              <button className="laugh-button" onClick={() => updateLaughCounter(-1)}>
                Laugh -
              </button>
              <button className="laugh-button" onClick={() => updateLaughCounter(1)}>
                Laugh +
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
