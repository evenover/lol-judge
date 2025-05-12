

type cardProps = {
    name: string;
    value: boolean;
    color: string;
}

export default function Card({name, value, color}: cardProps) {
    const isCardActive = value;
    return (
        <div
            key={name}
            className={`card ${color}-card ${isCardActive ? "active" : ""}`}
            id="card"
        ></div>
    );

    
}