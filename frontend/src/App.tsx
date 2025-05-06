import { useState, useEffect, useCallback } from 'react';
import Socket from './socket.js';
import './App.css';
import Header from './components/Header.js';
import PictureFrame from './components/PictureFrame.js';
import PictureFrameDual from './components/PictureFrameDual.js';
import StartMenu from './components/StartMenu.js';

function App() {

  useEffect(() => {
    if (!Socket.connected) {
      Socket.connect();
    }

      const currentPath = window.location.pathname;
      if (currentPath === '/view'){
        setIsView(true);
      }

    const handleDual = (data: any) => {
      setIsDual(data.dual);
    };

    const handleContestants = (data: any) => {
      setContestants(data.contestants);
    };

    const handleResetStats = () => {
      // Reset global state
    };

    Socket.on("dual", handleDual);
    Socket.on("contestants", handleContestants);
    Socket.on("resetstats", handleResetStats);

    return () => {
      Socket.off("dual", handleDual);
      Socket.off("contestants", handleContestants);
      Socket.off("resetstats", handleResetStats);
      Socket.disconnect();
    };
  }, []);

  const [isDual, setIsDual] = useState(true);
  const [Contestants, setContestants] = useState(8);
  const [isStarted, setIsStarted] = useState(true);
  const [isView, setIsView] = useState(false);

  const pictures = Array(Contestants).fill('/profileplaceholder.jpg'); // Use the placeholder image for all pictures

   // Check if the current path is "/view" and set isView to true
   useEffect(() => {
    if (location.pathname === "/view") {
      setIsStarted(false);
      setIsView(true);
    }
  }, [location.pathname]);

  const handleContestantsChange = (newContestants: number) => {
    setContestants(newContestants);
    Socket.emit("contestants", {contestants: newContestants})
  };

  const toggleDual = useCallback(() => {
    if (isDual) {
      setContestants(10); // Reset to 10 contestants when toggling
      Socket.emit("contestants", {contestants: 10} )
    } else {
      setContestants(8); // Set to 8 contestants when toggling
      Socket.emit("contestants", {contestants: 8} )
    }
    Socket.emit("dual", {dual: !isDual});
    setIsDual(!isDual);
  }, [isDual]);

  const handleView = () => {
    setIsStarted(false);
    setIsView(true);
  };

  const handleOperate = () => {
    setIsStarted(false);
    setIsView(false);
  };

  const handleresetstats = () => {
    Socket.emit("resetstats")
  }

  return (
    <div className="App">
      {isStarted ? (
        <StartMenu onViewClick={handleView} onOperateClick={handleOperate} />
      ) : (
        <>
          <Header
            onDualClick={toggleDual}
            onContestantsChange={handleContestantsChange}
            onResetClick={handleresetstats}
            dual={isDual}
            view={isView}
          />
          <div className={"Canvas" + (isDual ? "-dual" : "")}>
            {isDual ? (
              <>
                {pictures
                  .reduce((pairs: [string, string][], _, index, arr) => {
                    if (index % 2 === 0 && arr[index + 1]) {
                      pairs.push([arr[index], arr[index + 1]]);
                    }
                    return pairs;
                  }, [])
                  .map(([left, right]: [string, string], index) => (
                    <PictureFrameDual
                      key={index}
                      pictureleft={left}
                      pictureright={right}
                      view={isView}
                      index={index}
                    />
                  ))}
              </>
            ) : (
              <>
                {pictures.map((picture, index) => (
                  <PictureFrame
                    key={index}
                    picture={picture}
                    view={isView}
                    index={index}
                  />
                ))}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
