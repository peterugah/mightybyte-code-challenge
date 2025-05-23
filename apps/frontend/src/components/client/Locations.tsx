import type { DriverLocationDetailsResponse } from "@monorepo/shared";

interface LocationsProp {
	locations: DriverLocationDetailsResponse[];
}
function Locations({ locations }: LocationsProp) {
	return (
		<div>
			<ul>
				{locations.map((location, index) => (
					<li key={index} className="text-[16px]">
						{location.driver.firstName} {location.driver.lastName}: [
						{location.location.latitude} , {location.location.longitude}]{" "}
						{location.message}
					</li>
				))}
			</ul>
		</div>
	);
}

export default Locations;
