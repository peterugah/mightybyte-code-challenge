import { useState } from "react";
import { driverStore } from "../store/driver.store";

interface Login {
	onLogin: () => void;
}

function Login({ onLogin }: Login) {
	const { requestState } = driverStore.store();
	const [username, setUsername] = useState("driverone");
	const [password, setPassword] = useState("demo");

	const updateUsername = (e: React.ChangeEvent<HTMLInputElement>) => {
		setUsername(e.target.value);
	};

	const updatePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
		setPassword(e.target.value);
	};

	const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		await driverStore.login({ username, password });
		// proceed to the next phase
		onLogin();
	};

	return (
		<div className="flex flex-col gap-2">
			<form onSubmit={handleLogin} className="flex flex-col gap-4">
				<input
					defaultValue={username}
					onChange={updateUsername}
					className="border-1 focus:border-neutral-700  border-neutral-700 rounded-xl p-2"
					type="text"
					placeholder="username"
				/>
				<input
					defaultValue={password}
					onChange={updatePassword}
					className="border-1 focus:border-neutral-700  border-neutral-700 rounded-xl p-2"
					type="password"
					placeholder="password"
				/>
				<button
					className="bg-blue-500 p-2 rounded-xl cursor-pointer"
					type="submit"
				>
					{requestState === "loading" ? "Processing..." : "Login"}
				</button>
				{requestState === "error" && (
					<label className="text-[12px] text-red-400">
						Error login in try again
					</label>
				)}
			</form>
			<h2 className="text-2xl">Instructions</h2>
			<p>
				You can login with the any driver below, all with the password:
				<span className="italic font-bold"> demo</span>
			</p>
			<ul className="list-none">
				<li className="before:content-['–'] before:mr-2">driverone</li>
				<li className="before:content-['–'] before:mr-2">drivertwo</li>
				<li className="before:content-['–'] before:mr-2">driverthree</li>
			</ul>
		</div>
	);
}

export default Login;
