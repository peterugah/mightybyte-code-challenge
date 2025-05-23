import type { Driver } from "@monorepo/shared";
import Button from "../driver/Button";
import { useState } from "react";

interface DriverListProps {
	drivers: Driver[];
	onDriverSelect: (id: number) => void;
	onSubscribeToDriverRealtime: (id: number) => void;
	onSubscribeToDriverEveryFiveSeconds: (id: number) => void;
}
function DriverList({
	drivers,
	onDriverSelect,
	onSubscribeToDriverRealtime,
	onSubscribeToDriverEveryFiveSeconds,
}: DriverListProps) {
	const [showIndex, setShowIndex] = useState(0);
	return (
		<div>
			<ul>
				{drivers.map((item, index) => (
					<li key={item.id} className="before:content-['-'] before:mr-2 mb-2">
						<button
							className="cursor-pointer hover:text-neutral-200 text-blue-400 hover:underline"
							onClick={() => {
								onDriverSelect(item.id);
								setShowIndex(index);
							}}
						>
							{item.firstName} {item.lastName}
						</button>
						{showIndex === index && (
							<div className="ml-4 flex gap-2 mt-2">
								<Button onClick={() => onSubscribeToDriverRealtime(item.id)}>
									subscribe to realtime updates
								</Button>
								<Button
									onClick={() => onSubscribeToDriverEveryFiveSeconds(item.id)}
								>
									subscribe to updates every five seconds
								</Button>
							</div>
						)}
					</li>
				))}
			</ul>
		</div>
	);
}
export default DriverList;
