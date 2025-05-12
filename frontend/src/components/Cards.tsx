import Card from "./Card";

type cardsProps = {
    cards: {
        name: string;
        value: boolean;
        color: string;
    }[];   
}

export default function Cards({cards}: cardsProps) {
    return (
        <div className="cards">
            <div className="cards-inner">
                {cards.map((card) => {
                    const isCardActive = card.value;
                    return (
                        <Card
                            key={card.name}
                            name={card.name}
                            value={isCardActive}
                            color={card.color}
                        />
                    );
                })}
            </div>
        </div>
    );
}