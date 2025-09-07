"use client";

import { 
  createContext,
  useContext,
  useEffect,
  useState
} from "react";
import { pusherClient } from "@/lib/pusher";

type SocketContextType = {
  socket: any | null;
  isConnected: boolean;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ 
  children 
}: { 
  children: React.ReactNode 
}) => {
  const [socket, setSocket] = useState(pusherClient);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Pusher connection state handlers
    pusherClient.connection.bind("connected", () => {
      setIsConnected(true);
      console.log("Pusher connected successfully");
    });

    pusherClient.connection.bind("disconnected", () => {
      setIsConnected(false);
      console.log("Pusher disconnected");
    });

    pusherClient.connection.bind("error", (error: any) => {
      console.error("Pusher connection error:", error);
      setIsConnected(false);
    });

    // Cleanup on unmount
    return () => {
      pusherClient.connection.unbind_all();
    }
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  )
}