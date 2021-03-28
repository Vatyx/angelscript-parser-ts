// string format function
export const Format = function (...fmt: string[]) {
	return fmt.reduce((a, b) => a.replace(/%./, b), this as string);
}

// add function into string prototype
declare global {
	interface String {
		Format(...fmt: string[]): string;
	}
}

String.prototype.Format = Format;