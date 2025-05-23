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
import { driverStore } from "../../store/driver.store";

function Client() {
	const client = useRef<AppSocket>(undefined);

	const [drivers, setDrivers] = useState<Driver[]>([]);
	const [clientId, setClientId] = useState<string>();
	const [locations, setLocations] = useState<DriverLocationDetailsResponse[]>(
		[]
	);
	const { details } = driverStore.store();

	const connectToWebsocket = async () => {
		const socket = io(import.meta.env.VITE_WEBSOCKET_URL, {
			transports: ["websocket"],
		});
		client.current = new AppSocket(socket, details?.token || "");

		socket.on("connect", () => {
			setClientId(socket.id);
		});
	};

	const getAllDrivers = async () => {
		const drivers = await driverClient.getAll();
		setDrivers(drivers);
	};

	const locationHandler = (response: DriverLocationDetailsResponse) => {
		setLocations((prev) => [response, ...prev]);
	};

	const listentToDriverDetailsEvent = () => {
		client.current?.on("DRIVER_DETAILS_AND_LOCATION_RESPONSE", locationHandler);
	};

	const listenToDriverOfflineEvent = () => {
		client.current?.on("OFFLINE_DRIVER", locationHandler);
	};
	const unsubscribeFromDriverUpdates = () => {
		client.current?.emit<string, string>(
			"UNSUBSCRIBE_FROM_DRIVER_LOCATION_UPDATE",
			""
		);
	};
	const unsubscribeFromDriverUpdatesEveryFiveSeconds = () => {
		client.current?.emit<string, string>(
			"UNSUBSCRIBE_TO_DRIVER_LOCATION_UPDATE_EVERY_FIVE_SECONDS",
			""
		);
	};

	const subscribeToDriverRealtime = (id: number) => {
		setLocations([]);
		unsubscribeFromDriverUpdatesEveryFiveSeconds();
		client.current?.emit<GetDriverDetailsAndLocationDto, string>(
			"SUBSCRIBE_TO_DRIVER_LOCATION_UPDATE",
			{ id }
		);
	};
	const subscribeToDriverEveryFiveSeconds = (id: number) => {
		setLocations([]);
		unsubscribeFromDriverUpdates();
		client.current?.emit<GetDriverDetailsAndLocationDto, string>(
			"SUBSCRIBE_TO_DRIVER_LOCATION_UPDATE_EVERY_FIVE_SECONDS",
			{ id }
		);
	};

	const handleOnDriverSelect = () => {
		setLocations([]);
		unsubscribeFromDriverUpdates();
	};

	useEffect(() => {
		getAllDrivers();
		connectToWebsocket();
		listenToDriverOfflineEvent();
		listentToDriverDetailsEvent();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// TODO: on component removal, clean websocket events

	return (
		<div className="flex gap-2 flex-col">
			<h1 className="text-3xl">Client</h1>
			<p>Client Id: {clientId}</p>
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
