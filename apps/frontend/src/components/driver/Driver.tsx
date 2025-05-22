import { useRef, useState } from "react";
import Login from "../Login";
import { io, Socket } from "socket.io-client";

type actions = "login" | "simulate";

function Driver() {
	const [action, setAction] = useState<actions>("login");
	const socket = useRef<Socket>(null);

	const connectToWebsocket = () => {
		socket.current = io(import.meta.env.VITE_WEBSOCKET_URL, {
			transports: ["websocket"],
		});

		// socket.current.emit(WebsocketEvents.UPDATE_DRIVER_LOCATION_IN_REALTIME, {
		// 	token: "",
		// 	payload: {
		// 		latitude: 0,
		// 		longitude: 0,
		// 	},
		// } as WebSocketRequest<AddDriveLocationDto>);
	};

	const handleOnLogin = () => {
		// connect to websocket
		setAction("simulate");
		connectToWebsocket();
	};

	return (
		<div>
			<h1 className="text-3xl">Driver</h1>
			{action === "login" && <Login onLogin={handleOnLogin} />}
		</div>
	);
}

export default Driver;
