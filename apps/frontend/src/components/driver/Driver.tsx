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

	const connectToWebsocket = async () => {
		const socket = io(import.meta.env.VITE_WEBSOCKET_URL, {
			transports: ["websocket"],
		});
		client.current = new AppSocket(socket, details?.token || "");
	};

	const handleOnUpdateDriverLocationOnce = () => {
		const { latitude, longitude } = generateRandomCoordinates();
		client.current?.emit<UpdateDriveLocationDto, unknown>(
			"UPDATE_DRIVER_LOCATION",
			{ latitude, longitude }
		);
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
		// websocket errors
		client.current?.on<WebSocketErrorResponse>("WEBSOCKET_ERROR", handleErrors);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [details]);

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
