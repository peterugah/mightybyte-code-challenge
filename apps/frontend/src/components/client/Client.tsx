import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { AppSocket } from "../../utils/socket";
import { driverClient } from "../../clients/driver.client";
import type {
	Driver,
	DriverLocationDetailsResponse,
	GetDriverDetailsAndLocationDto,
} from "@monorepo/shared";
import DriverList from "./DriverList";
import Locations from "./Locations";

function Client() {
	const client = useRef<AppSocket>(undefined);

	const [drivers, setDrivers] = useState<Driver[]>([]);
	const [locations, setLocations] = useState<DriverLocationDetailsResponse[]>(
		[]
	);

	const connectToWebsocket = async () => {
		const socket = io(import.meta.env.VITE_WEBSOCKET_URL, {
			transports: ["websocket"],
		});
		client.current = new AppSocket(socket, "");
	};

	const getAllDrivers = async () => {
		const drivers = await driverClient.getAll();
		setDrivers(drivers);
	};

	const listenToDriverUpdatesRealtime = () => {
		client.current?.on<DriverLocationDetailsResponse>(
			"DRIVER_DETAILS_AND_LOCATION_RESPONSE",
			(response) => {
				setLocations((prev) => [response, ...prev]);
			}
		);
	};

	const subscribeToDriverRealtime = (id: number) => {
		setLocations([]);
		client.current?.send<GetDriverDetailsAndLocationDto, string>(
			"SUBSCRIBE_TO_DRIVER_LOCATION_UPDATE_IN_REALTIME",
			{ id }
		);
	};
	const subscribeToDriverEveryFiveSeconds = (id: number) => {
		setLocations([]);
		client.current?.send<GetDriverDetailsAndLocationDto, string>(
			"SUBSCRIBE_TO_DRIVER_LOCATION_UPDATE_EVERY_FIVE_SECONDS",
			{ id }
		);
	};

	useEffect(() => {
		getAllDrivers();
		connectToWebsocket();
		listenToDriverUpdatesRealtime();
	}, []);

	return (
		<div className="flex gap-2 flex-col">
			<h1 className="text-3xl">Client</h1>
			<h2 className="text-1xl">Select Driver</h2>
			<DriverList
				drivers={drivers}
				onSubscribeToDriverRealtime={subscribeToDriverRealtime}
				onSubscribeToDriverEveryFiveSeconds={subscribeToDriverEveryFiveSeconds}
			/>
			<Locations locations={locations} />
		</div>
	);
}

export default Client;
