export type NodeClass = 'H_SEQUENCE' | 'H_STATE' | 'M_STATE' | 'M_SEQUENCE';

export type QuerySelectionDefinition = {
	text: string;
	labelMatch: NodeClass;
	nodeName: string;
	filter?: Record<string, string>;
};

export type QuerySelection = QuerySelectionDefinition & {
	selectedId: number;
};

export type QueryTemplate = {
	cypher: string;
	requires: {
		selections?: QuerySelectionDefinition[];
		input?: Record<string, string>;
	};
};
