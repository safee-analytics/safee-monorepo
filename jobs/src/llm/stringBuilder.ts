export class StringBuilder {
  #string = "";
  #lineNumber = 1;

  append(str: string): this {
    this.#string += str;
    return this;
  }

  appendLine(str: string): this {
    this.#string += str;
    this.newLine();
    return this;
  }

  appendObj(obj: Record<string, unknown>, indent = ""): this {
    for (const [key, value] of Object.entries(obj)) {
      this.appendLine(`${indent}${key}: ${JSON.stringify(value)}`);
    }
    return this;
  }

  newLine(count = 1): this {
    this.#string += "\n".repeat(count);
    return this;
  }

  openTag(tag: string): this {
    this.#string += `<${tag}>`;
    this.newLine();
    return this;
  }

  closeTag(tag: string): this {
    this.#string += `</${tag}>`;
    this.newLine();
    return this;
  }

  numberedLine(str: string): this {
    this.appendLine(`${this.#lineNumber}. ${str}`);
    this.#lineNumber++;
    return this;
  }

  restartNumbering(): this {
    this.#lineNumber = 1;
    return this;
  }

  toString(): string {
    return this.#string;
  }
}
