export function event(event: string, handler: (data?: { [key: string]: any; }) => void): void;

export function idle(handler: () => void): void;
