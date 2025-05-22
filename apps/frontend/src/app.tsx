import Client from "./components/client/Client";
import Driver from "./components/driver/Driver";
import "./index.css";
function App() {
	return (
		<div className="flex flex-row bg-neutral-800 h-dvh w-auto text-neutral-100">
			<div className="flex-1 p-2">
				<Driver />
			</div>
			<div className="flex-1 p-2">
				<Client />
			</div>
		</div>
	);
}

export default App;
