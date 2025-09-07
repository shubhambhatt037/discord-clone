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
  const [socket, setSocket] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check if Pusher environment variables are available
    if (!process.env.NEXT_PUBLIC_PUSHER_KEY) {
      console.log("Pusher disabled - NEXT_PUBLIC_PUSHER_KEY not set");
      setIsConnected(false);
      return;
    }

    try {
      if (!pusherClient) {
        console.log("Pusher client not available");
        setIsConnected(false);
        return;
      }

      setSocket(pusherClient);
      
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

      pusherClient.connection.bind("unavailable", () => {
        console.warn("Pusher connection unavailable - falling back to polling");
        setIsConnected(false);
      });

      pusherClient.connection.bind("failed", () => {
        console.error("Pusher connection failed");
        setIsConnected(false);
      });

    } catch (error) {
      console.error("Failed to initialize Pusher:", error);
      setIsConnected(false);
    }

    // Cleanup on unmount
    return () => {
      try {
        if (pusherClient) {
          pusherClient.connection.unbind_all();
        }
      } catch (error) {
        console.error("Error cleaning up Pusher:", error);
      }
    }
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  )
}