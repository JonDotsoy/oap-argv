
export type Action = (command: string, moreCommands: string[], options: Record<string, string | boolean | string[]>) => Promise<number>

export class ActionControl {
  actions: Record<string, Action> = {}

  useAction(actionName: string, action: Action): void;
  useAction(actionName: string, aliasActionName: string, action: Action): void;
  useAction(actionName: string, aliasActionName: string, aliasActionName2: string, action: Action): void;
  useAction(actionName: string, aliasActionName: string, aliasActionName2: string, aliasActionName3: string, action: Action): void;
  useAction(...args: (string | Action)[]) {
    const actionNames: string[] = []
    for (const arg of args) {
      if (typeof arg === "string") {
        actionNames.push(arg)
      }
      if (typeof arg === "function") {
        for (const actionName of actionNames) {
          this.actions[actionName] = arg
        }
        return
      }
    }
    throw new Error("Cannot defined action function")
  }

  getAction(actionName: string): Action | undefined {
    return this.actions[actionName]
  }
}
