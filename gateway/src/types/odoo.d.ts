/**
 * Odoo Frontend Type Definitions
 *
 * Re-exported from odoo/addons/web/static/src/@types for use in the gateway
 * These types are useful when working with Odoo's RPC API and understanding responses
 */

// ============================================================================
// Core Odoo Module System
// ============================================================================

export interface OdooModuleErrors {
  cycle?: string | null;
  failed?: Set<string>;
  missing?: Set<string>;
  unloaded?: Set<string>;
}

export interface OdooModuleFactory {
  deps: string[];
  fn: OdooModuleFactoryFn;
  ignoreMissingDeps: boolean;
}

export class OdooModuleLoader {
  bus: EventTarget;
  checkErrorProm: Promise<void> | null;
  debug: boolean;
  /**
   * Mapping [name => factory]
   */
  factories: Map<string, OdooModuleFactory>;
  /**
   * Names of failed modules
   */
  failed: Set<string>;
  /**
   * Names of modules waiting to be started
   */
  jobs: Set<string>;
  /**
   * Mapping [name => module]
   */
  modules: Map<string, OdooModule>;

  constructor(root?: HTMLElement);

  addJob: (name: string) => void;

  define: (name: string, deps: string[], factory: OdooModuleFactoryFn, lazy?: boolean) => OdooModule;

  findErrors: (jobs?: Iterable<string>) => OdooModuleErrors;

  findJob: () => string | null;

  reportErrors: (errors: OdooModuleErrors) => Promise<void>;

  sortFactories: () => void;

  startModule: (name: string) => OdooModule;

  startModules: () => void;
}

export type OdooModule = Record<string, unknown>;

export type OdooModuleFactoryFn = (require: (dependency: string) => OdooModule) => OdooModule;

export interface OdooGlobal {
  csrf_token: string;
  debug: string;
  define: OdooModuleLoader["define"];
  loader: OdooModuleLoader;
}

// ============================================================================
// Odoo Registry System
// ============================================================================

export interface Registry<T = unknown> {
  add(key: string, value: T): T;
  get(key: string): T;
  contains(key: string): boolean;
  getAll(): [string, T][];
  getEntries(): [string, T][];
  getAny(keys: string[]): T | undefined;
  remove(key: string): void;
  category?: string;
  elements: Map<string, T>;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
  trigger(type: string, ...args: unknown[]): void;
}

// ============================================================================
// Odoo Field Definitions
// ============================================================================

export type DomainListRepr = unknown[]; // Simplified - actual type is complex

export interface IFieldDefinition<T extends FieldType> {
  change_default: boolean;
  groupable: boolean;
  groups?: string;
  help?: string;
  name: string;
  readonly: boolean;
  related?: string;
  required: boolean;
  searchable: boolean;
  sortable: boolean;
  store: boolean;
  string: string;
  type: T;
}

export interface IRelational {
  context: string | object;
  domain: string | DomainListRepr;
  relation: string;
}

export interface INumerical {
  aggregator:
    | "array_agg_distinct"
    | "array_agg"
    | "avg"
    | "bool_and"
    | "bool_or"
    | "count_distinct"
    | "count"
    | "max"
    | "min"
    | "sum";
}

export interface ITextual {
  translate: boolean;
}

// Field Types
export type FieldType =
  | "binary"
  | "boolean"
  | "char"
  | "date"
  | "datetime"
  | "float"
  | "html"
  | "image"
  | "integer"
  | "json"
  | "many2many"
  | "many2one"
  | "many2one_reference"
  | "monetary"
  | "one2many"
  | "properties"
  | "reference"
  | "selection"
  | "text";

export type BinaryFieldDefinition = IFieldDefinition<"binary">;

export type BooleanFieldDefinition = IFieldDefinition<"boolean">;

export type CharFieldDefinition = IFieldDefinition<"char"> &
  ITextual & {
    size?: number;
    trim: boolean;
  };

export type DateFieldDefinition = IFieldDefinition<"date">;

export type DateTimeFieldDefinition = IFieldDefinition<"datetime">;

export type FloatFieldDefinition = IFieldDefinition<"float"> & INumerical;

export type HtmlFieldDefinition = IFieldDefinition<"html"> &
  ITextual & {
    sanitize: boolean;
    sanitize_tags: boolean;
  };

export type ImageFieldDefinition = IFieldDefinition<"image">;

export type IntegerFieldDefinition = IFieldDefinition<"integer"> & INumerical;

export type JsonFieldDefinition = IFieldDefinition<"json">;

export type Many2ManyFieldDefinition = IFieldDefinition<"many2many"> & IRelational;

export type Many2OneFieldDefinition = IFieldDefinition<"many2one"> & IRelational;

export type Many2OneReferenceFieldDefinition = IFieldDefinition<"many2one_reference">;

export type MonetaryFieldDefinition = IFieldDefinition<"monetary"> &
  INumerical & {
    currency_field: string;
  };

export type One2ManyFieldDefinition = IFieldDefinition<"one2many"> &
  IRelational & {
    relation_field: string;
  };

export type PropertiesFieldDefinition = IFieldDefinition<"properties"> & {
  definition_record: string;
  definition_record_field: string;
};

export type ReferenceFieldDefinition = IFieldDefinition<"reference"> & {
  selection: [string, string][];
};

export type SelectionFieldDefinition = IFieldDefinition<"selection"> & {
  selection: [string, string][];
};

export type TextFieldDefinition = IFieldDefinition<"text"> & ITextual;

export type FieldDefinition =
  | BinaryFieldDefinition
  | BooleanFieldDefinition
  | CharFieldDefinition
  | DateFieldDefinition
  | DateTimeFieldDefinition
  | FloatFieldDefinition
  | HtmlFieldDefinition
  | ImageFieldDefinition
  | IntegerFieldDefinition
  | JsonFieldDefinition
  | Many2ManyFieldDefinition
  | Many2OneFieldDefinition
  | Many2OneReferenceFieldDefinition
  | MonetaryFieldDefinition
  | One2ManyFieldDefinition
  | PropertiesFieldDefinition
  | ReferenceFieldDefinition
  | SelectionFieldDefinition
  | TextFieldDefinition;

export type Fields = Record<string, FieldDefinition>;

export {};
