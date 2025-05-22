import Button from "./Button";

interface ControlsProps {
	onUpdateDriverLocationOnce: () => void;
}

function Controls({ onUpdateDriverLocationOnce }: ControlsProps) {
	return (
		<div className="">
			<Button onClick={onUpdateDriverLocationOnce}>
				Update Driver Location Once
			</Button>
		</div>
	);
}

export default Controls;
