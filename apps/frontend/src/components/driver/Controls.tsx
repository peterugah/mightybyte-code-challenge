import { driverStore } from "../../store/driver.store";
import Button from "./Button";

interface ControlsProps {
	onUpdateDriverLocation: () => void;
	onLogout: () => void;
}

function Controls({ onUpdateDriverLocation, onLogout }: ControlsProps) {
	const { details } = driverStore.store();
	return (
		<>
			<div className="py-4">
				<h1>Logged in Driver</h1>
				<p>
					<strong>ID</strong>: {details?.id}
				</p>
				<p>
					<strong>NAME</strong>: {details?.firstName} {details?.lastName}
				</p>
			</div>
			<div className="flex gap-2">
				<Button onClick={onUpdateDriverLocation}>Update Driver Location</Button>
				<Button onClick={onLogout}>Logout</Button>
			</div>
		</>
	);
}

export default Controls;
