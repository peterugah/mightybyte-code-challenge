import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { AppSocket } from "../../utils/socket";

function Client() {
	const client = useRef<AppSocket>(undefined);

	const connectToWebsocket = async () => {
		const socket = io(import.meta.env.VITE_WEBSOCKET_URL, {
			transports: ["websocket"],
		});
		client.current = new AppSocket(socket, "");
	};

	useEffect(() => {
		connectToWebsocket();
	}, []);
	return (
		<div>
			<h1 className="text-3xl">Client</h1>
		</div>
	);
}

export default Client;
