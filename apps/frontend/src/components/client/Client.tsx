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
	const [selectedDriver, setSelectedDriver] = useState<number | undefined>(
		undefined
	);
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

	const locationHandler = (response: DriverLocationDetailsResponse) => {
		setLocations((prev) => [response, ...prev]);
	};

	const subscribeToResponse = () => {
		client.current?.on("DRIVER_DETAILS_AND_LOCATION_RESPONSE", locationHandler);
	};

	const unsubscribeFromDriverUpdates = () => {
		client.current?.emit<string, string>(
			"UNSUBSCRIBE_FROM_DRIVER_LOCATION_UPDATE",
			""
		);
	};
	const unsubscribeFromDriverUpdatesEveryFiveSeconds = (id: number) => {
		client.current?.emit<GetDriverDetailsAndLocationDto, string>(
			"UNSUBSCRIBE_FROM_DRIVER_LOCATION_UPDATE_EVERY_FIVE_SECONDS",
			{ id }
		);
	};

	const subscribeToDriverRealtime = (id: number) => {
		setLocations([]);
		setSelectedDriver(id);
		unsubscribeFromDriverUpdatesEveryFiveSeconds(id);
		client.current?.emit<GetDriverDetailsAndLocationDto, string>(
			"SUBSCRIBE_TO_DRIVER_LOCATION_UPDATE",
			{ id }
		);
	};
	const subscribeToDriverEveryFiveSeconds = (id: number) => {
		setLocations([]);
		setSelectedDriver(id);
		unsubscribeFromDriverUpdates();
		client.current?.emit<GetDriverDetailsAndLocationDto, string>(
			"SUBSCRIBE_TO_DRIVER_LOCATION_UPDATE_EVERY_FIVE_SECONDS",
			{ id }
		);
	};

	const handleOnDriverSelect = () => {
		setLocations([]);
		unsubscribeFromDriverUpdates();
		if (selectedDriver) {
			unsubscribeFromDriverUpdatesEveryFiveSeconds(selectedDriver);
		}
	};

	useEffect(() => {
		getAllDrivers();
		connectToWebsocket();
		subscribeToResponse();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<div className="flex gap-2 flex-col">
			<h1 className="text-3xl">Client</h1>
			<h2 className="text-1xl">Select Driver</h2>
			<DriverList
				drivers={drivers}
				onDriverSelect={handleOnDriverSelect}
				onSubscribeToDriverRealtime={subscribeToDriverRealtime}
				onSubscribeToDriverEveryFiveSeconds={subscribeToDriverEveryFiveSeconds}
			/>
			<Locations locations={locations} />
		</div>
	);
}

export default Client;
