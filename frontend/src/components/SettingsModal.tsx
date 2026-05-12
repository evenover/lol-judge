import { useEffect, useState } from "react";

type AppSettings = {
  dual: boolean;
  contestants: number;
  isLaughCounter: boolean;
  cardTypes: string[];
  teamCardTypes: string[];
  triumphCards: string[];
};

type SettingsModalProps = {
  open: boolean;
  settings: AppSettings;
  onClose: () => void;
  onSave: (nextSettings: AppSettings) => void;
};

const REQUIRED_CARD_TYPES = ["yellow", "red"];
const PRESET_CARD_TYPES = ["black", "white", "blue", "green", "purple", "orange"];

export default function SettingsModal({ open, settings, onClose, onSave }: SettingsModalProps) {
  const [draft, setDraft] = useState<AppSettings>(settings);
  const [newCardType, setNewCardType] = useState("");
  const [newTeamCardType, setNewTeamCardType] = useState("");

  useEffect(() => {
    setDraft(settings);
    setNewCardType("");
    setNewTeamCardType("");
  }, [settings]);

  if (!open) {
    return null;
  }

  const removeCardType = (index: number) => {
    const cardType = draft.cardTypes[index];
    if (REQUIRED_CARD_TYPES.includes(cardType) && draft.cardTypes.filter((ct) => ct === cardType).length === 1) {
      return;
    }

    setDraft((prev) => {
      const nextCardTypes = prev.cardTypes.filter((_, i) => i !== index);
      return {
        ...prev,
        cardTypes: nextCardTypes,
      };
    });
  };

  const moveCardTypeUp = (index: number) => {
    if (index <= 0) return;

    setDraft((prev) => {
      const nextCardTypes = [...prev.cardTypes];
      [nextCardTypes[index - 1], nextCardTypes[index]] = [nextCardTypes[index], nextCardTypes[index - 1]];
      return {
        ...prev,
        cardTypes: nextCardTypes,
      };
    });
  };

  const moveCardTypeDown = (index: number) => {
    if (index >= draft.cardTypes.length - 1) return;

    setDraft((prev) => {
      const nextCardTypes = [...prev.cardTypes];
      [nextCardTypes[index], nextCardTypes[index + 1]] = [nextCardTypes[index + 1], nextCardTypes[index]];
      return {
        ...prev,
        cardTypes: nextCardTypes,
      };
    });
  };

  const addCustomCardType = () => {
    const normalized = newCardType.trim().toLowerCase();
    if (!/^[a-z][a-z0-9-]{1,23}$/.test(normalized)) {
      return;
    }

    setDraft((prev) => {
      return {
        ...prev,
        cardTypes: [...prev.cardTypes, normalized],
      };
    });

    setNewCardType("");
  };

  const toggleTeamCardType = (cardType: string) => {
    setDraft((prev) => {
      const hasCardType = prev.teamCardTypes.includes(cardType);
      return {
        ...prev,
        teamCardTypes: hasCardType
          ? prev.teamCardTypes.filter((item) => item !== cardType)
          : [...prev.teamCardTypes, cardType],
      };
    });
  };

  const addCustomTeamCardType = () => {
    const normalized = newTeamCardType.trim().toLowerCase();
    if (!/^[a-z][a-z0-9-]{1,23}$/.test(normalized)) {
      return;
    }

    setDraft((prev) => {
      if (prev.teamCardTypes.includes(normalized)) {
        return prev;
      }

      return {
        ...prev,
        teamCardTypes: [...prev.teamCardTypes, normalized],
      };
    });

    setNewTeamCardType("");
  };

  const save = () => {
    const contestants = Math.max(2, draft.contestants);
    const normalizedContestants = draft.dual && contestants % 2 !== 0 ? contestants + 1 : contestants;
    const normalizedCardTypes = draft.cardTypes.map((type) => type.toLowerCase());
    const hasRequired = REQUIRED_CARD_TYPES.every((req) => normalizedCardTypes.includes(req));
    const finalCardTypes = hasRequired ? normalizedCardTypes : [...REQUIRED_CARD_TYPES, ...normalizedCardTypes];

    onSave({
      ...draft,
      contestants: normalizedContestants,
      cardTypes: finalCardTypes,
      teamCardTypes: [...new Set(draft.teamCardTypes.map((type) => type.toLowerCase()))],
      triumphCards: draft.triumphCards.map((type) => type.toLowerCase()),
    });
  };

  const quickAddChoices = PRESET_CARD_TYPES.filter((cardType) => !draft.cardTypes.includes(cardType));
  const sortedTeamCardTypes = [...new Set(draft.teamCardTypes)];

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(event) => event.stopPropagation()}>
        <h2>Card Settings</h2>

        <label className="settings-row">
          <span>Dual mode (2v2 cards)</span>
          <input
            type="checkbox"
            checked={draft.dual}
            onChange={(e) => setDraft((prev) => ({ ...prev, dual: e.target.checked }))}
          />
        </label>

        <label className="settings-row">
          <span>Contestants</span>
          <input
            type="number"
            min={2}
            max={30}
            value={draft.contestants}
            onChange={(e) => setDraft((prev) => ({ ...prev, contestants: Number(e.target.value) || 2 }))}
          />
        </label>

        <label className="settings-row">
          <span>Show laugh counter</span>
          <input
            type="checkbox"
            checked={draft.isLaughCounter}
            onChange={(e) => setDraft((prev) => ({ ...prev, isLaughCounter: e.target.checked }))}
          />
        </label>

        <div className="settings-card-types">
          <p>Enabled card types</p>
          {draft.cardTypes.map((cardType, index) => {
            const isRequired = REQUIRED_CARD_TYPES.includes(cardType) && draft.cardTypes.filter((ct) => ct === cardType).length === 1;
            const isTriumph = draft.triumphCards.includes(cardType);
            return (
              <div key={index} className="settings-card-item">
                <span>{cardType}{isRequired ? " (required)" : ""}</span>
                <label className="settings-triumph-checkbox">
                  <input
                    type="checkbox"
                    checked={isTriumph}
                    onChange={() =>
                      setDraft((prev) => {
                        const hasTriumph = prev.triumphCards.includes(cardType);
                        return {
                          ...prev,
                          triumphCards: hasTriumph
                            ? prev.triumphCards.filter((c) => c !== cardType)
                            : [...prev.triumphCards, cardType],
                        };
                      })
                    }
                  />
                  <span>Triumph</span>
                </label>
                <div className="settings-card-buttons">
                  <button
                    className="settings-move-button"
                    onClick={() => moveCardTypeUp(index)}
                    disabled={index === 0}
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    className="settings-move-button"
                    onClick={() => moveCardTypeDown(index)}
                    disabled={index === draft.cardTypes.length - 1}
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    className="settings-remove-button"
                    onClick={() => removeCardType(index)}
                    disabled={isRequired}
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}

          <div className="settings-add-card-row">
            <input
              type="text"
              value={newCardType}
              placeholder="Add color name (e.g. cyan)"
              onChange={(e) => setNewCardType(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  addCustomCardType();
                }
              }}
            />
            <button onClick={addCustomCardType}>Add</button>
          </div>

          <div className="settings-quick-add">
            {quickAddChoices.map((cardType) => (
              <button key={cardType} onClick={() => setDraft((prev) => ({ ...prev, cardTypes: [...prev.cardTypes, cardType] }))}>
                + {cardType}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-card-types">
          <p>Enabled dual team card types</p>
          {sortedTeamCardTypes.map((cardType) => (
            <label key={cardType} className="settings-checkbox-row">
              <input
                type="checkbox"
                checked={true}
                onChange={() => toggleTeamCardType(cardType)}
              />
              <span>{cardType}</span>
            </label>
          ))}

          <div className="settings-add-card-row">
            <input
              type="text"
              value={newTeamCardType}
              placeholder="Add team card type (e.g. orange1)"
              onChange={(e) => setNewTeamCardType(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  addCustomTeamCardType();
                }
              }}
            />
            <button onClick={addCustomTeamCardType}>Add</button>
          </div>
        </div>

        <div className="settings-actions">
          <button onClick={onClose}>Cancel</button>
          <button onClick={save}>Save</button>
        </div>
      </div>
    </div>
  );
}
