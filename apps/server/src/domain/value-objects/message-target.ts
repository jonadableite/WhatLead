export type MessageTarget =
	| { kind: "PHONE"; value: string }
	| { kind: "GROUP"; value: string };

