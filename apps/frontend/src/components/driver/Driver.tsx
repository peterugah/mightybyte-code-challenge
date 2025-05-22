import { useEffect, useRef, useState } from "react";
import Login from "../Login";
import { io } from "socket.io-client";
import { driverStore } from "../../store/driver.store";
import { AppSocket } from "../../utils/socket";
import Controls from "./Controls";
import { generateRandomCoordinates } from "../../utils/utils";
import type { UpdateDriveLocationDto } from "@monorepo/shared";

type actions = "login" | "controls";

function Driver() {
	const { details } = driverStore.store();
	const client = useRef<AppSocket>(undefined);
	const [action, setAction] = useState<actions>("login");

	const connectToWebsocket = async () => {
		const socket = io(import.meta.env.VITE_WEBSOCKET_URL, {
			transports: ["websocket"],
		});
		client.current = new AppSocket(socket, details?.token || "");
	};

	const handleOnUpdateDriverLocationOnce = () => {
		const { latitude, longitude } = generateRandomCoordinates();
		client.current?.send<UpdateDriveLocationDto, unknown>(
			"UPDATE_DRIVER_LOCATION",
			{ latitude, longitude }
		);
	};

	const handleExpiredTokenError = (statusCode: number) => {
		if (statusCode === 600) {
			// INFO: I'm not implementing the refresh token logic, I'll just prompt the user to log in again
			driverStore.reset();
			setAction("login");
		}
	};

	const handleErrors = () => {
		// client.current
		// 	?.on<WebSocketErrorResponse>("WEBSOCKET_ERROR")
		// 	.then((res) => {
		// 		// check if token is expired
		// 		handleExpiredTokenError(res.statusCode);
		// 	});
	};

	const handleOnLogin = () => {
		// connect to websocket
		setAction("controls");
		connectToWebsocket();
	};

	useEffect(() => {
		handleErrors();
		return () => {};
	}, []);

	return (
		<div>
			<h1 className="text-3xl">Driver</h1>
			{action === "login" && <Login onLogin={handleOnLogin} />}
			{action === "controls" && (
				<Controls
					onUpdateDriverLocationOnce={handleOnUpdateDriverLocationOnce}
				/>
			)}
		</div>
	);
}

export default Driver;
