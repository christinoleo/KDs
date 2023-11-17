import type { ScaleOrdinal } from 'd3';

export type neo4JURL = {
	screenWidth: number;
	screenHeight: number;
	href: string;
};

export type neo4jURL = {
	href: string;
	screenWidth: number;
	screenHeight: number;
};

export type neo4jNode = {
	identity: number;
	labels: string[];
	distance: number;
	properties: Record<string, string>;
};

export type neo4jRelationship = {
	identity: number;
	start: number;
	end: number;
	type: string;
	properties: Record<string, string>;
};

export type PosI = { x: number; y: number };
export type FPosI = { fx?: number | null; fy?: number | null };
export type PosLinkI = {
	id: number;
	x: number;
	y: number;
	source: any;
	target: any;
};

export type NodeVisuals = {
	inSlidePosition: number;
	slide?: string;
};

export type NodeI = PosI & FPosI & neo4jNode & { id: number; visuals: NodeVisuals };
export type EdgeI = PosLinkI & neo4jRelationship;

export type NeoGraphI = {
	nodes: neo4jNode[];
	edges: neo4jRelationship[];
};
export type GraphI = {
	nodes: NodeI[];
	edges: EdgeI[];
};
export type SlideI = {
	href: string;
	width: number;
	height: number;
	picture?: string;
};
