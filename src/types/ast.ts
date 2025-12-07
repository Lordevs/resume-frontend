export type NodeType = "Root" | "Text" | "Command" | "Environment" | "MacroCall";

export interface TextNode {
  type: "Text";
  value: string;
}

export interface CommandNode {
  type: "Command";
  name: string;
  args?: AstNode[];
  options?: Record<string, string>;
  children?: AstNode[];
}

export interface EnvironmentNode {
  type: "Environment";
  name: string;
  args?: AstNode[];
  options?: Record<string, string>;
  children: AstNode[];
}

export interface MacroCallNode {
  type: "MacroCall";
  name: string;
  args: AstNode[];
  children?: AstNode[];
}

export interface RootNode {
  type: "Root";
  children: AstNode[];
}

export type AstNode = TextNode | CommandNode | EnvironmentNode | MacroCallNode | RootNode;
