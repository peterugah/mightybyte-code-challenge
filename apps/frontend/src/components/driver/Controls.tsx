import { driverStore } from "../../store/driver.store";
import Button from "./Button";

interface ControlsProps {
	onUpdateDriverLocationOnce: () => void;
}

function Controls({ onUpdateDriverLocationOnce }: ControlsProps) {
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
			<Button onClick={onUpdateDriverLocationOnce}>
				Update Driver Location Once
			</Button>
		</>
	);
}

export default Controls;
