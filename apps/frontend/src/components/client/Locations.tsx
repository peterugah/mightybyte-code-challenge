import type { DriverLocationDetailsResponse } from "@monorepo/shared";

interface LocationsProp {
	locations: DriverLocationDetailsResponse[];
}
function Locations({ locations }: LocationsProp) {
	return (
		<div>
			<ul>
				{locations.map((location, index) => (
					<li key={index}>
						[{location.location.latitude} , {location.location.longitude}]
					</li>
				))}
			</ul>
		</div>
	);
}

export default Locations;
