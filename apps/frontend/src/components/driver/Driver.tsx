import { useEffect, useRef, useState } from "react";
import Login from "../Login";
import { io } from "socket.io-client";
import { driverStore } from "../../store/driver.store";
import { AppSocket } from "../../utils/socket";
import Controls from "./Controls";
import { generateRandomCoordinates } from "../../utils/utils";
import type {
	UpdateDriveLocationDto,
	WebSocketErrorResponse,
} from "@monorepo/shared";

type actions = "login" | "controls";

function Driver() {
	const { details } = driverStore.store();
	const client = useRef<AppSocket>(undefined);
	const [action, setAction] = useState<actions>("login");

	const [clientId, setClientId] = useState<string>();

	const connectToWebsocket = async () => {
		const socket = io(import.meta.env.VITE_WEBSOCKET_URL, {
			transports: ["websocket"],
		});
		client.current = new AppSocket(socket, details?.token || "");

		socket.on("connect", () => {
			setClientId(socket.id);
		});
	};

	const handleOnUpdateDriverLocation = () => {
		const { latitude, longitude } = generateRandomCoordinates();
		client.current?.emit<UpdateDriveLocationDto, unknown>(
			"UPDATE_DRIVER_LOCATION",
			{ latitude, longitude }
		);
	};

	const handleLogout = () => {
		driverStore.reset();
		setAction("login");
	};

	const handleExpiredTokenError = (statusCode: number) => {
		if (statusCode === 600) {
			driverStore.reset();
			setAction("login");
		}
	};

	const handleErrors = (res: WebSocketErrorResponse) => {
		handleExpiredTokenError(res.statusCode);
	};

	const handleOnLogin = () => {
		setAction("controls");
	};

	useEffect(() => {
		connectToWebsocket();
		client.current?.on<WebSocketErrorResponse>("WEBSOCKET_ERROR", handleErrors);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [details]);

	// TODO: on component removal, clean websocket events

	return (
		<div>
			<h1 className="text-3xl">Driver</h1>
			<p>Client Id: {clientId}</p>
			{action === "login" && <Login onLogin={handleOnLogin} />}
			{action === "controls" && (
				<Controls
					onUpdateDriverLocation={handleOnUpdateDriverLocation}
					onLogout={handleLogout}
				/>
			)}
		</div>
	);
}

export default Driver;
