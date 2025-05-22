import type { ReactNode } from "react";

interface ButtonProps {
	children: ReactNode;
	onClick: () => void;
}
function Button({ children, onClick }: ButtonProps) {
	return (
		<button
			onClick={onClick}
			className="bg-neutral-600 w-auto inline p-2 cursor-pointer rounded-lg hover:bg-neutral-700"
		>
			{children}
		</button>
	);
}
export default Button;
